const { logger } = require('../utils/logger');
const { sanitizeError, sanitizeObject } = require('./log-sanitization.middleware');
const { resolveRequestLocale, hasTranslation, t } = require('../i18n');
const { env } = require('../config/env');

class AppError extends Error {
  /**
   * Erro de aplicação com status HTTP.
   * @param {string} message Mensagem amigável
   * @param {number} statusCode Código HTTP (ex: 400, 401, 403, 404, 500)
   * @param {object} details Detalhes opcionais
   */
  constructor(message, statusCode = 400, details = undefined, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}

function statusToFallbackCode(statusCode) {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 422) return 'VALIDATION_ERROR';
  if (statusCode === 503) return 'SERVICE_UNAVAILABLE';
  return 'INTERNAL_ERROR';
}

function resolveErrorCode(err, statusCode) {
  const explicit = err?.code || err?.details?.code;
  if (explicit) return String(explicit).toUpperCase();

  if (statusCode === 400 && Array.isArray(err?.details?.errors)) {
    return 'VALIDATION_ERROR';
  }

  return statusToFallbackCode(statusCode);
}

function resolveMulterError(err) {
  if (!err || (err.name !== 'MulterError' && err.code !== 'LIMIT_FILE_SIZE')) return null;
  const maxMb = Number(env.MAX_FILE_SIZE) || 25;
  if (err.code === 'LIMIT_FILE_SIZE') {
    return {
      statusCode: 413,
      code: 'FILE_TOO_LARGE',
      message: `O ficheiro excede o limite de ${maxMb} MB. Comprima o PDF ou envie um ficheiro mais pequeno.`,
    };
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return {
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Campo de ficheiro inválido. Tente novamente.',
    };
  }
  return {
    statusCode: 400,
    code: 'UPLOAD_ERROR',
    message: 'Não foi possível processar o ficheiro enviado.',
  };
}

function sanitizeClientDetails(err, statusCode) {
  if (!err?.details) return undefined;
  if (statusCode >= 500) return undefined;
  if (env.isProduction) {
    if (Array.isArray(err.details?.errors)) return { errors: err.details.errors };
    return undefined;
  }
  return err.details;
}

function errorMiddleware(err, req, res, next) {
  const multerMapped = resolveMulterError(err);
  const statusCode = multerMapped?.statusCode || err.statusCode || 500;
  const requestId = req.id || req.get?.('x-request-id') || null;
  const locale = resolveRequestLocale(req);
  let code = multerMapped?.code || resolveErrorCode(err, statusCode);
  const i18nKey = `errors.${code.toLowerCase()}`;
  const fallbackKey = `errors.${statusToFallbackCode(statusCode).toLowerCase()}`;
  let message = hasTranslation(locale, i18nKey)
    ? t(locale, i18nKey)
    : t(locale, fallbackKey);

  if (multerMapped?.message) {
    message = multerMapped.message;
  } else if (err instanceof AppError && err.message && err.message !== 'Error') {
    message = err.message;
  }
  if (err?.code === '23505') {
    message =
      'Este registo já existe. Se for uma notícia, altere o título — o sistema gera automaticamente um identificador único.';
  }

  if (statusCode >= 500) {
    try {
      const { Sentry } = require('../instrument');
      if (Sentry) Sentry.captureException(err);
    } catch {
      // ignore
    }
  }

  logger.safe.error('Erro na API', {
    statusCode,
    code,
    ...(err instanceof Error ? sanitizeError(err) : { message: err?.message }),
    details: sanitizeObject(err?.details),
    path: req.path,
    method: req.method,
    requestId,
  });

  return res.status(statusCode).json({
    code,
    message,
    requestId,
    details: sanitizeClientDetails(err, statusCode),
  });
}

module.exports = { AppError, errorMiddleware };
