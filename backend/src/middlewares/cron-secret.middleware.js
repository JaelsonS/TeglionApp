const crypto = require('crypto');
const { env } = require('../config/env');
const { AppError } = require('./error.middleware');
const { logger } = require('../utils/logger');

function safeEqualStrings(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Cron-only routes — JWT is not accepted; requires a valid x-cron-secret.
 */
function requireCronSecret(req, res, next) {
  const cronSecret = String(req.headers['x-cron-secret'] || '').trim();
  if (!env.CRON_SECRET) {
    logger.warn('[security] CRON_SECRET não configurado — rota cron bloqueada', {
      path: req.originalUrl,
      ip: req.ip,
    });
    return next(new AppError('Cron não configurado', 503));
  }
  if (!cronSecret || !safeEqualStrings(cronSecret, env.CRON_SECRET)) {
    logger.warn('[security] Tentativa cron sem secret válido', {
      path: req.originalUrl,
      ip: req.ip,
    });
    return next(new AppError('Não autorizado', 403));
  }
  return next();
}

module.exports = { requireCronSecret };
