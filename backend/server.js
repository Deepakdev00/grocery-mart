const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payment');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    // Cleanup legacy mobile index from old auth schema.
    try {
      const indexes = await User.collection.indexes();
      const hasLegacyMobileIndex = indexes.some((idx) => idx.name === 'mobile_1');
      if (hasLegacyMobileIndex) {
        await User.collection.dropIndex('mobile_1');
        console.log('ℹ️ Removed legacy index: mobile_1');
      }
    } catch (indexError) {
      console.log('ℹ️ Legacy index cleanup skipped:', indexError.message);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('Please check your MONGODB_URI in the .env file');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Grocery Mart API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
