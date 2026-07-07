const { env } = require('../config/env');
const { AppError } = require('./error.middleware');
const { logger } = require('../utils/logger');

/**
 * Rotas exclusivas de cron — não aceitam JWT; só x-cron-secret válido.
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
  if (!cronSecret || cronSecret !== env.CRON_SECRET) {
    logger.warn('[security] Tentativa cron sem secret válido', {
      path: req.originalUrl,
      ip: req.ip,
    });
    return next(new AppError('Não autorizado', 403));
  }
  return next();
}

module.exports = { requireCronSecret };
