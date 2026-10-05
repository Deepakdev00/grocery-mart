const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const JWT_SECRET = require('../config/auth');
const { setAdminCookie, clearAdminCookie } = require('../middleware/cookies');
const { requireAdmin } = require('../middleware/jwtAuth');

const prisma = new PrismaClient();
const router = express.Router();

const generateToken = (adminId) => {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/admin/signup
// Create initial admin account
router.post('/signup', async (req, res) => {
  try {
    const creationSecret = process.env.ADMIN_CREATION_SECRET;
    if (!creationSecret || req.get('x-admin-creation-secret') !== creationSecret) {
      return res.status(403).json({ message: 'Admin registration is not authorized' });
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.trim() }
        ]
      }
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin'
      }
    });

    const token = generateToken(admin.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        expiresAt
      }
    });
    setAdminCookie(res, token);

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Server error during admin registration' });
  }
});

// POST /api/admin/login
// Admin login with session tracking
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(admin.id);

    // Create admin session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        token,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        expiresAt
      }
    });

    setAdminCookie(res, token);

    res.json({
      message: 'Admin login successful',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// GET /api/admin/me
// Get current admin info
router.get('/me', requireAdmin, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Update last seen
    await prisma.adminSession.updateMany({
      where: { token: req.token, isActive: true },
      data: { lastSeenAt: new Date() }
    });

    res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// GET /api/admin/logout
// Logout and deactivate session
router.post('/logout', requireAdmin, async (req, res) => {
  try {
    await prisma.adminSession.updateMany({
      where: { token: req.token },
      data: { isActive: false }
    });

    clearAdminCookie(res);
    res.json({ message: 'Admin logged out successfully' });
  } catch (error) {
    clearAdminCookie(res);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
