/**
 * Barrel shared — cross-cutting sem regra de negócio.
 * Import: const { logger, AppError } = require('../shared');
 */
const { AppError } = require('../middlewares/error.middleware');
const { logger } = require('../utils/logger');
const ttlCache = require('../utils/cache/ttl-cache');
const { getSharedRedisClient } = require('../utils/rate-limit-store');

module.exports = {
  AppError,
  logger,
  ttlCache,
  getSharedRedisClient,
};
