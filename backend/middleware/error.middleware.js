const { logger } = require('./logger.middleware');

const notFoundMiddleware = (req, res) => res.status(404).json({
  message: 'Route not found',
  path: req.path,
  requestId: req.id,
});

const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;

  logger.error('Request failed', error, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    status,
  });

  return res.status(status).json({
    message: status >= 500 ? 'Something went wrong' : error.message,
    requestId: req.id,
  });
};

module.exports = { notFoundMiddleware, errorMiddleware };
