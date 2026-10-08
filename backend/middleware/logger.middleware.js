const crypto = require('crypto');

const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  req.id = req.get('x-request-id')?.slice(0, 128) || crypto.randomUUID();
  res.set('X-Request-Id', req.id);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const entry = {
      level: res.statusCode >= 500 ? 'error' : 'info',
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };
    const write = entry.level === 'error' ? console.error : console.log;
    write(JSON.stringify(entry));
  });

  next();
};

const logger = {
  info: (message, details = {}) => console.log(JSON.stringify({ level: 'info', message, ...details })),
  error: (message, error, details = {}) => console.error(JSON.stringify({
    level: 'error',
    message,
    error: error?.message || String(error),
    ...details,
  })),
};

module.exports = { requestLogger, logger };
