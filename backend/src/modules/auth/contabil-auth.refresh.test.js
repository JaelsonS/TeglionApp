const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const crypto = require('crypto');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const jwtConfig = require('../../config/jwt');
const contabilAuth = require('./contabil-auth.service');

function resetMocks() {
  mock.restoreAll();
}

test('SEC-M1: refresh rejeita firm user com is_active=false e invalida sessão', async () => {
  resetMocks();

  const raw = 'rt-token';
  const expectedHash = crypto.createHash('sha256').update(raw).digest('hex');

  mock.method(jwtConfig, 'verifyRefreshToken', () => ({
    id: 'user-inactive',
    role: 'FIRM_STAFF',
    jti: 'jti-1',
    actorType: 'firm',
  }));

  mock.method(authRefreshSessionsRepository, 'claimByJti', async () => ({
    token_hash: expectedHash,
    expires_at: new Date(Date.now() + 60_000).toISOString(),
  }));

  let deletedJti = null;
  let deletedActor = null;
  mock.method(authRefreshSessionsRepository, 'deleteByJti', async (jti) => {
    deletedJti = jti;
  });
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async (type, id) => {
    deletedActor = { type, id };
  });

  mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
    id: 'user-inactive',
    firm_id: 'firm-1',
    email: 'staff@example.com',
    full_name: 'Staff',
    role: 'FIRM_STAFF',
    is_active: false,
    refresh_token_hash: null,
  }));

  let authCleared = false;
  mock.method(firmUsersRepository, 'updateFirmUserAuth', async () => {
    authCleared = true;
  });

  await assert.rejects(
    () => contabilAuth.refreshSession({ refreshToken: raw }),
    (err) => err?.statusCode === 401 && err?.details?.code === 'ACCOUNT_INACTIVE',
  );

  assert.equal(deletedJti, 'jti-1');
  assert.deepEqual(deletedActor, { type: 'firm_user', id: 'user-inactive' });
  assert.equal(authCleared, true);
});
