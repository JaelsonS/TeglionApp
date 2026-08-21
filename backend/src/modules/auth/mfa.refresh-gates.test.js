require('../../test/ensure-test-env');

const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const jwtConfig = require('../../config/jwt');
const contabilAuth = require('./contabil-auth.service');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const mfa = require('./mfa.service');

function resetMocks() {
  mock.restoreAll();
}

describe('MFA refresh gates', () => {
  test('owner sem MFA: refresh → MFA_ENROLLMENT_REQUIRED e deleteAllForActor', async () => {
    resetMocks();
    const raw = 'rt-owner-no-mfa';
    const expectedHash = crypto.createHash('sha256').update(raw).digest('hex');

    mock.method(jwtConfig, 'verifyRefreshToken', () => ({
      id: 'owner-1',
      role: 'FIRM_OWNER',
      jti: 'jti-owner',
      actorType: 'firm',
    }));
    mock.method(authRefreshSessionsRepository, 'findByJti', async () => ({
      token_hash: expectedHash,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    }));
    mock.method(authRefreshSessionsRepository, 'deleteByJti', async () => {});
    let revoked = null;
    mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async (type, id) => {
      revoked = { type, id };
    });
    mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
      id: 'owner-1',
      firm_id: 'firm-1',
      email: 'owner@example.com',
      full_name: 'Owner',
      role: 'FIRM_OWNER',
      is_active: true,
      mfa_enabled: false,
      refresh_token_hash: null,
    }));
    mock.method(firmsRepository, 'findFirmById', async () => ({
      id: 'firm-1',
      status: 'ACTIVE',
      trial_ends_at: null,
    }));

    await assert.rejects(
      () => contabilAuth.refreshSession({ refreshToken: raw }),
      (err) =>
        err?.statusCode === 401 &&
        (err?.details?.code === 'MFA_ENROLLMENT_REQUIRED' || err?.code === 'MFA_ENROLLMENT_REQUIRED'),
    );
    assert.deepEqual(revoked, { type: 'firm_user', id: 'owner-1' });
  });

  test('owner com MFA: refresh emite nova sessão (não bloqueia)', async () => {
    resetMocks();
    const raw = 'rt-owner-mfa';
    const expectedHash = crypto.createHash('sha256').update(raw).digest('hex');

    mock.method(jwtConfig, 'verifyRefreshToken', () => ({
      id: 'owner-2',
      role: 'FIRM_OWNER',
      jti: 'jti-owner-mfa',
      actorType: 'firm',
    }));
    mock.method(authRefreshSessionsRepository, 'findByJti', async () => ({
      token_hash: expectedHash,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    }));
    mock.method(authRefreshSessionsRepository, 'deleteByJti', async () => {});
    mock.method(authRefreshSessionsRepository, 'createSession', async () => {});
    mock.method(authRefreshSessionsRepository, 'pruneOldSessions', async () => {});
    mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
      id: 'owner-2',
      firm_id: 'firm-1',
      email: 'owner2@example.com',
      full_name: 'Owner MFA',
      role: 'FIRM_OWNER',
      is_active: true,
      mfa_enabled: true,
      permissions_override: null,
      onboarding_completed: true,
      refresh_token_hash: null,
    }));
    mock.method(firmUsersRepository, 'updateFirmUserAuth', async () => ({}));
    mock.method(firmsRepository, 'findFirmById', async () => ({
      id: 'firm-1',
      status: 'ACTIVE',
      trial_ends_at: null,
    }));

    const result = await contabilAuth.refreshSession({ refreshToken: raw });
    assert.ok(result.tokens?.accessToken);
    assert.ok(result.tokens?.refreshToken);
    assert.equal(result.user?.id, 'owner-2');
  });

  test('staff sem MFA: refresh continua OK', async () => {
    resetMocks();
    const raw = 'rt-staff';
    const expectedHash = crypto.createHash('sha256').update(raw).digest('hex');

    mock.method(jwtConfig, 'verifyRefreshToken', () => ({
      id: 'staff-1',
      role: 'FIRM_STAFF',
      jti: 'jti-staff',
      actorType: 'firm',
    }));
    mock.method(authRefreshSessionsRepository, 'findByJti', async () => ({
      token_hash: expectedHash,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    }));
    mock.method(authRefreshSessionsRepository, 'deleteByJti', async () => {});
    mock.method(authRefreshSessionsRepository, 'createSession', async () => {});
    mock.method(authRefreshSessionsRepository, 'pruneOldSessions', async () => {});
    mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
      id: 'staff-1',
      firm_id: 'firm-1',
      email: 'staff@example.com',
      full_name: 'Staff',
      role: 'FIRM_STAFF',
      is_active: true,
      mfa_enabled: false,
      permissions_override: null,
      onboarding_completed: true,
      refresh_token_hash: null,
    }));
    mock.method(firmUsersRepository, 'updateFirmUserAuth', async () => ({}));
    mock.method(firmsRepository, 'findFirmById', async () => ({
      id: 'firm-1',
      status: 'ACTIVE',
      trial_ends_at: null,
    }));

    const result = await contabilAuth.refreshSession({ refreshToken: raw });
    assert.ok(result.tokens?.accessToken);
  });
});

describe('MFA challenge token cannot escalate', () => {
  test('challenge JWT rejeitado pelo authMiddleware (sem dashboard)', async () => {
    const gate = mfa.resolvePostCredentialGate({
      id: '11111111-1111-4111-8111-111111111111',
      firm_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: 'o@a.test',
      full_name: 'O',
      role: 'FIRM_OWNER',
      mfa_enabled: true,
      is_active: true,
    });
    const req = {
      headers: {},
      cookies: { accessToken: gate.mfa.challengeToken },
      originalUrl: '/api/contabil/clients',
    };
    let err = null;
    await new Promise((resolve) => {
      authMiddleware(req, {}, (e) => {
        err = e;
        resolve();
      });
    });
    assert.ok(err);
    assert.equal(err.statusCode, 401);
  });

  test('purpose enroll não serve para verifyChallenge', async () => {
    resetMocks();
    const gate = mfa.resolvePostCredentialGate({
      id: '11111111-1111-4111-8111-111111111111',
      firm_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: 'o@a.test',
      full_name: 'O',
      role: 'FIRM_OWNER',
      mfa_enabled: false,
      is_active: true,
    });
    mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
      id: '11111111-1111-4111-8111-111111111111',
      firm_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      role: 'FIRM_OWNER',
      is_active: true,
      mfa_enabled: true,
      mfa_totp_secret_enc: 'enc:v1:fake',
    }));
    await assert.rejects(
      () => mfa.verifyChallenge({ challengeToken: gate.mfa.challengeToken, code: '123456' }),
      (err) => err?.details?.code === 'MFA_PURPOSE_DENIED' || err?.code === 'MFA_PURPOSE_DENIED',
    );
  });
});
