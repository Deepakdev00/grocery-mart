const express = require('express');
const prisma = require('../config/prisma');
const {
  requireUser: authMiddleware,
  requireAdmin: adminAuthMiddleware
} = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/support/tickets - Create support ticket (user)
router.post('/tickets', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['complaint', 'bug', 'suggestion'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (!['low', 'medium', 'high'].includes(priority || 'medium')) {
      return res.status(400).json({ message: 'Invalid priority' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.userId,
        title,
        description,
        category,
        priority: priority || 'medium'
      },
      include: {
        user: { select: { username: true, email: true } },
        replies: true
      }
    });

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error creating ticket' });
  }
});

// GET /api/support/tickets - Get user's tickets
router.get('/tickets', authMiddleware, async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.userId },
      include: {
        user: { select: { username: true, email: true } },
        replies: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error fetching tickets' });
  }
});

// GET /api/support/tickets/:id - Get ticket details
router.get('/tickets/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { username: true, email: true } },
        replies: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify user owns ticket
    if (ticket.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error fetching ticket' });
  }
});

// POST /api/support/tickets/:id/reply - Add reply to ticket
router.post('/tickets/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a message' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verify user owns ticket or is admin/support staff
    if (ticket.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reply = await prisma.supportReply.create({
      data: {
        ticketId: req.params.id,
        userId: req.userId,
        message
      }
    });

    res.status(201).json({
      message: 'Reply added successfully',
      reply
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: 'Server error adding reply' });
  }
});

// GET /api/support/dashboard - Get all tickets (admin only)
router.get('/dashboard', adminAuthMiddleware, async (req, res) => {
  try {
    const { status, priority, category } = req.query;

    let whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (category) {
      whereClause.category = category;
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, username: true, email: true } },
        replies: { select: { id: true, message: true, createdAt: true } }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Get stats
    const stats = await prisma.supportTicket.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const statusCounts = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      statusCounts[stat.status] = stat._count.id;
    });

    res.json({
      tickets,
      stats: statusCounts,
      totalTickets: tickets.length
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard' });
  }
});

// PUT /api/support/tickets/:id/status - Update ticket status (admin only)
router.put('/tickets/:id/status', adminAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: { select: { username: true, email: true } },
        replies: true
      }
    });

    res.json({
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating status' });
  }
});

// POST /api/support/tickets/:id/admin-reply - Admin reply to ticket
router.post('/tickets/:id/admin-reply', adminAuthMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a message' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id }
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const reply = await prisma.supportReply.create({
      data: {
        ticketId: req.params.id,
        userId: req.adminId, // Admin ID
        message
      }
    });

    res.status(201).json({
      message: 'Admin reply added successfully',
      reply
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({ message: 'Server error adding admin reply' });
  }
});

module.exports = router;
