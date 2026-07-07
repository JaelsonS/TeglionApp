/**
 * Autenticação JWT — TegLion (Supabase).
 */
const { verifyAccessToken } = require('../config/jwt');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');
const { AppError } = require('./error.middleware');
const { resolveRequestLocale } = require('../i18n');
const contabilAuth = require('../modules/auth/contabil-auth.service');
const { normalizeSessionRole, readActorClientId, readActorFirmId } = require('../utils/session-user');

const AUTH_MIDDLEWARE_MESSAGES = {
  invalidUser: 'Utilizador inválido',
  invalidOrExpiredToken: 'Token inválido ou expirado',
};

function authMiddlewareMessage(key) {
  return AUTH_MIDDLEWARE_MESSAGES[key] || key;
}

function shouldRefreshUserFromDb(req) {
  const url = String(req.originalUrl || '').toLowerCase();
  if (req.headers['x-refresh-user'] === '1') return true;
  const sensitive = [/\/api\/auth\/me$/, /\/api\/auth\/refresh$/];
  return sensitive.some((rx) => rx.test(url));
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;
  const cookieToken = req.cookies?.accessToken ? String(req.cookies.accessToken).trim() : null;

  if (headerToken && !cookieToken && !env.ALLOW_BEARER_AUTH) {
    return next(
      new AppError('Autenticação por cookie obrigatória', 401, { code: 'BEARER_NOT_ALLOWED' })
    );
  }

  const token = cookieToken || (env.ALLOW_BEARER_AUTH ? headerToken : null);

  if (!token) {
    return next(new AppError('Token de acesso ausente', 401, { code: 'TOKEN_MISSING' }));
  }

  try {
    const payload = verifyAccessToken(token);
    const firmId = readActorFirmId(payload);
    const clientId = readActorClientId(payload);
    req.user = {
      id: payload.id,
      _id: payload.id,
      userId: payload.id,
      role: normalizeSessionRole(payload.role),
      firmId,
      clientId,
      masterAccess: payload.masterAccess === true,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : undefined,
      language: payload.language || null,
    };

    req.locale = resolveRequestLocale(req);

    if (!req._userRefreshed && shouldRefreshUserFromDb(req)) {
      req._userRefreshed = true;
      try {
        const freshUser = await contabilAuth.getMe(payload.id, payload.role);
        if (freshUser) {
          req.user.role = normalizeSessionRole(freshUser.role || req.user.role);
          req.user.firmId = readActorFirmId(freshUser) || req.user.firmId;
          req.user.clientId = readActorClientId(freshUser) || req.user.clientId;
          req.user.masterAccess = freshUser.masterAccess === true;
          if (Array.isArray(freshUser.permissions)) req.user.permissions = freshUser.permissions;
        }
      } catch (err) {
        logger.warn('AUTH_USER_DB_REFRESH_FAILED', {
          userId: payload.id,
          url: req.originalUrl,
          error: err?.message || String(err),
        });
      }
    }

    return next();
  } catch (err) {
    return next(new AppError(authMiddlewareMessage('invalidOrExpiredToken'), 401, { code: 'UNAUTHORIZED' }));
  }
}

module.exports = { authMiddleware };
