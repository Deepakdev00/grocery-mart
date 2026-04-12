const express = require('express');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payment/process
// @desc    Process payment
// @access  Private
router.post('/process', auth, async (req, res) => {
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
      const cart = await Cart.findOne({ user: req.userId });
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

    // Create payment record
    const payment = new Payment({
      user: req.userId,
      items: cartItems.map(item => ({
        productId: String(item.productId || item.id),
        name: item.name,
        weight: item.weight,
        price: item.price,
        qty: item.qty
      })),
      itemTotal,
      deliveryFee,
      handlingFee,
      grandTotal,
      paymentMethod,
      paymentDetails: paymentMethod === 'cod' ? {} : paymentDetails,
      status: paymentMethod === 'cod' ? 'pending' : 'completed',
      deliveryAddress: deliveryAddress || req.user.address
    });

    await payment.save();

    // Clear the cart after successful payment
    await Cart.findOneAndUpdate(
      { user: req.userId },
      { $set: { items: [] } }
    );

    res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id: payment._id,
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

// @route   GET /api/payment/history
// @desc    Get user's payment/order history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      orders: payments.map(payment => ({
        id: payment._id,
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

// @route   GET /api/payment/:id
// @desc    Get payment/order details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!payment) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      order: {
        id: payment._id,
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
