const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'grocery_mart_secret_key_2024';

// Middleware to verify admin token
const adminAuthMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/admin/dashboard/stats
// Get dashboard statistics
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    // Total users
    const totalUsers = await prisma.user.count();

    // Total orders
    const totalOrders = await prisma.payment.count();

    // Total revenue
    const revenueResult = await prisma.payment.aggregate({
      _sum: { grandTotal: true }
    });
    const totalRevenue = revenueResult._sum.grandTotal || 0;

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await prisma.payment.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Today's revenue
    const todayRevenueResult = await prisma.payment.aggregate({
      _sum: { grandTotal: true },
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    const todayRevenue = todayRevenueResult._sum.grandTotal || 0;

    // Average order value
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

    res.json({
      stats: {
        totalUsers,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        todayOrders,
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        avgOrderValue: parseFloat(avgOrderValue)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// GET /api/admin/dashboard/orders
// Get all orders with details
router.get('/orders', adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await prisma.payment.findMany({
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      orders: orders.map(order => ({
        id: order.id,
        user: order.user,
        itemCount: order.items.length,
        itemTotal: order.itemTotal,
        deliveryFee: order.deliveryFee,
        handlingFee: order.handlingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        items: order.items
      }))
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// GET /api/admin/dashboard/users
// Get all users
router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        payments: true,
        _count: {
          select: { payments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate total spent per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalSpent = await prisma.payment.aggregate({
          _sum: { grandTotal: true },
          where: { userId: user.id }
        });

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          orderCount: user._count.payments,
          totalSpent: parseFloat((totalSpent._sum.grandTotal || 0).toFixed(2)),
          createdAt: user.createdAt
        };
      })
    );

    res.json({ users: usersWithStats });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// GET /api/admin/dashboard/daily-orders
// Get daily order count for last 30 days
router.get('/daily-orders', adminAuthMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        grandTotal: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const dailyData = {};
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { orders: 0, revenue: 0 };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += order.grandTotal;
    });

    // Fill in missing dates with 0
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const data = dailyData[dateStr] || { orders: 0, revenue: 0 };
      chartData.push({
        date: dateStr,
        orders: data.orders,
        revenue: parseFloat(data.revenue.toFixed(2))
      });
    }

    res.json({ dailyOrders: chartData });
  } catch (error) {
    console.error('Daily orders error:', error);
    res.status(500).json({ message: 'Server error fetching daily orders' });
  }
});

// GET /api/admin/dashboard/sessions
// Get active admin sessions
router.get('/sessions', adminAuthMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.adminSession.findMany({
      where: { isActive: true },
      include: {
        admin: {
          select: { id: true, username: true, email: true }
        }
      },
      orderBy: { loginAt: 'desc' }
    });

    res.json({
      sessions: sessions.map(session => ({
        id: session.id,
        admin: session.admin,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        loginAt: session.loginAt,
        lastSeenAt: session.lastSeenAt,
        expiresAt: session.expiresAt
      }))
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ message: 'Server error fetching sessions' });
  }
});

module.exports = router;
