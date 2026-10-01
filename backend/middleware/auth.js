const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'grocery_mart_secret_key_2024';

/**
 * 1. Standard JWT Auth Middleware
 * - Extracts Bearer token from Authorization header
 * - Verifies JWT
 * - Looks up user via PrismaClient
 * - Verifies user status is 'active'
 * - Updates session lastActiveAt in ActiveSession table
 * - Attaches req.user (without password) and req.userId
 * - Handles JsonWebTokenError and TokenExpiredError specifically
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization') || req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: `Account is ${user.status || 'inactive'}` });
    }

    // Update session lastActiveAt in ActiveSession if active session exists
    try {
      await prisma.activeSession.updateMany({
        where: {
          token: token,
          userId: user.id,
          isActive: true
        },
        data: {
          lastActiveAt: new Date()
        }
      });
    } catch (sessionErr) {
      console.error('ActiveSession update error:', sessionErr.message);
    }

    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    req.userId = user.id;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(500).json({ message: 'Server error in authentication' });
  }
};

/**
 * 2. Optional Auth Middleware
 * - Extracts and verifies token if present
 * - Looks up user and checks active status
 * - Attaches req.user (without password) and req.userId if valid
 * - Does not fail request if token is missing or invalid
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization') || req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (user && user.status === 'active') {
      // Update session lastActiveAt in ActiveSession if active session exists
      try {
        await prisma.activeSession.updateMany({
          where: {
            token: token,
            userId: user.id,
            isActive: true
          },
          data: {
            lastActiveAt: new Date()
          }
        });
      } catch (sessionErr) {
        // Ignore session update error in optional auth
      }

      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      req.userId = user.id;
      req.token = token;
    }

    next();
  } catch (error) {
    // Token invalid or expired, continue without user
    next();
  }
};

/**
 * 3. Admin Auth Middleware
 * - Verifies JWT with adminId payload
 * - Looks up admin via prisma.admin.findUnique
 * - Verifies AdminSession is active
 * - Attaches req.admin and req.adminId
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization') || req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided, admin authorization denied' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const decoded = jwt.verify(token, JWT_SECRET);

    const adminId = decoded.adminId || decoded.userId;
    if (!adminId) {
      return res.status(401).json({ message: 'Invalid admin token' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    // Verify AdminSession is active
    const adminSession = await prisma.adminSession.findFirst({
      where: {
        token: token,
        adminId: admin.id,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!adminSession) {
      return res.status(401).json({ message: 'Invalid or expired admin session' });
    }

    // Update lastSeenAt for AdminSession
    try {
      await prisma.adminSession.update({
        where: { id: adminSession.id },
        data: { lastSeenAt: new Date() }
      });
    } catch (sessionErr) {
      console.error('AdminSession update error:', sessionErr.message);
    }

    const { password, ...adminWithoutPassword } = admin;
    req.admin = adminWithoutPassword;
    req.adminId = admin.id;
    req.adminSession = adminSession;
    req.token = token;

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(500).json({ message: 'Server error in admin authentication' });
  }
};

/**
 * 4. Role-Based Access Middleware
 * - Must run after auth middleware
 * - Checks if req.user.role is in allowed roles
 * - Returns 403 if role not permitted
 */
const requireRole = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied: insufficient role permissions'
      });
    }

    next();
  };
};

/**
 * 5. Permission-Based Access Middleware
 * - Must run after auth middleware
 * - Looks up user's role in RolePermissionMap
 * - Checks if any required permission is mapped to the user's role
 * - Returns 403 if no permission
 */
const requirePermission = (...permissions) => {
  const requiredPermissions = permissions.flat();

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userRole = req.user.role;
      if (!userRole) {
        return res.status(403).json({ message: 'Access denied: no role assigned' });
      }

      // Look up role with its mapped permissions
      const roleRecord = await prisma.role.findUnique({
        where: { name: userRole },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!roleRecord) {
        return res.status(403).json({ message: 'Access denied: role not configured' });
      }

      const rolePermissionNames = roleRecord.permissions
        .map((rp) => rp.permission && rp.permission.name)
        .filter(Boolean);

      const hasPermission = requiredPermissions.some((perm) =>
        rolePermissionNames.includes(perm)
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Access denied: insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error.message);
      return res.status(500).json({ message: 'Server error checking permissions' });
    }
  };
};

/**
 * 6. Session Validation Middleware
 * - Must run after auth
 * - Verifies token exists in ActiveSession and isActive
 * - Checks expiresAt hasn't passed
 * - Updates lastActiveAt
 */
const sessionCheck = async (req, res, next) => {
  try {
    const token =
      req.token ||
      (req.header('Authorization')
        ? req.header('Authorization').replace('Bearer ', '').trim()
        : null);

    const userId = req.userId || req.user?.id;

    if (!token || !userId) {
      return res.status(401).json({ message: 'Authentication required for session check' });
    }

    const session = await prisma.activeSession.findFirst({
      where: {
        token: token,
        userId: userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return res.status(401).json({ message: 'Session is invalid or expired' });
    }

    // Update lastActiveAt
    await prisma.activeSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    });

    req.session = session;
    next();
  } catch (error) {
    console.error('Session check error:', error.message);
    return res.status(500).json({ message: 'Server error validating session' });
  }
};

/**
 * 7. Activity Logging Middleware
 * - Creates an ActivityLog entry with userId, action, ipAddress, details
 */
const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId || req.user?.id || null;
      const ipAddress =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        null;

      const actionName =
        typeof action === 'function'
          ? action(req)
          : action || `${req.method} ${req.baseUrl || ''}${req.path}`;

      const details = JSON.stringify({
        method: req.method,
        path: req.originalUrl || req.path,
        params: req.params,
        query: req.query,
        userAgent: req.headers['user-agent']
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: actionName,
          ipAddress: typeof ipAddress === 'string' ? ipAddress.substring(0, 45) : null,
          details
        }
      });
    } catch (error) {
      console.error('Activity log error:', error.message);
    }

    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  requireRole,
  requirePermission,
  sessionCheck,
  logActivity
};
