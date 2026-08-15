/**
 * Middleware Cloudflare Turnstile (Managed) — Siteverify obrigatório.
 * Replay: confiar no Siteverify (tokens single-use / TTL 5 min). Sem Redis.
 *
 * Política:
 * - Com TURNSTILE_SECRET_KEY: token sempre obrigatório (staging + produção).
 * - Sem secret: fail closed em produção/staging (mustEnforceTurnstile).
 * - Skip só em test/development local (CI unitário / Mac) — nunca em staging.
 *
 * Importa o módulo (não destructuring) para os unit tests poderem mockar
 * `verifyTurnstileToken` sem rede Cloudflare.
 */
const { AppError } = require('./error.middleware');
const { clientIp } = require('../utils/client-ip');
const turnstileService = require('../services/turnstile/turnstile.service');
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
      if (!env.TURNSTILE_SECRET_KEY) {
        if (turnstileService.mustEnforceTurnstile()) {
          return next(
            new AppError('Verificação de segurança indisponível.', 403, {
              code: 'TURNSTILE_UNAVAILABLE',
            }, 'TURNSTILE_UNAVAILABLE'),
          );
        }
        // test / development local sem secret: skip controlado.
        return next();
      }

      const token = turnstileService.extractTurnstileToken(req);
      await turnstileService.verifyTurnstileToken({
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
