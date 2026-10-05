const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/auth');
const { readCookie } = require('./cookies');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requireUser = async (req, res, next) => {
  const token = readCookie(req, 'gm_access');
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid user session' });
    }
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  try {
    const session = await prisma.activeSession.findFirst({
      where: { token, userId: decoded.userId, isActive: true, expiresAt: { gt: new Date() } },
      select: { userId: true, user: { select: { status: true } } }
    });
    if (!session || session.user?.status !== 'active') {
      return res.status(401).json({ message: 'Session is no longer active' });
    }
    req.userId = session.userId;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  const token = readCookie(req, 'gm_admin');
  if (!token) return res.status(401).json({ message: 'Admin authentication required' });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.adminId) {
      return res.status(401).json({ message: 'Invalid admin session' });
    }
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin session' });
  }

  try {
    const session = await prisma.adminSession.findFirst({
      where: { token, adminId: decoded.adminId, isActive: true, expiresAt: { gt: new Date() } },
      select: {
        adminId: true,
        admin: { select: { id: true, username: true, email: true, role: true } }
      }
    });
    if (!session) {
      return res.status(401).json({ message: 'Admin session is no longer active' });
    }
    req.adminId = session.adminId;
    req.admin = session.admin;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireUser, requireAdmin };
