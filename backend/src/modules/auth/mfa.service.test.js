require('../../test/ensure-test-env');

const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const { generate } = require('otplib');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const { encryptField } = require('../../utils/crypto-fields');
const { verifyAccessToken, MFA_CHALLENGE_TYP, MFA_PURPOSES } = require('../../config/jwt');
const mfa = require('./mfa.service');

const FIRM_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FIRM_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

function baseOwner(overrides = {}) {
  return {
    id: USER_A,
    firm_id: FIRM_A,
    email: 'owner@a.test',
    full_name: 'Owner A',
    role: 'FIRM_OWNER',
    is_active: true,
    mfa_enabled: false,
    mfa_totp_secret_enc: null,
    mfa_totp_pending_secret_enc: null,
    mfa_recovery_codes_hash: [],
    ...overrides,
  };
}

describe('mfa.service policy + challenge JWT', () => {
  test('owner sem MFA → MFA_ENROLLMENT_REQUIRED com typ=mfa-challenge', () => {
    const gate = mfa.resolvePostCredentialGate(baseOwner());
    assert.equal(gate.status, mfa.STATUS.MFA_ENROLLMENT_REQUIRED);
    assert.equal(gate.mfa.purpose, MFA_PURPOSES.ENROLL);
    const payload = verifyAccessToken(gate.mfa.challengeToken);
    assert.equal(payload.typ, MFA_CHALLENGE_TYP);
    assert.equal(payload.id, USER_A);
    assert.equal(payload.firmId, FIRM_A);
    assert.ok(payload.jti);
  });

  test('owner com MFA → MFA_CHALLENGE_REQUIRED', () => {
    const gate = mfa.resolvePostCredentialGate(baseOwner({ mfa_enabled: true }));
    assert.equal(gate.status, mfa.STATUS.MFA_CHALLENGE_REQUIRED);
    assert.equal(gate.mfa.purpose, MFA_PURPOSES.VERIFY);
  });

  test('staff sem MFA → AUTHENTICATED (MFA opcional)', () => {
    const gate = mfa.resolvePostCredentialGate(
      baseOwner({ role: 'FIRM_STAFF', mfa_enabled: false }),
    );
    assert.equal(gate.status, mfa.STATUS.AUTHENTICATED);
  });

  test('consultant com MFA → challenge', () => {
    const gate = mfa.resolvePostCredentialGate(
      baseOwner({ role: 'FIRM_CONSULTANT', mfa_enabled: true }),
    );
    assert.equal(gate.status, mfa.STATUS.MFA_CHALLENGE_REQUIRED);
  });
});

describe('mfa.service recovery codes', () => {
  test('hash Argon2 + consume one-time + não reutiliza', async () => {
    const codes = mfa.generateRecoveryCodesPlain();
    assert.equal(codes.length, 10);
    const hashes = await mfa.hashRecoveryCodes(codes);
    assert.equal(hashes.length, 10);
    assert.ok(hashes.every((h) => String(h).startsWith('$argon2')));

    const first = await mfa.consumeRecoveryCode(hashes, codes[0]);
    assert.equal(first.ok, true);
    assert.equal(first.remaining.length, 9);

    const reuse = await mfa.consumeRecoveryCode(first.remaining, codes[0]);
    assert.equal(reuse.ok, false);
    assert.equal(reuse.remaining.length, 9);
  });
});

