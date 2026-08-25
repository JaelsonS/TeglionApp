const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

require('../../test/ensure-test-env');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const loginSecurity = require('./login-security.service');
const contabilAuth = require('./contabil-auth.service');

function resetMocks() {
  mock.restoreAll();
  mock.method(loginSecurity, 'assertLoginAllowed', async () => {});
  mock.method(loginSecurity, 'recordFailedLogin', async () => {
    throw new Error('recordFailedLogin não devia ser chamado neste ramo — usar recordFailedLoginAttempt');
  });
}

// Regressão: uma conta SSO-only (sem password_hash, com sso_provider definido) fazia
// loginFirm() lançar SSO_REQUIRED diretamente, sem passar por loginSecurity — um
// atacante conseguia testar milhares de e-mails contra /login-firm e distinguir "esta
// conta usa Google" sem nunca ser penalizado pelo limiar de bloqueio. Agora esse ramo
// passa por recordFailedLoginAttempt antes de lançar o erro específico.
test('loginFirm: conta SSO-only regista a tentativa (conta para o limiar) antes de revelar SSO_REQUIRED', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserByEmail', async () => ({
    id: 'user-1',
    firm_id: 'firm-a',
    password_hash: null,
    sso_provider: 'google',
    is_active: true,
    email_confirmed_at: new Date().toISOString(),
  }));

  let recordedAccountKey = null;
  mock.method(loginSecurity, 'recordFailedLoginAttempt', async (accountKey) => {
    recordedAccountKey = accountKey;
  });

  await assert.rejects(
    () => contabilAuth.loginFirm({ email: 'owner@sso-firma.com', password: 'qualquer', req: {} }),
    (err) => err?.statusCode === 401 && err?.details?.code === 'SSO_REQUIRED',
  );

  assert.ok(recordedAccountKey, 'devia ter registado a tentativa antes de revelar o motivo SSO');
});

test('loginFirm: quando recordFailedLoginAttempt indica bloqueio, a conta bloqueada prevalece sobre SSO_REQUIRED', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserByEmail', async () => ({
    id: 'user-1',
    firm_id: 'firm-a',
    password_hash: null,
    sso_provider: 'google',
    is_active: true,
    email_confirmed_at: new Date().toISOString(),
  }));
  mock.method(loginSecurity, 'recordFailedLoginAttempt', async () => {
    const err = new Error('bloqueado');
    err.statusCode = 429;
    err.details = { code: 'ACCOUNT_LOCKED', retryAfterSeconds: 60 };
    throw err;
  });

  await assert.rejects(
    () => contabilAuth.loginFirm({ email: 'owner@sso-firma.com', password: 'qualquer', req: {} }),
    (err) => err?.statusCode === 429 && err?.details?.code === 'ACCOUNT_LOCKED',
  );
});

// Regressão (segunda auditoria): o ramo MULTIPLE_FIRMS de loginClient — quando o
// e-mail tem portal activo em mais de um escritório e o request não vem com um
// firmSlug — confirmava a existência da conta sem nunca chamar recordFailedLoginAttempt,
// ficando de fora do mesmo fechamento aplicado aos outros ramos de login.
test('loginClient: e-mail com portal em mais de um escritório regista a tentativa antes de revelar MULTIPLE_FIRMS', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientsByEmail', async () => [
    { id: 'client-a', firmId: 'firm-a', hasPortalAccess: true },
    { id: 'client-b', firmId: 'firm-b', hasPortalAccess: true },
  ]);

  let recordedAccountKey = null;
  mock.method(loginSecurity, 'recordFailedLoginAttempt', async (accountKey) => {
    recordedAccountKey = accountKey;
  });

  await assert.rejects(
    () => contabilAuth.loginClient({ email: 'cliente@duas-firmas.com', password: 'qualquer', req: {} }),
    (err) => err?.statusCode === 409 && err?.details?.code === 'MULTIPLE_FIRMS',
  );

  assert.ok(recordedAccountKey, 'devia ter registado a tentativa antes de revelar MULTIPLE_FIRMS');
});

test('loginClient: bloqueio de conta prevalece sobre MULTIPLE_FIRMS', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientsByEmail', async () => [
    { id: 'client-a', firmId: 'firm-a', hasPortalAccess: true },
    { id: 'client-b', firmId: 'firm-b', hasPortalAccess: true },
  ]);
  mock.method(loginSecurity, 'recordFailedLoginAttempt', async () => {
    const err = new Error('bloqueado');
    err.statusCode = 429;
    err.details = { code: 'ACCOUNT_LOCKED', retryAfterSeconds: 60 };
    throw err;
  });

  await assert.rejects(
    () => contabilAuth.loginClient({ email: 'cliente@duas-firmas.com', password: 'qualquer', req: {} }),
    (err) => err?.statusCode === 429 && err?.details?.code === 'ACCOUNT_LOCKED',
  );
});
