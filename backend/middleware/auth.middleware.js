const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { AUTH_COOKIE_NAMES } = require('../constants/auth.Constants');
const { readCookie } = require('./cookies');
const { loadUserSession, loadAdminSession } = require('./session.middleware');

const authenticate = ({ cookieName, subjectKey, loadSession, attach }) => async (req, res, next) => {
  const token = readCookie(req, cookieName);
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded[subjectKey]) return res.status(401).json({ message: 'Invalid session' });
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  try {
    const session = await loadSession(token, decoded[subjectKey]);
    if (!session) return res.status(401).json({ message: 'Session is no longer active' });
    attach(req, session, token);
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireUser = authenticate({
  cookieName: AUTH_COOKIE_NAMES.access,
  subjectKey: 'userId',
  loadSession: loadUserSession,
  attach: (req, session, token) => {
    if (session.user?.status !== 'active') {
      const error = new Error('Session is no longer active');
      error.status = 401;
      throw error;
    }
    req.userId = session.userId;
    req.userRole = session.user.role;
    req.token = token;
  },
});

const requireAdmin = authenticate({
  cookieName: AUTH_COOKIE_NAMES.admin,
  subjectKey: 'adminId',
  loadSession: loadAdminSession,
  attach: (req, session, token) => {
    req.adminId = session.adminId;
    req.admin = session.admin;
    req.token = token;
  },
});

module.exports = { requireUser, requireAdmin, authenticate };
