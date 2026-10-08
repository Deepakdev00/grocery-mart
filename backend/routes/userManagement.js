const express = require('express');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { requireAdmin: adminAuthMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Helper to get client IP
const getClientIp = (req) => {
  return req.ip || req.socket.remoteAddress || null;
};

// Helper to get user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || null;
};

const parseLogBoundary = (value, endOfDay = false) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
};

// Admin authentication middleware
// Apply admin authentication to all routes in this router
router.use(adminAuthMiddleware);

// ─── 1. GET /users - List all users (Admin only) ──────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const validSortFields = ['createdAt', 'updatedAt', 'username', 'email', 'role', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {};

    if (search) {
      const searchTrimmed = search.trim();
      where.OR = [
        { username: { contains: searchTrimmed, mode: 'insensitive' } },
        { email: { contains: searchTrimmed, mode: 'insensitive' } },
        { phone: { contains: searchTrimmed, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDirection },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          address: true,
          _count: {
            select: {
              activeSessions: { where: { isActive: true } }
            }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// ─── 2. POST /users - Admin creates a user account ────────────────────────────
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role = 'customer', phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const validRoles = ['customer', 'staff', 'supplier', 'retailer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.trim() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'customer',
        status: 'active',
        phone: phone ? phone.trim() : null,
        profile: {
          create: {
            phoneNumber: phone ? phone.trim() : null
          }
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        profile: true
      }
    });

    // Create ActivityLog entry
    await prisma.activityLog.create({
      data: {
        userId: newUser.id,
        action: 'user_created',
        details: JSON.stringify({
          createdByAdminId: req.adminId,
          adminUsername: req.admin.username,
          createdUserId: newUser.id,
          role: newUser.role,
          email: newUser.email,
          message: 'User account created by admin'
        }),
        ipAddress: getClientIp(req)
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// ─── 3. GET /users/:userId - Get specific user details ────────────────────────
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        address: true,
        loginLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            activeSessions: { where: { isActive: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeSessionsCount = user._count?.activeSessions || 0;
    const { _count, ...userData } = user;

    res.json({
      user: {
        ...userData,
        activeSessionsCount
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
});

// ─── 4. PUT /users/:userId/status - Toggle user active/inactive ───────────────
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed statuses: ${validStatuses.join(', ')}`
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        profile: true
      }
    });

    // If setting to inactive/suspended, deactivate all user active sessions
    if (status === 'inactive' || status === 'suspended') {
      await prisma.activeSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });
    }

    // Create ActivityLog entry
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'status_change',
        details: JSON.stringify({
          oldStatus: existingUser.status,
          newStatus: status,
          changedByAdminId: req.adminId,
          adminUsername: req.admin.username
        }),
        ipAddress: getClientIp(req)
      }
    });

    // Create LoginLog entry if account is suspended
    if (status === 'suspended') {
      await prisma.loginLog.create({
        data: {
          userId,
          email: existingUser.email,
          action: 'account_locked',
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        }
      });
    }

    res.json({
      message: `User status updated to ${status}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// ─── 5. PUT /users/:userId/role - Change user role ────────────────────────────
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['customer', 'staff', 'supplier', 'retailer'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        profile: true
      }
    });

    // Create ActivityLog entry
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'role_change',
        details: JSON.stringify({
          oldRole: existingUser.role,
          newRole: role,
          changedByAdminId: req.adminId,
          adminUsername: req.admin.username
        }),
        ipAddress: getClientIp(req)
      }
    });

    res.json({
      message: `User role updated to ${role}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// ─── 6. GET /users/:userId/sessions - Get user's active sessions ──────────────
router.get('/users/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sessions = await prisma.activeSession.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        deviceInfo: true,
        loginAt: true,
        lastActiveAt: true,
        expiresAt: true,
        isActive: true
      },
      orderBy: {
        lastActiveAt: 'desc'
      }
    });

    res.json({
      userId,
      activeSessions: sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ message: 'Server error fetching user sessions' });
  }
});

// ─── 7. DELETE /users/:userId/sessions - Force logout user ────────────────────
router.delete('/users/:userId/sessions', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await prisma.activeSession.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    // Create ActivityLog entry
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'force_logout',
        details: JSON.stringify({
          terminatedByAdminId: req.adminId,
          adminUsername: req.admin.username,
          terminatedSessionsCount: result.count
        }),
        ipAddress: getClientIp(req)
      }
    });

    res.json({
      message: 'All user sessions terminated successfully',
      terminatedCount: result.count
    });
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    res.status(500).json({ message: 'Server error terminating user sessions' });
  }
});

// ─── 8. GET /login-logs - Get access logs / audit trail ───────────────────────
router.get('/login-logs', async (req, res) => {
  try {
    const {
      userId,
      email,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    const startBoundary = startDate ? parseLogBoundary(startDate) : undefined;
    const endBoundary = endDate ? parseLogBoundary(endDate, true) : undefined;
    if ((startDate && !startBoundary) || (endDate && !endBoundary)) {
      return res.status(400).json({ message: 'Invalid log date filter' });
    }
    if (startBoundary && endBoundary && startBoundary > endBoundary) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    if (userId) {
      where.userId = userId;
    }

    if (email) {
      where.email = { contains: email.trim(), mode: 'insensitive' };
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startBoundary) where.createdAt.gte = startBoundary;
      if (endBoundary) where.createdAt.lte = endBoundary;
    } else {
      // Default last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = {
        gte: sevenDaysAgo
      };
    }

    const [total, logs] = await Promise.all([
      prisma.loginLog.count({ where }),
      prisma.loginLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true
            }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      loginLogs: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ message: 'Server error fetching login logs' });
  }
});

// ─── 9. GET /activity-logs - Get activity logs ────────────────────────────────
router.get('/activity-logs', async (req, res) => {
  try {
    const {
      userId,
      action,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    const searchTerm = typeof search === 'string' ? search.trim() : '';

    if (searchTerm.length > 100) {
      return res.status(400).json({ message: 'Search must be 100 characters or fewer' });
    }

    const startBoundary = startDate ? parseLogBoundary(startDate) : undefined;
    const endBoundary = endDate ? parseLogBoundary(endDate, true) : undefined;
    if ((startDate && !startBoundary) || (endDate && !endBoundary)) {
      return res.status(400).json({ message: 'Invalid log date filter' });
    }
    if (startBoundary && endBoundary && startBoundary > endBoundary) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (searchTerm) {
      where.OR = [
        { action: { contains: searchTerm, mode: 'insensitive' } },
        { details: { contains: searchTerm, mode: 'insensitive' } },
        { ipAddress: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startBoundary) where.createdAt.gte = startBoundary;
      if (endBoundary) where.createdAt.lte = endBoundary;
    }

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true
            }
          }
        }
      })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      activityLogs: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
});

// ─── 10. GET /dashboard/stats - Auth related stats ────────────────────────────
router.get('/dashboard/stats', async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      activeUsers,
      newUsersLast7Days,
      loginCountToday,
      activeSessionsCount,
      usersByRole,
      usersByStatus
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.loginLog.count({
        where: {
          createdAt: { gte: startOfToday }
        }
      }),
      prisma.activeSession.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    const roleBreakdown = {};
    usersByRole.forEach((item) => {
      roleBreakdown[item.role] = item._count.role;
    });

    const statusBreakdown = {};
    usersByStatus.forEach((item) => {
      statusBreakdown[item.status] = item._count.status;
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        newUsersLast7Days,
        loginCountToday,
        activeSessionsCount,
        usersByRole: roleBreakdown,
        usersByStatus: statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching user management stats:', error);
    res.status(500).json({ message: 'Server error fetching user management stats' });
  }
});

module.exports = router;
