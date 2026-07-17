const { logger } = require('../utils/logger');

const SLOW_MS = Number(process.env.SLOW_REQUEST_MS || 1500);

function requestTimingMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  const originalEnd = res.end;

  res.end = function endWithTiming(...args) {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${elapsedMs.toFixed(1)}ms`);
    }
    if (elapsedMs >= SLOW_MS) {
      logger.warn('[http] slow request', {
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        ms: Math.round(elapsedMs),
      });
    }
    return originalEnd.apply(this, args);
  };

  next();
}

module.exports = { requestTimingMiddleware };