describe('mfa.service tenant isolation', () => {
  test('challenge de Firm A não carrega user de Firm B', async () => {
    mock.restoreAll();
    const gate = mfa.resolvePostCredentialGate(baseOwner({ mfa_enabled: true }));
    mock.method(firmUsersRepository, 'findFirmUserById', async (id, firmId) => {
      assert.equal(String(firmId), FIRM_A);
      assert.equal(String(id), USER_A);
      return baseOwner({ id, mfa_enabled: true, mfa_totp_secret_enc: encryptField('INVALIDSECRET=======') });
    });
    // Token com firmId adulterado (assinatura inválida) → challenge inválido
    const forged = `${gate.mfa.challengeToken.slice(0, -8)}ffffffff`;
    await assert.rejects(
      () => mfa.verifyChallenge({ challengeToken: forged, code: '000000' }),
      (err) =>
        err.details?.code === 'MFA_CHALLENGE_INVALID' || err.code === 'MFA_CHALLENGE_INVALID',
    );

    // Actor de outro firm para o mesmo id no token → TENANT_MISMATCH
    mock.restoreAll();
    const gate2 = mfa.resolvePostCredentialGate(baseOwner({ mfa_enabled: true }));
    mock.method(firmUsersRepository, 'findFirmUserById', async () =>
      baseOwner({
        id: USER_A,
        firm_id: FIRM_B,
        mfa_enabled: true,
        mfa_totp_secret_enc: encryptField('INVALIDSECRET======='),
      }),
    );
    await assert.rejects(
      () => mfa.verifyChallenge({ challengeToken: gate2.mfa.challengeToken, code: '000000' }),
      (err) => err.details?.code === 'TENANT_MISMATCH' || err.code === 'TENANT_MISMATCH',
    );
  });

  test('beginEnrollment recusa actor de outro tenant', async () => {
    mock.restoreAll();
    const gate = mfa.resolvePostCredentialGate(baseOwner());
    mock.method(firmUsersRepository, 'findFirmUserById', async () =>
      baseOwner({ id: USER_B, firm_id: FIRM_B, email: 'owner@b.test' }),
    );
    await assert.rejects(
      () => mfa.beginEnrollment({ challengeToken: gate.mfa.challengeToken }),
      (err) => err.details?.code === 'TENANT_MISMATCH' || err.code === 'TENANT_MISMATCH',
    );
  });
});

describe('mfa.service enroll + verify TOTP', () => {
  test('confirmEnrollment activa MFA e emite recovery codes', async () => {
    mock.restoreAll();
    const { generateSecret } = require('otplib');
    const secret = generateSecret();
    const pendingEnc = encryptField(secret);
    let stored = baseOwner({ mfa_totp_pending_secret_enc: pendingEnc });

    mock.method(firmUsersRepository, 'findFirmUserById', async () => stored);
    mock.method(firmUsersRepository, 'updateFirmUserMfa', async (_id, _firmId, patch) => {
      stored = {
        ...stored,
        mfa_enabled: patch.mfaEnabled ?? stored.mfa_enabled,
        mfa_totp_secret_enc: patch.mfaTotpSecretEnc ?? stored.mfa_totp_secret_enc,
        mfa_totp_pending_secret_enc:
          patch.mfaTotpPendingSecretEnc === undefined
            ? stored.mfa_totp_pending_secret_enc
            : patch.mfaTotpPendingSecretEnc,
        mfa_recovery_codes_hash: patch.mfaRecoveryCodesHash ?? stored.mfa_recovery_codes_hash,
        mfa_enabled_at: patch.mfaEnabledAt ?? stored.mfa_enabled_at,
      };
      return stored;
    });
    mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async () => {});

    const gate = mfa.resolvePostCredentialGate(baseOwner());
    const code = await generate({ secret });
    const result = await mfa.confirmEnrollment({
      challengeToken: gate.mfa.challengeToken,
      code,
    });
    assert.equal(result.recoveryCodes.length, 10);
    assert.equal(stored.mfa_enabled, true);
    assert.ok(String(stored.mfa_totp_secret_enc).startsWith('enc:v1:'));
    assert.equal(stored.mfa_totp_pending_secret_enc, null);
  });

  test('verifyChallenge aceita TOTP válido', async () => {
    mock.restoreAll();
    const { generateSecret } = require('otplib');
    const secret = generateSecret();
    const row = baseOwner({
      mfa_enabled: true,
      mfa_totp_secret_enc: encryptField(secret),
    });
    mock.method(firmUsersRepository, 'findFirmUserById', async () => row);
    mock.method(firmUsersRepository, 'updateFirmUserMfa', async () => row);

    const gate = mfa.resolvePostCredentialGate(row);
    const code = await generate({ secret });
    const result = await mfa.verifyChallenge({
      challengeToken: gate.mfa.challengeToken,
      code,
    });
    assert.equal(result.verified, true);
  });
});
