const express = require('express');
const env = require('./config/env');
const prisma = require('./config/prisma');
const { checkDatabaseConnection, disconnectDatabase } = require('./config/database');
const { corsOptions, trustProxy } = require('./config/cors');
const { requestLogger, logger } = require('./middleware/logger.middleware');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/error.middleware');

const createApp = () => {
  const app = express();

  if (trustProxy) app.set('trust proxy', trustProxy);

  app.use(requestLogger);
  app.use(require('cors')(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && !env.clientOrigins.includes(origin)) {
      return res.status(403).json({ message: 'Origin not allowed', requestId: req.id });
    }
    return next();
  });

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/payment', require('./routes/payment'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/admin/dashboard', require('./routes/dashboard'));
  app.use('/api/admin/user-management', require('./routes/userManagement'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/profile', require('./routes/profile'));
  app.use('/api/support', require('./routes/support'));
  app.use('/api/wishlist', require('./routes/wishlist'));

  app.get('/api/health', async (req, res, next) => {
    try {
      await checkDatabaseConnection();
      return res.json({
        status: 'OK',
        message: 'Grocery Mart API with Prisma + Supabase',
        database: 'Connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  });

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
};

const app = createApp();

const startServer = async () => {
  await prisma.$connect();
  const server = app.listen(env.port, () => {
    logger.info('Grocery Mart API server started', {
      port: env.port,
      database: 'Supabase PostgreSQL',
      orm: 'Prisma',
    });
  });

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Shutting down API server', { signal });
    server.close(async (error) => {
      if (error) logger.error('HTTP server shutdown failed', error);
      try {
        await disconnectDatabase();
        process.exit(error ? 1 : 0);
      } catch (disconnectError) {
        logger.error('Database shutdown failed', disconnectError);
        process.exit(1);
      }
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection', error);
    shutdown('unhandledRejection');
  });

  return server;
};

if (require.main === module) {
  startServer().catch(async (error) => {
    logger.error('API startup failed', error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
}

module.exports = app;
module.exports.createApp = createApp;
module.exports.startServer = startServer;
