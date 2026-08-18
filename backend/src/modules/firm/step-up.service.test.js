require('../../test/ensure-test-env');

const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const passwordCrypto = require('../../utils/password-crypto');
const { signAccessToken, signVaultStepUpToken } = require('../../config/jwt');
const stepUp = require('./step-up.service');

const FIRM_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '33333333-3333-4333-8333-333333333333';

function mockActor(row) {
  mock.restoreAll();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
    id: USER_ID,
    firm_id: FIRM_ID,
    role: 'FIRM_OWNER',
    is_active: true,
    password_hash: null,
    vault_password_hash: null,
    ...row,
  }));
}

describe('step-up.service vault password', () => {
  test('conta Google sem cofre recusa com NO_VAULT_PASSWORD', async () => {
    mockActor({});
    await assert.rejects(
      () =>
        stepUp.verifyStaffPassword({
          firmId: FIRM_ID,
          userId: USER_ID,
          currentPassword: 'qualquer',
        }),
      (err) => err.details?.code === 'NO_VAULT_PASSWORD' || err.code === 'NO_VAULT_PASSWORD',
    );
  });

  test('prefere a palavra-passe do cofre em vez da de login', async () => {
    mockActor({ password_hash: 'login-hash', vault_password_hash: 'vault-hash' });
    mock.method(passwordCrypto, 'verifyPassword', async (_plain, hash) => hash === 'vault-hash');

    const result = await stepUp.verifyStaffPassword({
      firmId: FIRM_ID,
      userId: USER_ID,
      currentPassword: 'cofre',
      rememberSession: true,
    });
    assert.equal(result.actor.id, USER_ID);
    assert.equal(typeof result.stepUpToken, 'string');
    assert.equal(Boolean(result.stepUpExpiresAt), true);
  });

  test('JWT de sessão não desbloqueia o cofre', async () => {
    mockActor({ password_hash: 'login-hash' });
    const access = signAccessToken({ id: USER_ID, role: 'FIRM_OWNER', firmId: FIRM_ID });
    await assert.rejects(
      () =>
        stepUp.verifyStaffPassword({
          firmId: FIRM_ID,
          userId: USER_ID,
          stepUpToken: access,
        }),
      (err) => err.details?.code === 'NO_VAULT_PASSWORD' || err.details?.code === 'INVALID_CURRENT_PASSWORD' || err.code === 'NO_VAULT_PASSWORD' || err.code === 'INVALID_CURRENT_PASSWORD',
    );
  });

  test('token vault-stepup válido dispensa a palavra-passe', async () => {
    mockActor({ vault_password_hash: 'vault-hash' });
    const token = signVaultStepUpToken({ id: USER_ID, firmId: FIRM_ID });
    const result = await stepUp.verifyStaffPassword({
      firmId: FIRM_ID,
      userId: USER_ID,
      stepUpToken: token,
      rememberSession: true,
    });
    assert.equal(result.actor.id, USER_ID);
    assert.equal(typeof result.stepUpToken, 'string');
  });

  test('getUnlockState: Google só desbloqueia depois de criar o cofre', async () => {
    mockActor({});
    const empty = await stepUp.getUnlockState({ firmId: FIRM_ID, userId: USER_ID });
    assert.equal(empty.canUnlock, false);
    assert.equal(empty.hasVaultPassword, false);

    mockActor({ vault_password_hash: 'vault-hash' });
    const ready = await stepUp.getUnlockState({ firmId: FIRM_ID, userId: USER_ID });
    assert.equal(ready.canUnlock, true);
    assert.equal(ready.hasVaultPassword, true);
  });
});
