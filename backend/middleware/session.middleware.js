const prisma = require('../config/prisma');

const loadUserSession = (token, userId) => prisma.activeSession.findFirst({
  where: {
    token,
    userId,
    isActive: true,
    expiresAt: { gt: new Date() },
  },
  select: {
    userId: true,
    user: { select: { role: true, status: true } },
  },
});

const loadAdminSession = (token, adminId) => prisma.adminSession.findFirst({
  where: {
    token,
    adminId,
    isActive: true,
    expiresAt: { gt: new Date() },
  },
  select: {
    adminId: true,
    admin: { select: { id: true, username: true, email: true, role: true } },
  },
});

module.exports = { loadUserSession, loadAdminSession };
