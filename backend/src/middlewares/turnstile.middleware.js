/**
 * Middleware Cloudflare Turnstile (Managed) — Siteverify obrigatório.
 * Replay: confiar no Siteverify (tokens single-use / TTL 5 min). Sem Redis.
 */
const { AppError } = require('./error.middleware');
const { clientIp } = require('../utils/client-ip');
const {
  extractTurnstileToken,
  verifyTurnstileToken,
} = require('../services/turnstile/turnstile.service');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');

/** Staging SPA builds often ship without VITE_TURNSTILE_SITE_KEY — do not block UAT. */
function isStagingFrontendUrl(url) {
  try {
    const host = new URL(String(url || '')).hostname.toLowerCase();
    return host === 'staging.teglion.com' || host === 'www.staging.teglion.com';
  } catch {
    return false;
  }
}

/**
 * @param {{ action: string }} options
 */
function requireTurnstile({ action } = {}) {
  const expectedAction = String(action || '').trim();
  if (!expectedAction) {
    throw new Error('[turnstile] requireTurnstile({ action }) exige action não vazia');
  }

  return async function turnstileMiddleware(req, res, next) {
    try {
      // Produção sem secret: fail closed (mesmo sem token no body).
      if (env.isProduction && !env.TURNSTILE_SECRET_KEY) {
        return next(
          new AppError('Verificação de segurança indisponível.', 403, {
            code: 'TURNSTILE_UNAVAILABLE',
          }, 'TURNSTILE_UNAVAILABLE'),
        );
      }

      // Dev/test sem secret: skip (permite CI e local sem widget).
      if (!env.TURNSTILE_SECRET_KEY) {
        return next();
      }

      const token = extractTurnstileToken(req);
      if (!token && isStagingFrontendUrl(env.FRONTEND_URL)) {
        logger.warn(
          '[Turnstile] token ausente — skip em staging (defina VITE_TURNSTILE_SITE_KEY no Vercel staging)',
        );
        return next();
      }

      await verifyTurnstileToken({
        token,
        expectedAction,
        remoteip: clientIp(req),
      });

      // Evita reenvio acidental do token a services a jusante / logs de body.
      if (req.body && typeof req.body === 'object') {
        delete req.body.turnstileToken;
        delete req.body['cf-turnstile-response'];
        delete req.body.cfTurnstileResponse;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { requireTurnstile, isStagingFrontendUrl };
