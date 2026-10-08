const express = require('express');
const prisma = require('../config/prisma');
const { requireUser: authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/payment/process
// Process payment and create order
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { paymentMethod, paymentDetails, deliveryAddress } = req.body;

    // Validation
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    if (!['upi', 'card', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    if (paymentMethod !== 'cod') {
      return res.status(501).json({ message: 'Online payments are not configured yet' });
    }

    if (typeof deliveryAddress !== 'string' || !deliveryAddress.trim() || deliveryAddress.length > 500) {
      return res.status(400).json({ message: 'A delivery address of at most 500 characters is required' });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    const cartItems = cart.items;

    // Calculate totals
    const itemTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const deliveryFee = itemTotal > 100 ? 0 : 25;
    const handlingFee = 2;
    const grandTotal = itemTotal + deliveryFee + handlingFee;

    // Create payment record with items
    const payment = await prisma.$transaction(async (transaction) => {
      const createdPayment = await transaction.payment.create({
        data: {
          userId: req.userId,
          itemTotal,
          deliveryFee,
          handlingFee,
          grandTotal,
          paymentMethod,
          status: 'pending',
          deliveryAddress: deliveryAddress.trim(),
          items: {
            create: cartItems.map(item => ({
              productId: item.productId,
              name: item.name,
              weight: item.weight || '',
              price: item.price,
              qty: item.qty
            }))
          }
        },
        include: { items: true }
      });

      await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
      return createdPayment;
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
