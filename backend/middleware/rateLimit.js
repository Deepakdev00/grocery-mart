const crypto = require('crypto');
const prisma = require('../config/prisma');
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

const cleanupTimer = setInterval(() => {
  prisma.rateLimitBucket.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  }).catch((error) => {
    console.error('Rate-limit bucket cleanup failed:', error);
  });
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

const requestAddress = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const createRateLimiter = ({
  scope,
  limit,
  windowMs,
  identity = () => '',
  client = prisma,
  clock = Date.now,
}) => {
  if (!scope || !Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error('Invalid rate-limit configuration');
  }

  return async (req, res, next) => {
    const now = clock();
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
    const clientIdentity = String(identity(req) || '').trim().toLowerCase();
    const subject = clientIdentity || requestAddress(req);
    const key = crypto.createHash('sha256')
      .update(`${scope}\0${subject}`)
      .digest('hex');

    try {
      const bucket = await client.rateLimitBucket.upsert({
        where: {
          key_windowStart: { key, windowStart },
        },
        create: {
          key,
          windowStart,
          count: 1,
          expiresAt: new Date(windowStart.getTime() + windowMs),
        },
        update: { count: { increment: 1 } },
        select: { count: true },
      });

      const resetAt = windowStart.getTime() + windowMs;
      res.set('RateLimit-Limit', String(limit));
      res.set('RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
      res.set('RateLimit-Reset', String(Math.max(1, Math.ceil((resetAt - now) / 1000))));

      if (bucket.count > limit) {
        res.set('Retry-After', String(Math.max(1, Math.ceil((resetAt - now) / 1000))));
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
      }

      return next();
    } catch (error) {
      console.error('Rate-limit storage failed:', error);
      return res.status(503).json({ message: 'Request throttling is temporarily unavailable' });
    }
  };
};

const getLoginIdentity = (req) => (
  req.body?.email || req.body?.username || req.body?.identifier || ''
);
const getEmailIdentity = (req) => req.body?.email || '';

const rateLimits = {
  signupByIp: createRateLimiter({ scope: 'signup-ip', limit: 10, windowMs: 60 * 60 * 1000 }),
  signupByIdentity: createRateLimiter({
    scope: 'signup-identity',
    limit: 3,
    windowMs: 60 * 60 * 1000,
    identity: getLoginIdentity,
  }),
  loginByIp: createRateLimiter({ scope: 'login-ip', limit: 20, windowMs: 15 * 60 * 1000 }),
  loginByIdentity: createRateLimiter({
    scope: 'login-identity',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    identity: getLoginIdentity,
  }),
  adminSignupByIp: createRateLimiter({ scope: 'admin-signup-ip', limit: 3, windowMs: 60 * 60 * 1000 }),
  adminLoginByIp: createRateLimiter({ scope: 'admin-login-ip', limit: 10, windowMs: 15 * 60 * 1000 }),
  adminLoginByIdentity: createRateLimiter({
    scope: 'admin-login-identity',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    identity: getEmailIdentity,
  }),
  passwordResetByIp: createRateLimiter({ scope: 'password-reset-ip', limit: 10, windowMs: 60 * 60 * 1000 }),
  passwordResetByIdentity: createRateLimiter({
    scope: 'password-reset-identity',
    limit: 3,
    windowMs: 60 * 60 * 1000,
    identity: getEmailIdentity,
  }),
  otpByIp: createRateLimiter({ scope: 'reset-otp-ip', limit: 15, windowMs: 15 * 60 * 1000 }),
  otpByIdentity: createRateLimiter({
    scope: 'reset-otp-identity',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    identity: getEmailIdentity,
  }),
  passwordChangeByToken: createRateLimiter({
    scope: 'password-reset-token',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    identity: (req) => req.body?.token || req.body?.resetToken || '',
  }),
};

module.exports = { createRateLimiter, rateLimits };
