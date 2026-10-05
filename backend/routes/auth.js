const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const JWT_SECRET = require('../config/auth');
const { readCookie, setUserCookies, clearUserCookies } = require('../middleware/cookies');

const prisma = new PrismaClient();
const router = express.Router();

// Helper: Extract client IP address
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || null;
};

// Helper: Determine device info from user-agent
const getDeviceInfo = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  if (/mobile/i.test(userAgent)) return 'Mobile Device';
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  if (/windows/i.test(userAgent)) return 'Windows PC';
  if (/macintosh|mac os x/i.test(userAgent)) return 'Mac';
  if (/linux/i.test(userAgent)) return 'Linux PC';
  return 'Desktop / Web';
};

// Helper: Generate JWT token (7-day expiration)
const generateToken = (userId, role = 'customer') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

// Helper: Safe user object (omits password)
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    name: user.username
  };
};

// Middleware: Verify JWT and extract user info
const authMiddleware = async (req, res, next) => {
  try {
    const token = readCookie(req, 'gm_access');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const session = await prisma.activeSession.findFirst({
      where: {
        token,
        userId: decoded.userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: { userId: true, user: { select: { role: true, status: true } } }
    });
    if (!session || session.user?.status !== 'active') {
      return res.status(401).json({ message: 'Session is no longer active' });
    }
    req.userId = session.userId;
    req.userRole = session.user.role;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ==========================================
// 1. POST /signup - User Registration
// ==========================================
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate presence of required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    const trimmedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate email format
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password length
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check for existing user by email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: 'insensitive' } },
          { username: { equals: trimmedUsername, mode: 'insensitive' } }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === normalizedEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password with bcrypt (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = 'customer';

    // Create user in database
    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role: userRole,
        status: 'active'
      }
    });

    const token = generateToken(user.id, user.role);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;
    const deviceInfo = getDeviceInfo(userAgent);
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create ActiveSession
    await prisma.activeSession.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        ipAddress,
        userAgent,
        deviceInfo,
        expiresAt: sessionExpiresAt,
        isActive: true
      }
    });

    // Create LoginLog entry
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        email: user.email,
        action: 'login_success',
        ipAddress,
        userAgent
      }
    });

    setUserCookies(res, token, refreshToken);

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        name: user.username
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// ==========================================
// 2. POST /login - Login System
// ==========================================
router.post('/login', async (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;

  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || req.body.identifier || '').toString().trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    // Find user by email OR username (case-insensitive)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });

    // If not found in User table, check Admin table
    let isAdminAccount = false;
    if (!user) {
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } }
          ]
        }
      });

      if (admin) {
        // Treat admin as a user-like object for the rest of the flow
        isAdminAccount = true;
        user = {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          password: admin.password,
          role: admin.role || 'admin',
          status: 'active' // Admin accounts are always active
        };
      }
    }

    if (isAdminAccount) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user) {
      await prisma.loginLog.create({
        data: {
          email: identifier,
          action: 'login_failed',
          ipAddress,
          userAgent
        }
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user status is 'active' (only applies to regular users)
    if (!isAdminAccount && user.status !== 'active') {
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'login_failed',
          ipAddress,
          userAgent
        }
      });
      return res.status(403).json({ message: 'Account is suspended/inactive' });
    }

    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      if (!isAdminAccount) {
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            email: user.email,
            action: 'login_failed',
            ipAddress,
            userAgent
          }
        });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT (7-day expiry, payload: { userId, role })
    const token = generateToken(user.id, user.role);
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const deviceInfo = getDeviceInfo(userAgent);
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // For regular users: create ActiveSession + LoginLog records
    if (!isAdminAccount) {
      await prisma.activeSession.create({
        data: {
          userId: user.id,
          token,
          refreshToken,
          ipAddress,
          userAgent,
          deviceInfo,
          expiresAt: sessionExpiresAt,
          isActive: true
        }
      });

      await prisma.loginLog.create({
        data: {
          userId: user.id,
          email: user.email,
          action: 'login_success',
          ipAddress,
          userAgent
        }
      });
    } else {
      // For admin accounts: create AdminSession record
      await prisma.adminSession.create({
        data: {
          adminId: user.id,
          token,
          ipAddress,
          userAgent,
          expiresAt: sessionExpiresAt,
          isActive: true
        }
      });
    }

    setUserCookies(res, token, refreshToken);

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        name: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// ==========================================
// 3. GET /me - Get Current User
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        profile: true,
        address: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Server error fetching user data' });
  }
});

// ==========================================
// 4. POST /logout - Logout
// ==========================================
router.post('/logout', async (req, res) => {
  try {
    const token = readCookie(req, 'gm_access');

    if (!token) {
      clearUserCookies(res);
      return res.json({ message: 'Logged out successfully' });
    }

    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    let userId = null;
    let email = 'unknown';

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      if (user) {
        email = user.email;
      }
    } catch {
      // Token might be expired or invalid, still try finding the session by token
      const session = await prisma.activeSession.findUnique({
        where: { token },
        include: { user: { select: { email: true } } }
      });
      if (session) {
        userId = session.userId;
        email = session.user?.email || 'unknown';
      }
    }

    // Deactivate ActiveSession
    await prisma.activeSession.updateMany({
      where: { token },
      data: { isActive: false }
    });

    // Create LoginLog entry
    await prisma.loginLog.create({
      data: {
        userId,
        email,
        action: 'logout',
        ipAddress,
        userAgent
      }
    });

    clearUserCookies(res);
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    clearUserCookies(res);
    return res.status(500).json({ message: 'Server error during logout' });
  }
});

