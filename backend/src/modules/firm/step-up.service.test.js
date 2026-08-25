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
    const { VAULT_STEPUP_PURPOSES } = require('../../config/jwt');
    const token = signVaultStepUpToken({
      id: USER_ID,
      firmId: FIRM_ID,
      purpose: VAULT_STEPUP_PURPOSES.MUTATE,
    });
    const result = await stepUp.verifyStaffPassword({
      firmId: FIRM_ID,
      userId: USER_ID,
      stepUpToken: token,
      rememberSession: true,
      purpose: VAULT_STEPUP_PURPOSES.MUTATE,
    });
    assert.equal(result.actor.id, USER_ID);
    assert.equal(typeof result.stepUpToken, 'string');
  });

  test('token vault-stepup de outro purpose é rejeitado', async () => {
    mockActor({ vault_password_hash: 'vault-hash' });
    const { VAULT_STEPUP_PURPOSES } = require('../../config/jwt');
    const token = signVaultStepUpToken({
      id: USER_ID,
      firmId: FIRM_ID,
      purpose: VAULT_STEPUP_PURPOSES.REVEAL,
    });
    await assert.rejects(
      () =>
        stepUp.verifyStaffPassword({
          firmId: FIRM_ID,
          userId: USER_ID,
          stepUpToken: token,
          purpose: VAULT_STEPUP_PURPOSES.MUTATE,
        }),
      (err) =>
        err.details?.code === 'NO_VAULT_PASSWORD' ||
        err.details?.code === 'INVALID_CURRENT_PASSWORD' ||
        err.code === 'NO_VAULT_PASSWORD' ||
        err.code === 'INVALID_CURRENT_PASSWORD',
    );
  });

  // Regressão: reapresentar um token vault-stepup válido renovava-o com um TTL novo de
  // 10 minutos sem qualquer teto — desde que usado pelo menos uma vez a cada 10 minutos,
  // a autorização nunca expirava de facto. Um stepUpToken vazado (XSS, aba esquecida)
  // dava acesso indefinido ao cofre sem nunca mais precisar da senha/TOTP.
  test('token vault-stepup válido mas emitido há mais que o teto absoluto exige nova confirmação', async () => {
    mockActor({ vault_password_hash: 'vault-hash' });
    mock.method(passwordCrypto, 'verifyPassword', async () => false);
    const { VAULT_STEPUP_PURPOSES, VAULT_STEPUP_MAX_SESSION_MS } = require('../../config/jwt');
    const longAgo = Math.floor((Date.now() - VAULT_STEPUP_MAX_SESSION_MS - 60_000) / 1000);
    const token = signVaultStepUpToken({
      id: USER_ID,
      firmId: FIRM_ID,
      purpose: VAULT_STEPUP_PURPOSES.MUTATE,
      authenticatedAt: longAgo,
    });

    await assert.rejects(
      () =>
        stepUp.verifyStaffPassword({
          firmId: FIRM_ID,
          userId: USER_ID,
          stepUpToken: token,
          rememberSession: true,
          purpose: VAULT_STEPUP_PURPOSES.MUTATE,
        }),
      (err) => err.details?.code === 'INVALID_CURRENT_PASSWORD' || err.code === 'INVALID_CURRENT_PASSWORD',
      'token além do teto absoluto deve ser tratado como inválido, caindo para a verificação de senha',
    );
  });

  test('renovar um token vault-stepup dentro do teto preserva o authenticatedAt original (não reinicia o relógio)', async () => {
    mockActor({ vault_password_hash: 'vault-hash' });
    const { VAULT_STEPUP_PURPOSES } = require('../../config/jwt');
    const originalAuthenticatedAt = Math.floor((Date.now() - 5 * 60 * 1000) / 1000);
    const token = signVaultStepUpToken({
      id: USER_ID,
      firmId: FIRM_ID,
      purpose: VAULT_STEPUP_PURPOSES.MUTATE,
      authenticatedAt: originalAuthenticatedAt,
    });

    const result = await stepUp.verifyStaffPassword({
      firmId: FIRM_ID,
      userId: USER_ID,
      stepUpToken: token,
      rememberSession: true,
      purpose: VAULT_STEPUP_PURPOSES.MUTATE,
    });

    const jwt = require('jsonwebtoken');
    const renewedPayload = jwt.decode(result.stepUpToken);
    assert.equal(
      renewedPayload.authenticatedAt,
      originalAuthenticatedAt,
      'renovar não deve reiniciar o relógio da confirmação real',
    );
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
