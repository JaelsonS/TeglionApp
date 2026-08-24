const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

test('confirmSensitiveAction: MFA on exige TOTP e rejeita só sessão', async () => {
  mock.reset();
  const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
  const mfa = require('../auth/mfa.service');
  const { encryptField } = require('../../utils/crypto-fields');

  mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
    id: 'u1',
    firm_id: 'f1',
    is_active: true,
    mfa_enabled: true,
    mfa_totp_secret_enc: encryptField('JBSWY3DPEHPK3PXP'),
    password_hash: null,
    role: 'FIRM_OWNER',
  }));
  mock.method(firmUsersRepository, 'updateFirmUserMfa', async () => ({}));
  mock.method(mfa, 'verifyTotpCode', async (_s, code) => code === '123456');

  delete require.cache[require.resolve('./sensitive-action.service')];
  const { confirmSensitiveAction, SENSITIVE_PURPOSES } = require('./sensitive-action.service');

  await assert.rejects(
    () =>
      confirmSensitiveAction({
        firmId: 'f1',
        userId: 'u1',
        purpose: SENSITIVE_PURPOSES.FIRM_CLOSE,
      }),
    (err) => String(err?.details?.code || err?.code) === 'SENSITIVE_ACTION_MFA_REQUIRED',
  );

  const ok = await confirmSensitiveAction({
    firmId: 'f1',
    userId: 'u1',
    purpose: SENSITIVE_PURPOSES.FIRM_CLOSE,
    totpCode: '123456',
  });
  assert.equal(ok.method, 'mfa_totp');
});

test('confirmSensitiveAction: MFA off exige password de login', async () => {
  mock.reset();
  const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
  const passwordCrypto = require('../../utils/password-crypto');

  mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
    id: 'u2',
    firm_id: 'f1',
    is_active: true,
    mfa_enabled: false,
    password_hash: 'hash',
    role: 'FIRM_STAFF',
  }));
  mock.method(passwordCrypto, 'verifyPassword', async (_p, h) => h === 'hash' && _p === 'secret');

  delete require.cache[require.resolve('./sensitive-action.service')];
  const { confirmSensitiveAction, SENSITIVE_PURPOSES } = require('./sensitive-action.service');

  await assert.rejects(
    () =>
      confirmSensitiveAction({
        firmId: 'f1',
        userId: 'u2',
        purpose: SENSITIVE_PURPOSES.PROFILE_EMAIL_CHANGE,
      }),
    (err) => String(err?.details?.code || err?.code) === 'SENSITIVE_ACTION_PASSWORD_REQUIRED',
  );

  const ok = await confirmSensitiveAction({
    firmId: 'f1',
    userId: 'u2',
    purpose: SENSITIVE_PURPOSES.PROFILE_EMAIL_CHANGE,
    currentPassword: 'secret',
  });
  assert.equal(ok.method, 'password');
});

test('confirmSensitiveAction: cross-tenant actor rejeitado', async () => {
  mock.reset();
  const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
  mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
    id: 'u1',
    firm_id: 'other-firm',
    is_active: true,
    mfa_enabled: false,
    password_hash: 'x',
  }));

  delete require.cache[require.resolve('./sensitive-action.service')];
  const { confirmSensitiveAction, SENSITIVE_PURPOSES } = require('./sensitive-action.service');

  await assert.rejects(
    () =>
      confirmSensitiveAction({
        firmId: 'f1',
        userId: 'u1',
        purpose: SENSITIVE_PURPOSES.TEAM_PERMISSIONS_PATCH,
        currentPassword: 'x',
      }),
    (err) => err?.statusCode === 404,
  );
});

test('assertVaultSensitiveUnlock: MFA on sem TOTP/stepup falha', async () => {
  mock.reset();
  const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
  mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
    id: 'u1',
    firm_id: 'f1',
    is_active: true,
    mfa_enabled: true,
    mfa_totp_secret_enc: 'enc',
  }));

  delete require.cache[require.resolve('./sensitive-action.service')];
  const { assertVaultSensitiveUnlock, SENSITIVE_PURPOSES } = require('./sensitive-action.service');

  await assert.rejects(
    () =>
      assertVaultSensitiveUnlock({
        firmId: 'f1',
        userId: 'u1',
        purpose: SENSITIVE_PURPOSES.VAULT_REVEAL,
        currentPassword: 'anything',
      }),
    (err) => String(err?.details?.code || err?.code) === 'SENSITIVE_ACTION_MFA_REQUIRED',
  );
});
