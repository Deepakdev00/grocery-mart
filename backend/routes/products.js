const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'grocery_mart_secret_key_2024';

// Middleware to verify admin token
const adminAuthMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// POST /api/products - Create product (admin only)
router.post('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { name, price, category, imageUrl, description } = req.body;

    if (!name || !price || !category || !imageUrl) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        category,
        imageUrl,
        description,
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
    const { name, price, category, imageUrl, description, inStock } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        price: price ? parseFloat(price) : undefined,
        category: category || undefined,
        imageUrl: imageUrl || undefined,
        description: description || undefined,
        inStock: inStock !== undefined ? inStock : undefined
      }
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

module.exports = router;
