/**
 * Cloudflare Turnstile Siteverify — validação server-side obrigatória.
 * Não implementa replay local: a Cloudflare já rejeita tokens reutilizados.
 */
const { env } = require('../../config/env');
const { logger } = require('../../utils/logger');
const { AppError } = require('../../middlewares/error.middleware');

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 8_000;

/** Secrets de teste oficiais Cloudflare (dummy) — hostname no response não é fiável. */
const CLOUDFLARE_TEST_SECRET_PREFIX = '1x0000000000000000000000000000000';
const CLOUDFLARE_TEST_SECRET_BLOCK_PREFIX = '2x0000000000000000000000000000000';

function isCloudflareTestSecret(secret) {
  const s = String(secret || '');
  return s.startsWith(CLOUDFLARE_TEST_SECRET_PREFIX) || s.startsWith(CLOUDFLARE_TEST_SECRET_BLOCK_PREFIX);
}

function extractTurnstileToken(req) {
  const headerToken =
    req?.get?.('x-turnstile-token') ||
    req?.get?.('cf-turnstile-response') ||
    '';
  if (String(headerToken || '').trim()) return String(headerToken).trim();

  const body = req?.body;
  if (!body || typeof body !== 'object') return '';
  const raw =
    body.turnstileToken ||
    body['cf-turnstile-response'] ||
    body.cfTurnstileResponse ||
    '';
  return String(raw || '').trim();
}

function hostnameAllowed(hostname, expectedHostnames) {
  const host = String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  if (!host) return false;
  return expectedHostnames.some((allowed) => allowed === host);
}

/**
 * @param {{ token: string, expectedAction: string, remoteip?: string|null }} params
 * @returns {Promise<{ success: true, action: string, hostname: string }>}
 */
async function verifyTurnstileToken({ token, expectedAction, remoteip }) {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (env.isProduction) {
      throw new AppError('Verificação de segurança indisponível.', 403, { code: 'TURNSTILE_UNAVAILABLE' }, 'TURNSTILE_UNAVAILABLE');
    }
    return { success: true, action: expectedAction, hostname: 'dev-skip' };
  }

  if (!token) {
    throw new AppError('Verificação de segurança em falta. Actualize a página e tente de novo.', 403, {
      code: 'TURNSTILE_MISSING',
    }, 'TURNSTILE_MISSING');
  }

  const expected = String(expectedAction || '').trim();
  if (!expected) {
    throw new AppError('Configuração de segurança inválida.', 500, { code: 'TURNSTILE_MISCONFIGURED' }, 'TURNSTILE_MISCONFIGURED');
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteip) body.set('remoteip', String(remoteip));

  let payload;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    payload = await response.json().catch(() => null);
    if (!response.ok || !payload || typeof payload !== 'object') {
      logger.warn('[turnstile] Siteverify HTTP inválido', { status: response.status });
      throw new AppError('Verificação de segurança falhou. Tente novamente.', 403, {
        code: 'TURNSTILE_FAILED',
      }, 'TURNSTILE_FAILED');
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn('[turnstile] Siteverify timeout/erro de rede', {
      name: err?.name,
      errMessage: err?.message ? String(err.message).slice(0, 120) : undefined,
    });
    throw new AppError('Verificação de segurança indisponível. Tente novamente.', 403, {
      code: 'TURNSTILE_UNAVAILABLE',
    }, 'TURNSTILE_UNAVAILABLE');
  }

  if (payload.success !== true) {
    const codes = Array.isArray(payload['error-codes']) ? payload['error-codes'] : [];
    logger.warn('[turnstile] Token rejeitado', { errorCodes: codes.slice(0, 5) });
    throw new AppError('Verificação de segurança falhou. Actualize a página e tente de novo.', 403, {
      code: 'TURNSTILE_FAILED',
    }, 'TURNSTILE_FAILED');
  }

  const action = String(payload.action || '').trim();
  if (action !== expected) {
    logger.warn('[turnstile] Action mismatch', { expected });
    throw new AppError('Verificação de segurança inválida.', 403, {
      code: 'TURNSTILE_ACTION_MISMATCH',
    }, 'TURNSTILE_ACTION_MISMATCH');
  }

  const hostname = String(payload.hostname || '').trim().toLowerCase();
  if (!isCloudflareTestSecret(secret)) {
    if (!hostnameAllowed(hostname, env.TURNSTILE_EXPECTED_HOSTNAMES)) {
      logger.warn('[turnstile] Hostname não autorizado', {
        hostname: hostname ? hostname.slice(0, 80) : undefined,
      });
      throw new AppError('Verificação de segurança inválida.', 403, {
        code: 'TURNSTILE_HOSTNAME_MISMATCH',
      }, 'TURNSTILE_HOSTNAME_MISMATCH');
    }
  }

  return { success: true, action, hostname: hostname || 'unknown' };
}

module.exports = {
  SITEVERIFY_URL,
  extractTurnstileToken,
  verifyTurnstileToken,
  hostnameAllowed,
  isCloudflareTestSecret,
};
