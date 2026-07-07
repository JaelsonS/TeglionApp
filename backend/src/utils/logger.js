/**
 * logger.js
 * 
 * Logger simples (Winston).
 * Por que existe?
 * - Logs são fundamentais para produção e auditoria
 * - Ajuda a manter o código didático (console.log espalhado vira caos)
 */

const winston = require('winston');
const { env } = require('../config/env');
const { SafeLogger } = require('../middlewares/log-sanitization.middleware');

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

const suppressWarnLogs = String(process.env.SUPPRESS_WARN_LOGS || '').toLowerCase() === 'true';
if (suppressWarnLogs) {
  logger.warn = (message, ...meta) => logger.log('info', message, ...meta);
}

const safeLogger = new SafeLogger(logger);
logger.safe = safeLogger;

module.exports = { logger, safeLogger };
