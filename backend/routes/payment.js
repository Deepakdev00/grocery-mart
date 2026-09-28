const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'grocery_mart_secret_key_2024';

// Middleware to get userId from token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// POST /api/payment/process
// Process payment and create order
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { paymentMethod, paymentDetails, deliveryAddress, items } = req.body;

    // Validation
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    if (!['upi', 'card', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Validate UPI
    if (paymentMethod === 'upi' && (!paymentDetails?.upiId || !paymentDetails.upiId.includes('@'))) {
      return res.status(400).json({ message: 'Please enter a valid UPI ID' });
    }

    // Validate Card
    if (paymentMethod === 'card') {
      if (!paymentDetails?.cardLastFour) {
        return res.status(400).json({ message: 'Card details are required' });
      }
    }

    // Get cart items (either from request or from database)
    let cartItems = items;

    if (!cartItems || cartItems.length === 0) {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.userId },
        include: { items: true }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      cartItems = cart.items;
    }

    // Calculate totals
    const itemTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const deliveryFee = itemTotal > 100 ? 0 : 25;
    const handlingFee = 2;
    const grandTotal = itemTotal + deliveryFee + handlingFee;

    // Create payment record with items
    const payment = await prisma.payment.create({
      data: {
        userId: req.userId,
        itemTotal,
        deliveryFee,
        handlingFee,
        grandTotal,
        paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'completed',
        deliveryAddress: deliveryAddress || '',
        items: {
          create: cartItems.map(item => ({
            productId: String(item.productId || item.id),
            name: item.name,
            weight: item.weight || '',
            price: item.price,
            qty: item.qty
          }))
        }
      },
      include: { items: true }
    });

    // Clear the cart after successful payment
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: req.userId } }
    });

    res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        grandTotal: payment.grandTotal,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Payment process error:', error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

// GET /api/payment/history
// Get user's payment/order history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      orders: payments.map(payment => ({
        id: payment.id,
        items: payment.items,
        itemTotal: payment.itemTotal,
        deliveryFee: payment.deliveryFee,
        handlingFee: payment.handlingFee,
        grandTotal: payment.grandTotal,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        createdAt: payment.createdAt
      }))
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error fetching order history' });
  }
});

// GET /api/payment/:id
// Get payment/order details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: { items: true }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      order: {
        id: payment.id,
        items: payment.items,
        itemTotal: payment.itemTotal,
        deliveryFee: payment.deliveryFee,
        handlingFee: payment.handlingFee,
        grandTotal: payment.grandTotal,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        deliveryAddress: payment.deliveryAddress,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ message: 'Server error fetching order details' });
  }
});

module.exports = router;
