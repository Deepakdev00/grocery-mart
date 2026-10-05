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

// Helper to find or create cart for user or admin account safely
async function getOrCreateCart(userId) {
  let userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    const adminExists = await prisma.admin.findUnique({ where: { id: userId } });
    if (adminExists) {
      userExists = await prisma.user.upsert({
        where: { email: adminExists.email },
        update: { id: adminExists.id },
        create: {
          id: adminExists.id,
          username: adminExists.username,
          email: adminExists.email,
          password: adminExists.password,
          role: 'admin'
        }
      });
    }
  }

  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  if (!cart && userExists) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: true }
    });
  }

  return cart;
}

// GET /api/cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
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
    console.error('Fetch cart error:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// POST /api/cart/add
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, name, weight, price, img, qty = 1 } = req.body;

    if (!productId || !name || price === undefined) {
      return res.status(400).json({ message: 'Please provide product details' });
    }

    const cart = await getOrCreateCart(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
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
          weight: weight || '',
          price: Number(price),
          img: img || '',
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

    const cart = await getOrCreateCart(req.userId);
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
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(i => i.productId === String(productId));
    if (item) {
      await prisma.cartItem.delete({
        where: { id: item.id }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    const totalAmount = (updatedCart?.items || []).reduce((sum, i) => sum + (i.price * i.qty), 0);
    const totalItems = (updatedCart?.items || []).reduce((sum, i) => sum + i.qty, 0);

    res.json({
      message: 'Item removed from cart',
      cart: {
        items: updatedCart?.items || [],
        totalAmount,
        totalItems
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error removing item from cart' });
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
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error clearing cart' });
  }
});

// POST /api/cart/sync
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { items = [] } = req.body;
    const cart = await getOrCreateCart(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'User or Cart not found' });
    }

    // Upsert items from local cart
    for (const item of items) {
      const pId = String(item.id || item.productId);
      const existingItem = cart.items.find(ci => ci.productId === pId);
      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { qty: Math.max(existingItem.qty, item.qty || 1) }
        });
      } else if (item.name && item.price !== undefined) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: pId,
            name: item.name,
            weight: item.weight || '',
            price: Number(item.price),
            img: item.img || '',
            qty: item.qty || 1
          }
        });
      }
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: req.userId },
      include: { items: true }
    });

    const totalAmount = updatedCart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItems = updatedCart.items.reduce((sum, item) => sum + item.qty, 0);

    res.json({
      message: 'Cart synced successfully',
      cart: {
        items: updatedCart.items,
        totalAmount,
        totalItems
      }
    });
  } catch (error) {
    console.error('Cart sync error:', error);
    res.status(500).json({ message: 'Server error syncing cart' });
  }
});

module.exports = router;
