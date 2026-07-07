const { logger } = require('../utils/logger');

function logAuthSecurity(event, req, extra = {}) {
  logger.warn(`[auth-security] ${event}`, {
    path: req?.originalUrl || req?.url,
    ip: req?.ip,
    origin: req?.headers?.origin,
    userAgent: req?.headers?.['user-agent'],
    ...extra,
  });
}

module.exports = { logAuthSecurity };
