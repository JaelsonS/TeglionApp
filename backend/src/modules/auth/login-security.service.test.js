const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

require('../../test/ensure-test-env');

const loginAttemptsRepository = require('../../db/supabase/repositories/login-attempts.repository');
const securityAudit = require('../../services/audit/security-audit.service');
const loginSecurity = require('./login-security.service');

function resetMocks() {
  mock.restoreAll();
}

// Regressão: os ramos de login que revelam um motivo específico (conta SSO-only,
// inactiva, e-mail por confirmar, acesso revogado, senha por definir) nunca chamavam
// recordFailedLogin — um atacante conseguia enumerar contas por essas mensagens sem
// nunca ser penalizado pelo limiar de bloqueio. recordFailedLoginAttempt() fecha isso:
// conta para o mesmo limiar, mas só substitui a mensagem específica quando a conta
// efectivamente atinge o bloqueio (evita "credenciais inválidas" genérico a cada
// tentativa isolada, preservando a UX legítima).

test('recordFailedLoginAttempt: abaixo do limiar, incrementa e devolve sem lançar (mensagem específica do chamador continua a valer)', async () => {
  resetMocks();
  mock.method(loginAttemptsRepository, 'upsertFailure', async () => ({ failedCount: 1, lockedUntil: null }));
  mock.method(securityAudit, 'recordAuthAccountLocked', async () => {});

  await loginSecurity.recordFailedLoginAttempt('firm:alvo@teglion.com', {}, { scope: 'firm' });
  // Não lança — o chamador (loginFirm/loginClient) é livre de lançar o seu próprio erro específico a seguir.
  assert.ok(true);
});

test('recordFailedLoginAttempt: ao atingir o limiar, lança ACCOUNT_LOCKED — a mensagem específica do chamador nunca chega a ser lançada', async () => {
  resetMocks();
  mock.method(loginAttemptsRepository, 'upsertFailure', async () => ({
    failedCount: 5,
    lockedUntil: new Date(Date.now() + 60_000).toISOString(),
  }));
  let locked = false;
  mock.method(securityAudit, 'recordAuthAccountLocked', async () => {
    locked = true;
  });

  await assert.rejects(
    () => loginSecurity.recordFailedLoginAttempt('firm:alvo@teglion.com', {}, { scope: 'firm' }),
    (err) => err?.statusCode === 429 && err?.details?.code === 'ACCOUNT_LOCKED',
  );
  assert.equal(locked, true, 'devia registar o evento de bloqueio de conta');
});

test('recordFailedLogin: continua a lançar INVALID_CREDENTIALS genérico quando não bloqueado (comportamento antigo preservado)', async () => {
  resetMocks();
  mock.method(loginAttemptsRepository, 'upsertFailure', async () => ({ failedCount: 2, lockedUntil: null }));

  await assert.rejects(
    () => loginSecurity.recordFailedLogin('firm:alvo@teglion.com', {}, { scope: 'firm' }),
    (err) => err?.statusCode === 401 && err?.details?.code === 'INVALID_CREDENTIALS',
  );
});
