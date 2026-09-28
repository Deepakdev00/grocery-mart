const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Middleware to get userId from token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'grocery_mart_secret_key_2024');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.userId },
        include: { items: true }
      });
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItems = cart.items.reduce((sum, item) => sum + item.qty, 0);

    res.json({
      cart: {
        items: cart.items,
        totalAmount,
        totalItems
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// POST /api/cart/add
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, name, weight, price, img, qty = 1 } = req.body;

    if (!productId || !name || !price) {
      return res.status(400).json({ message: 'Please provide product details' });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.userId },
        include: { items: true }
      });
    }

    // Check if item exists
    const existingItem = cart.items.find(item => item.productId === String(productId));

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + qty }
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: String(productId),
          name,
          weight,
          price,
          img,
          qty
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    const totalAmount = updatedCart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItems = updatedCart.items.reduce((sum, item) => sum + item.qty, 0);

    res.json({
      message: 'Item added to cart',
      cart: {
        items: updatedCart.items,
        totalAmount,
        totalItems
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error adding to cart' });
  }
});

// PUT /api/cart/update
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { productId, qty } = req.body;

    if (!productId || qty === undefined) {
      return res.status(400).json({ message: 'Please provide productId and quantity' });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => item.productId === String(productId));

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (qty <= 0) {
      // Delete item
      await prisma.cartItem.delete({
        where: { id: item.id }
      });
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { qty }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    const totalAmount = updatedCart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItems = updatedCart.items.reduce((sum, item) => sum + item.qty, 0);

    res.json({
      message: 'Cart updated',
      cart: {
        items: updatedCart.items,
        totalAmount,
        totalItems
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: req.userId } }
    });

    res.json({
      message: 'Cart cleared',
      cart: {
        items: [],
        totalAmount: 0,
        totalItems: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error clearing cart' });
  }
});

module.exports = router;
