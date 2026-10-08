const express = require('express');
const prisma = require('../config/prisma');
const { requireUser: authMiddleware } = require('../middleware/auth.middleware');
const router = express.Router();

async function getOrCreateCart(userId) {
  const userExists = await prisma.user.findUnique({ where: { id: userId } });

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
    const { productId, qty = 1 } = req.body;
    const normalizedProductId = typeof productId === 'string' ? productId.trim() : '';
    const requestedQty = Number(qty);

    if (
      !normalizedProductId ||
      !Number.isSafeInteger(requestedQty) ||
      requestedQty < 1 ||
      requestedQty > 99
    ) {
      return res.status(400).json({ message: 'Please provide a valid productId and quantity' });
    }

    const product = await prisma.product.findFirst({
      where: { id: normalizedProductId, inStock: true }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    const cart = await getOrCreateCart(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if item exists
    const existingItem = cart.items.find(item => item.productId === product.id);

    if (existingItem) {
      const updatedQty = existingItem.qty + requestedQty;
      if (updatedQty > 99) {
        return res.status(400).json({ message: 'Cart quantity cannot exceed 99' });
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: updatedQty }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          name: product.name,
          weight: product.weight,
          price: product.price,
          img: product.imageUrl,
          qty: requestedQty
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
    const normalizedQty = Number(qty);

    if (
      typeof productId !== 'string' || !productId.trim() ||
      !Number.isSafeInteger(normalizedQty)
    ) {
      return res.status(400).json({ message: 'Please provide productId and quantity' });
    }

    const cart = await getOrCreateCart(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => item.productId === productId.trim());

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (normalizedQty <= 0) {
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
    const items = req.body?.items ?? [];
    if (!Array.isArray(items) || items.length > 100) {
      return res.status(400).json({ message: 'Items must be an array of at most 100 products' });
    }
    const cart = await getOrCreateCart(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'User or Cart not found' });
    }

    // Upsert items from local cart
    for (const item of items) {
      const rawProductId = [item?.id, item?.productId].find(value =>
        typeof value === 'string' && value.trim()
      );
      if (typeof rawProductId !== 'string' || !rawProductId.trim()) {
        continue;
      }

      const pId = rawProductId.trim();
      const requestedQty = Number(item?.qty);
      const qty = Number.isFinite(requestedQty)
        ? Math.min(99, Math.max(1, Math.floor(requestedQty)))
        : 1;
      const product = await prisma.product.findFirst({
        where: { id: pId, inStock: true }
      });
      if (!product) continue;

      const existingItem = cart.items.find(ci => ci.productId === pId);
      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { qty: Math.min(99, Math.max(existingItem.qty, qty)) }
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            name: product.name,
            weight: product.weight,
            price: product.price,
            img: product.imageUrl,
            qty
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
