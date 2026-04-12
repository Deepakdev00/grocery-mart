const express = require('express');
const Cart = require('../models/Cart');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }

    res.json({
      cart: {
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, name, weight, price, img, qty = 1 } = req.body;

    // Validation
    if (!productId || !name || !price) {
      return res.status(400).json({ message: 'Please provide product details' });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === String(productId)
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].qty += qty;
    } else {
      // Add new item
      cart.items.push({
        productId: String(productId),
        name,
        weight,
        price,
        img,
        qty
      });
    }

    await cart.save();

    res.json({
      message: 'Item added to cart',
      cart: {
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error adding to cart' });
  }
});

// @route   PUT /api/cart/update
// @desc    Update item quantity in cart
// @access  Private
router.put('/update', auth, async (req, res) => {
  try {
    const { productId, qty } = req.body;

    if (!productId || qty === undefined) {
      return res.status(400).json({ message: 'Please provide productId and quantity' });
    }

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId === String(productId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (qty <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].qty = qty;
    }

    await cart.save();

    res.json({
      message: 'Cart updated',
      cart: {
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
});

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId !== String(productId));
    await cart.save();

    res.json({
      message: 'Item removed from cart',
      cart: {
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error removing from cart' });
  }
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

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

// @route   POST /api/cart/sync
// @desc    Sync local cart with server cart
// @access  Private
router.post('/sync', auth, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items must be an array' });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // Merge local items with server cart
    items.forEach(localItem => {
      const existingIndex = cart.items.findIndex(
        item => item.productId === String(localItem.id || localItem.productId)
      );

      if (existingIndex > -1) {
        // Item exists, update quantity (take max of both)
        cart.items[existingIndex].qty = Math.max(
          cart.items[existingIndex].qty,
          localItem.qty
        );
      } else {
        // Add new item
        cart.items.push({
          productId: String(localItem.id || localItem.productId),
          name: localItem.name,
          weight: localItem.weight,
          price: localItem.price,
          img: localItem.img,
          qty: localItem.qty || 1
        });
      }
    });

    await cart.save();

    res.json({
      message: 'Cart synced',
      cart: {
        items: cart.items,
        totalAmount: cart.totalAmount,
        totalItems: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ message: 'Server error syncing cart' });
  }
});

module.exports = router;