// ==========================================
// 5. POST /forgot-password - Forgot Password
// ==========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (user) {
      // Generate 6-digit OTP and unique token
      const otp = crypto.randomInt(100000, 1000000).toString();
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store in PasswordResetToken table
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          otp,
          expiresAt,
          used: false
        }
      });

      // Also store in OtpLog table
      await prisma.otpLog.create({
        data: {
          userId: user.id,
          otp,
          purpose: 'password_reset',
          expiresAt,
          verified: false
        }
      });

    }

    // Always return generic success message to prevent user enumeration
    return res.json({ message: 'If email exists, reset instructions sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error processing password reset request' });
  }
});

// ==========================================
// 6. POST /verify-reset-otp - Verify Reset OTP
// ==========================================
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otpString = String(otp).trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP or email' });
    }

    // Find valid (not expired, not used) PasswordResetToken with matching OTP
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        otp: otpString,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!resetRecord) {
      // Check OtpLog as fallback
      const otpRecord = await prisma.otpLog.findFirst({
        where: {
          userId: user.id,
          otp: otpString,
          purpose: 'password_reset',
          verified: false,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }

      // Mark OtpLog verified
      await prisma.otpLog.update({
        where: { id: otpRecord.id },
        data: { verified: true }
      });

      // Find or create matching password reset token
      const latestResetToken = await prisma.passwordResetToken.findFirst({
        where: {
          userId: user.id,
          used: false,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (latestResetToken) {
        return res.json({
          message: 'OTP verified successfully',
          resetToken: latestResetToken.token
        });
      }

      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OtpLog as verified
    await prisma.otpLog.updateMany({
      where: {
        userId: user.id,
        otp: otpString,
        purpose: 'password_reset'
      },
      data: { verified: true }
    });

    return res.json({
      message: 'OTP verified successfully',
      resetToken: resetRecord.token
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// ==========================================
// 7. POST /reset-password - Reset Password
// ==========================================
router.post('/reset-password', async (req, res) => {
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;

  try {
    const { token, resetToken, newPassword, password } = req.body;
    const tokenToUse = (token || resetToken || '').toString().trim();
    const passwordToUse = newPassword || password;

    if (!tokenToUse || !passwordToUse) {
      return res.status(400).json({ message: 'Please provide reset token and new password' });
    }

    // Validate new password (min 6 chars)
    if (typeof passwordToUse !== 'string' || passwordToUse.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find valid PasswordResetToken by token
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: tokenToUse },
      include: { user: true }
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    // Invalidate all existing sessions for the user
    await prisma.activeSession.updateMany({
      where: {
        userId: resetRecord.userId,
        isActive: true
      },
      data: { isActive: false }
    });

    // Create LoginLog (action: 'password_reset')
    await prisma.loginLog.create({
      data: {
        userId: resetRecord.userId,
        email: resetRecord.user?.email || 'unknown',
        action: 'password_reset',
        ipAddress,
        userAgent
      }
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error resetting password' });
  }
});

// ==========================================
// 8. POST /refresh-token - Refresh JWT Token
// ==========================================
router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = readCookie(req, 'gm_refresh');

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Find ActiveSession by refreshToken
    const session = await prisma.activeSession.findUnique({
      where: { refreshToken: String(refreshToken).trim() },
      include: { user: true }
    });

    // Verify session is active and not expired
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Verify user status is active
    if (!session.user || session.user.status !== 'active') {
      return res.status(403).json({ message: 'Account is suspended/inactive' });
    }

    // Generate new JWT token
    const newToken = generateToken(session.userId, session.user.role);

    // Update session with new token
    await prisma.activeSession.update({
      where: { id: session.id },
      data: {
        token: newToken,
        lastActiveAt: new Date()
      }
    });

    setUserCookies(res, newToken, session.refreshToken);

    return res.json({
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// ==========================================
// 9. GET /sessions - List Active Sessions
// ==========================================
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    // List all active sessions for user from ActiveSession table
    const sessions = await prisma.activeSession.findMany({
      where: {
        userId: req.userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActiveAt: 'desc' }
    });

    const sessionList = sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      deviceInfo: s.deviceInfo,
      loginAt: s.loginAt,
      lastActiveAt: s.lastActiveAt,
      isCurrent: s.token === req.token
    }));

    return res.json({
      sessions: sessionList
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ message: 'Server error fetching sessions' });
  }
});

// ==========================================
// 10. DELETE /sessions/:sessionId - Revoke Specific Session
// ==========================================
router.delete('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find session by id AND userId (security check)
    const session = await prisma.activeSession.findFirst({
      where: {
        id: sessionId,
        userId: req.userId
      }
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Set isActive to false
    await prisma.activeSession.update({
      where: { id: session.id },
      data: { isActive: false }
    });

    return res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({ message: 'Server error revoking session' });
  }
});

// ==========================================
// 11. DELETE /sessions - Revoke All Other Sessions
// ==========================================
router.delete('/sessions', authMiddleware, async (req, res) => {
  try {
    // Deactivate all sessions for user EXCEPT the current one
    const result = await prisma.activeSession.updateMany({
      where: {
        userId: req.userId,
        isActive: true,
        NOT: { token: req.token }
      },
      data: { isActive: false }
    });

    return res.json({
      message: 'All other sessions revoked successfully',
      revokedCount: result.count
    });
  } catch (error) {
    console.error('Revoke all other sessions error:', error);
    return res.status(500).json({ message: 'Server error revoking other sessions' });
  }
});

module.exports = router;
