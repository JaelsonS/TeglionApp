/**
 * Middleware Cloudflare Turnstile (Managed) — Siteverify obrigatório.
 * Replay: confiar no Siteverify (tokens single-use / TTL 5 min). Sem Redis.
 *
 * Política: com TURNSTILE_SECRET_KEY definido, o token é sempre obrigatório
 * (staging e produção). Sem secret: skip só em não-produção (dev/CI local);
 * em produção → fail closed.
 */
const { AppError } = require('./error.middleware');
const { clientIp } = require('../utils/client-ip');
const {
  extractTurnstileToken,
  verifyTurnstileToken,
} = require('../services/turnstile/turnstile.service');
const { env } = require('../config/env');

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

module.exports = { requireTurnstile };
