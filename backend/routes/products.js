const express = require('express');
const prisma = require('../config/prisma');
const { requireAdmin: adminAuthMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/products - Create product (admin only)
router.post('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { name, weight = '', price, category, imageUrl, description } = req.body;
    const numericPrice = Number(price);

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof weight !== 'string' ||
      !Number.isFinite(numericPrice) || numericPrice <= 0 ||
      typeof category !== 'string' || !category.trim() ||
      typeof imageUrl !== 'string' || !imageUrl.trim()
    ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        weight: weight.trim(),
        price: numericPrice,
        category: category.trim(),
        imageUrl: imageUrl.trim(),
        description: typeof description === 'string' ? description.trim() : null,
        createdBy: req.adminId
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let whereClause = { inStock: true };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// GET /api/products/admin/all - Get all products for admin (including out of stock)
router.get('/admin/all', adminAuthMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { name, weight, price, category, imageUrl, description, inStock } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Name must be a non-empty string' });
      }
      updates.name = name.trim();
    }
    if (weight !== undefined) {
      if (typeof weight !== 'string') {
        return res.status(400).json({ message: 'Weight must be a string' });
      }
      updates.weight = weight.trim();
    }
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: 'Price must be a positive number' });
      }
      updates.price = numericPrice;
    }
    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ message: 'Category must be a non-empty string' });
      }
      updates.category = category.trim();
    }
    if (imageUrl !== undefined) {
      if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return res.status(400).json({ message: 'Image URL must be a non-empty string' });
      }
      updates.imageUrl = imageUrl.trim();
    }
    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({ message: 'Description must be a string' });
      }
      updates.description = description.trim();
    }
    if (inStock !== undefined) {
      if (typeof inStock !== 'boolean') {
        return res.status(400).json({ message: 'inStock must be a boolean' });
      }
      updates.inStock = inStock;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updates
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', adminAuthMiddleware, async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

module.exports = router;
