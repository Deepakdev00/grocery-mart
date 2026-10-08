const express = require('express');
const prisma = require('../config/prisma');
const { requireUser: authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ items: items.map(item => item.product) });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({ message: 'Server error fetching wishlist' });
  }
});

router.post('/', async (req, res) => {
  try {
    const productId = typeof req.body?.productId === 'string' ? req.body.productId.trim() : '';
    if (!productId) {
      return res.status(400).json({ message: 'A valid productId is required' });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, inStock: true }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.userId, productId } },
      update: {},
      create: { userId: req.userId, productId }
    });

    res.status(201).json({ message: 'Product added to wishlist', product });
  } catch (error) {
    console.error('Add wishlist item error:', error);
    res.status(500).json({ message: 'Server error adding wishlist item' });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    const productId = typeof req.params.productId === 'string' ? req.params.productId.trim() : '';
    if (!productId) {
      return res.status(400).json({ message: 'A valid productId is required' });
    }

    await prisma.wishlistItem.deleteMany({
      where: { userId: req.userId, productId }
    });
    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Remove wishlist item error:', error);
    res.status(500).json({ message: 'Server error removing wishlist item' });
  }
});

module.exports = router;
