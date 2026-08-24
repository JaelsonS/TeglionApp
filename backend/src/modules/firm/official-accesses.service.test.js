require('../../test/ensure-test-env');

const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const accessesRepository = require('../../db/supabase/repositories/client-official-accesses.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const securityAudit = require('../../services/audit/security-audit.service');
const passwordCrypto = require('../../utils/password-crypto');
const service = require('./official-accesses.service');

const FIRM_ID = '11111111-1111-4111-8111-111111111111';
const CLIENT_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const ACCESS_ID = '44444444-4444-4444-8444-444444444444';

function resetMocks() {
  mock.restoreAll();
}

function mockClient() {
  mock.method(clientsRepository, 'findClientById', async () => ({
    id: CLIENT_ID,
    firmId: FIRM_ID,
  }));
}

function mockActor(passwordHash = 'hash', vaultPasswordHash = null) {
  mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
    id: USER_ID,
    firm_id: FIRM_ID,
    role: 'FIRM_OWNER',
    is_active: true,
    password_hash: passwordHash,
    vault_password_hash: vaultPasswordHash,
  }));
}

function mockAudit() {
  mock.method(securityAudit, 'recordClientMutation', async () => {});
}

describe('official-accesses.service', () => {
  test('mergeCatalog preenche os 5 portais mesmo sem linhas', () => {
    const items = service.mergeCatalog([]);
    assert.equal(items.length, 5);
    assert.deepEqual(
      items.map((i) => i.portalKey),
      ['AT_FINANCAS', 'SEGURANCA_SOCIAL', 'VIA_CTT', 'IAPMEI', 'RELATORIO_UNICO'],
    );
    assert.equal(items.every((i) => i.hasPassword === false && i.id === null), true);
  });

  test('nome personalizado no catálogo substitui AT/SS/etc.', () => {
    const items = service.mergeCatalog([
      {
        id: ACCESS_ID,
        portalKey: 'AT_FINANCAS',
        label: 'Portal da Câmara',
        username: '123',
        hasPassword: false,
        updatedAt: '2026-08-18T10:00:00.000Z',
      },
    ]);
    const at = items.find((i) => i.portalKey === 'AT_FINANCAS');
    assert.equal(at.shortTitle, 'Portal da Câmara');
    assert.equal(at.title, 'Portal da Câmara');
    assert.equal(at.label, 'Portal da Câmara');
    assert.equal(items.find((i) => i.portalKey === 'VIA_CTT').shortTitle, 'ViaCTT');
  });

  test('list nunca inclui secret_enc nem a palavra-passe', async () => {
    resetMocks();
    mockClient();
    mockActor();
    mock.method(accessesRepository, 'listByClient', async () => [
      {
        id: ACCESS_ID,
        portalKey: 'AT_FINANCAS',
        label: null,
        username: '123456789',
        hasPassword: true,
        updatedAt: '2026-08-18T10:00:00.000Z',
        secret_enc: 'enc:v1:should-not-leak',
      },
    ]);

    const data = await service.listOfficialAccesses({
      firmId: FIRM_ID,
      clientId: CLIENT_ID,
      actorId: USER_ID,
    });

    const at = data.items.find((i) => i.portalKey === 'AT_FINANCAS');
    assert.equal(at.hasPassword, true);
    assert.equal(at.username, '123456789');
    assert.equal(at.secret_enc, undefined);
    assert.equal(at.password, undefined);
    assert.equal(at.revealedValue, undefined);
    assert.equal(JSON.stringify(data).includes('enc:v1'), false);
    assert.equal(data.security.canUnlock, true);
    assert.equal(data.security.hasLocalPassword, true);
    assert.equal(data.security.hasVaultPassword, false);
    assert.equal(data.security.mfaRequired, false);
  });

  test('reveal com MFA activo rejeita password-only (Gate 2)', async () => {
    resetMocks();
    mockClient();
    mock.method(firmUsersRepository, 'findFirmUserById', async () => ({
      id: USER_ID,
      firm_id: FIRM_ID,
      role: 'FIRM_OWNER',
      is_active: true,
      mfa_enabled: true,
      mfa_totp_secret_enc: 'enc',
      password_hash: 'hash',
    }));

    await assert.rejects(
      () =>
        service.revealOfficialAccess({
          firmId: FIRM_ID,
          clientId: CLIENT_ID,
          accessId: ACCESS_ID,
          actorId: USER_ID,
          currentPassword: 'anything',
        }),
      (err) =>
        String(err?.details?.code || err?.code) === 'SENSITIVE_ACTION_MFA_REQUIRED',
    );
  });

  test('reveal exige palavra-passe correcta e devolve revealedValue', async () => {
    resetMocks();
    mockClient();
    mockActor();
    mockAudit();
    mock.method(passwordCrypto, 'verifyPassword', async (_plain, hash) => hash === 'hash');
    mock.method(accessesRepository, 'findById', async () => ({
      id: ACCESS_ID,
      portal_key: 'AT_FINANCAS',
      username: '123456789',
      secret_enc: 'enc:v1:cipher',
    }));
    mock.method(accessesRepository, 'decryptSecret', () => 'portal-secret');

    const data = await service.revealOfficialAccess({
      firmId: FIRM_ID,
      clientId: CLIENT_ID,
      accessId: ACCESS_ID,
      actorId: USER_ID,
      actorRole: 'FIRM_OWNER',
      currentPassword: 'correct',
    });

    assert.equal(data.revealedValue, 'portal-secret');
    assert.equal(data.revealTtlSeconds, 30);
    assert.equal(data.portalKey, 'AT_FINANCAS');
  });

  test('reveal rejeita palavra-passe incorrecta', async () => {
    resetMocks();
    mockClient();
    mockActor();
    mock.method(passwordCrypto, 'verifyPassword', async () => false);

    await assert.rejects(
      () =>
        service.revealOfficialAccess({
          firmId: FIRM_ID,
          clientId: CLIENT_ID,
          accessId: ACCESS_ID,
          actorId: USER_ID,
          currentPassword: 'wrong',
        }),
      (err) => err.code === 'INVALID_CURRENT_PASSWORD' || err.details?.code === 'INVALID_CURRENT_PASSWORD',
    );
  });

  test('upsert recusa gravar portal novo sem nome, utilizador nem senha', async () => {
    resetMocks();
    mockClient();
    mockActor();
    mock.method(passwordCrypto, 'verifyPassword', async () => true);
    mock.method(accessesRepository, 'findByPortalKey', async () => null);

    await assert.rejects(
      () =>
        service.upsertOfficialAccess({
          firmId: FIRM_ID,
          clientId: CLIENT_ID,
          actorId: USER_ID,
          currentPassword: 'ok',
          portalKey: 'VIA_CTT',
        }),
      (err) => err.details?.code === 'PASSWORD_REQUIRED' || err.code === 'PASSWORD_REQUIRED',
    );
  });
});
