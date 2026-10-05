const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const profileRoutes = require('./routes/profile');
const supportRoutes = require('./routes/support');
const userManagementRoutes = require('./routes/userManagement');
const wishlistRoutes = require('./routes/wishlist');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/user-management', userManagementRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'OK',
      message: '🚀 Grocery Mart API with Prisma + Supabase',
      database: 'Connected ✅',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   🚀 Grocery Mart Backend API Server   ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('📊 Database: Supabase PostgreSQL');
  console.log('🔧 ORM: Prisma');
  console.log('\n📋 Available Endpoints:');
  console.log('  POST   /api/auth/signup');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/auth/me');
  console.log('  GET    /api/cart');
  console.log('  POST   /api/cart/add');
  console.log('  PUT    /api/cart/update');
  console.log('  DELETE /api/cart/clear');
  console.log('  POST   /api/payment/process');
  console.log('  GET    /api/payment/history');
  console.log('  GET    /api/payment/:id');
  console.log('  GET    /api/health\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Server stopped');
    console.log('✅ Database connection closed\n');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('❌ Unhandled Rejection:', err);
  await prisma.$disconnect();
  process.exit(1);
});

module.exports = app;
