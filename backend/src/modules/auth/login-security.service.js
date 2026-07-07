/**
 * Lockout de login + atraso progressivo anti brute-force.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');
const loginAttemptsRepository = require('../../db/supabase/repositories/login-attempts.repository');
const { clientIp } = require('../../utils/client-ip');
const securityAudit = require('../../services/audit/security-audit.service');

const INVALID_LOGIN_MESSAGE = 'E-mail ou palavra-passe incorretos. Verifique os dados e tente novamente.';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAccountKey(scope, normalizedEmail) {
  return `${scope}:${String(normalizedEmail || '').trim().toLowerCase()}`;
}

function formatLockoutMessage(retryAfterSeconds) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  if (minutes <= 1) {
    return 'Muitas tentativas falhadas. Aguarde cerca de 1 minuto e tente novamente.';
  }
  return `Muitas tentativas falhadas. Aguarde cerca de ${minutes} minutos e tente novamente.`;
}

async function assertLoginAllowed(accountKey, req, auditContext = {}) {
  const lock = await loginAttemptsRepository.checkLock(accountKey);
  if (!lock.locked) return;

  void securityAudit.recordAuthAccountLocked({
    firmId: auditContext.firmId || null,
    scope: auditContext.scope || null,
    req,
  });

  throw new AppError(formatLockoutMessage(lock.retryAfterSeconds), 429, {
    code: 'ACCOUNT_LOCKED',
    retryAfterSeconds: lock.retryAfterSeconds,
  });
}

async function recordFailedLogin(accountKey, req, auditContext = {}) {
  const ip = clientIp(req);
  const row = await loginAttemptsRepository.upsertFailure(accountKey, {
    ip,
    maxFailures: env.LOGIN_MAX_FAILURES,
    lockoutMs: env.LOGIN_LOCKOUT_MS,
    windowMs: env.LOGIN_ATTEMPT_WINDOW_MS,
  });

  const delayMs = Math.min((row?.failedCount || 1) * 400, 3000);
  await sleep(delayMs);

  if (row?.lockedUntil && new Date(row.lockedUntil) > new Date()) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((new Date(row.lockedUntil).getTime() - Date.now()) / 1000),
    );
    void securityAudit.recordAuthAccountLocked({
      firmId: auditContext.firmId || null,
      scope: auditContext.scope || null,
      req,
    });
    throw new AppError(formatLockoutMessage(retryAfterSeconds), 429, {
      code: 'ACCOUNT_LOCKED',
      retryAfterSeconds,
    });
  }

  throw new AppError(INVALID_LOGIN_MESSAGE, 401, { code: 'INVALID_CREDENTIALS' });
}

async function recordSuccessfulLogin(accountKey) {
  await loginAttemptsRepository.clearAttempts(accountKey).catch(() => {});
}

module.exports = {
  INVALID_LOGIN_MESSAGE,
  buildAccountKey,
  assertLoginAllowed,
  recordFailedLogin,
  recordSuccessfulLogin,
};
