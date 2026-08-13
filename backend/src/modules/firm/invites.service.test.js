const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const crypto = require('node:crypto');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const invitesRepository = require('../../db/supabase/repositories/invites.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const firmBrandingService = require('./firm-branding.service');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const securityAudit = require('../../services/audit/security-audit.service');
const supabaseClient = require('../../db/supabase/client');

const invitesService = require('./invites.service');

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

const FIRM = { id: 'firm-1', name: 'Escritório Exemplo', slug: 'exemplo' };
const CLIENT_NO_ACCESS = {
  id: 'client-1',
  firmId: 'firm-1',
  displayName: 'Cliente Sem Acesso',
  email: 'cliente1@exemplo.pt',
  hasPortalAccess: false,
  portalAccessStatus: 'NO_ACCESS',
};
const CLIENT_ACTIVE = {
  id: 'client-2',
  firmId: 'firm-1',
  displayName: 'Cliente Activo',
  email: 'cliente2@exemplo.pt',
  hasPortalAccess: true,
  portalAccessStatus: 'ACTIVE',
};

function resetMocks() {
  mock.restoreAll();
}

function stubHappyPathDeps() {
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(firmBrandingService, 'getFirmProfile', async () => ({
    firm: { name: FIRM.name, branding: { primaryColor: null }, settings: { contact: {} } },
    logoUrl: null,
  }));
  mock.method(contabilNotifications, 'notifyClientInvite', async () => ({}));
  mock.method(contabilNotifications, 'notifyClientWelcome', async () => ({}));
  mock.method(securityAudit, 'recordClientMutation', async () => {});
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async () => {});
  mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  mock.method(clientsRepository, 'updateClientAuth', async () => {});
}

test.beforeEach(() => {
  resetMocks();
});

test.afterEach(() => {
  resetMocks();
});

// ---------------------------------------------------------------------------
// createClientInvite — não deve regredir o fluxo individual já em produção
// ---------------------------------------------------------------------------

test('createClientInvite: rejeita se o cliente não tem e-mail no cadastro', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => ({
    ...CLIENT_NO_ACCESS,
    email: null,
  }));
  const createInvite = mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-1' }));

  await assert.rejects(
    () => invitesService.createClientInvite({ firmId: 'firm-1', clientId: 'client-1', actor: null, req: null }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'CLIENT_EMAIL_REQUIRED');
      return true;
    },
  );
  assert.equal(createInvite.mock.callCount(), 0);
});

test('createClientInvite: rejeita e-mail inválido no cadastro', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => ({
    ...CLIENT_NO_ACCESS,
    email: 'nao-e-email',
  }));

  await assert.rejects(
    () => invitesService.createClientInvite({ firmId: 'firm-1', clientId: 'client-1', actor: null, req: null }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'CLIENT_EMAIL_INVALID');
      return true;
    },
  );
});

test('createClientInvite: com initialPassword activa o portal sem criar convite pendente', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_NO_ACCESS);
  const createInvite = mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-1' }));
  const updateAuth = mock.method(clientsRepository, 'updateClientAuth', async () => {});
  const updateStatus = mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});

  const result = await invitesService.createClientInvite({
    firmId: 'firm-1',
    clientId: 'client-1',
    initialPassword: 'SenhaForte!2026',
    actor: null,
    req: null,
  });

  assert.equal(result.activatedWithPassword, true);
  assert.equal(createInvite.mock.callCount(), 0);
  assert.equal(updateAuth.mock.callCount(), 1);
  assert.equal(updateStatus.mock.calls[0].arguments[1], 'ACTIVE');
  assert.match(result.inviteUrl, /\/auth\/client\/login/);
});

test('createClientInvite: rejeita com 409 se o cliente já tem acesso ao portal (comportamento preservado)', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_ACTIVE);
  const createInvite = mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-1' }));

  await assert.rejects(
    () => invitesService.createClientInvite({ firmId: 'firm-1', clientId: 'client-2', actor: null, req: null }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
  assert.equal(createInvite.mock.callCount(), 0);
});

test('createClientInvite: grava o token como hash (sha256), nunca em texto puro', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_NO_ACCESS);
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  const createInvite = mock.method(invitesRepository, 'createInvite', async (args) => ({ id: 'inv-1', ...args }));

  const result = await invitesService.createClientInvite({
    firmId: 'firm-1',
    clientId: 'client-1',
    email: 'cliente1@exemplo.pt',
    actor: null,
    req: null,
  });

  const storedToken = createInvite.mock.calls[0].arguments[0].token;
  const rawTokenFromUrl = result.inviteUrl.split('/').pop();

  assert.equal(storedToken, sha256(rawTokenFromUrl));
  assert.notEqual(storedToken, rawTokenFromUrl); // nunca em texto puro
});

test('createClientInvite: marca portal_access_status como PENDING_INVITE quando há clientId', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_NO_ACCESS);
  mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-1' }));
  const updateStatus = mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});

  await invitesService.createClientInvite({ firmId: 'firm-1', clientId: 'client-1', actor: null, req: null });

  assert.equal(updateStatus.mock.callCount(), 1);
  assert.equal(updateStatus.mock.calls[0].arguments[0], 'client-1');
  assert.equal(updateStatus.mock.calls[0].arguments[1], 'PENDING_INVITE');
  assert.equal(updateStatus.mock.calls[0].arguments[2], 'firm-1');
});

test('createClientInvite: regista auditoria client.invite.sent', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_NO_ACCESS);
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-1' }));
  const audit = mock.method(securityAudit, 'recordClientMutation', async () => {});

  await invitesService.createClientInvite({ firmId: 'firm-1', clientId: 'client-1', actor: null, req: null });

  assert.equal(audit.mock.callCount(), 1);
  assert.equal(audit.mock.calls[0].arguments[0].action, 'client.invite.sent');
});

// ---------------------------------------------------------------------------
// revokeClientAccess — não pode apagar dados, tem de cortar sessões activas
// ---------------------------------------------------------------------------

test('revokeClientAccess: lança 404 se o cliente não existir', async () => {
  mock.method(clientsRepository, 'findClientById', async () => null);
  await assert.rejects(
    () => invitesService.revokeClientAccess({ firmId: 'firm-1', clientId: 'nope', actor: null, req: null }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('revokeClientAccess: revoga convites pendentes, marca REVOKED e corta sessões de refresh — sem tocar em clients.status', async () => {
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_ACTIVE);
  const revokeInvites = mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  const updateStatus = mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  const clearPassword = mock.method(clientsRepository, 'updateClientAuth', async () => {});
  const deleteSessions = mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async () => {});
  const updateClient = mock.method(clientsRepository, 'updateClient', async () => {
    throw new Error('updateClient NÃO deveria ser chamado por revokeClientAccess');
  });
  const audit = mock.method(securityAudit, 'recordClientMutation', async () => {});

  const result = await invitesService.revokeClientAccess({
    firmId: 'firm-1',
    clientId: 'client-2',
    actor: { id: 'staff-1', role: 'FIRM_OWNER' },
    req: null,
  });

  assert.deepEqual(result, { revoked: true });
  assert.deepEqual(revokeInvites.mock.calls[0].arguments, ['firm-1', 'client-2']);
  assert.equal(updateStatus.mock.calls[0].arguments[0], 'client-2');
  assert.equal(updateStatus.mock.calls[0].arguments[1], 'REVOKED');
  assert.equal(updateStatus.mock.calls[0].arguments[2], 'firm-1');
  assert.equal(clearPassword.mock.calls[0].arguments[0], 'client-2');
  assert.equal(clearPassword.mock.calls[0].arguments[1].passwordHash, null);
  assert.equal(clearPassword.mock.calls[0].arguments[1].firmId, 'firm-1');
  assert.deepEqual(deleteSessions.mock.calls[0].arguments, ['client', 'client-2']);
  assert.equal(updateClient.mock.callCount(), 0);
  assert.equal(audit.mock.calls[0].arguments[0].action, 'client.access.revoked');
});

// ---------------------------------------------------------------------------
// resendClientInvite — precisa funcionar mesmo quando o cliente já teve
// acesso (ao contrário de createClientInvite, que bloqueia nesse caso)
// ---------------------------------------------------------------------------

test('resendClientInvite: funciona mesmo se o cliente já teve acesso (não lança 409)', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_ACTIVE);
  mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  mock.method(invitesRepository, 'createInvite', async (args) => ({ id: 'inv-2', ...args }));
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});

  const result = await invitesService.resendClientInvite({
    firmId: 'firm-1',
    clientId: 'client-2',
    actor: { id: 'staff-1' },
    req: null,
  });

  assert.ok(result.inviteUrl);
  assert.equal(result.emailSent, true);
});

test('resendClientInvite: revoga convites pendentes antes de emitir um novo e repõe PENDING_INVITE', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_ACTIVE);
  const revokeInvites = mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  mock.method(invitesRepository, 'createInvite', async (args) => ({ id: 'inv-2', ...args }));
  const updateStatus = mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});

  await invitesService.resendClientInvite({ firmId: 'firm-1', clientId: 'client-2', actor: null, req: null });

  assert.equal(revokeInvites.mock.callCount(), 1);
  assert.equal(updateStatus.mock.calls[0].arguments[0], 'client-2');
  assert.equal(updateStatus.mock.calls[0].arguments[1], 'PENDING_INVITE');
  assert.equal(updateStatus.mock.calls[0].arguments[2], 'firm-1');
});

test('resendClientInvite: novo token é diferente do anterior e também gravado como hash', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_ACTIVE);
  mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  const createInvite = mock.method(invitesRepository, 'createInvite', async (args) => ({ id: 'inv-2', ...args }));
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});

  const result = await invitesService.resendClientInvite({ firmId: 'firm-1', clientId: 'client-2', actor: null, req: null });

  const storedToken = createInvite.mock.calls[0].arguments[0].token;
  const rawTokenFromUrl = result.inviteUrl.split('/').pop();
  assert.equal(storedToken, sha256(rawTokenFromUrl));
});

test('resendClientInvite: regista auditoria client.invite.resent', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientById', async () => CLIENT_ACTIVE);
  mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-2' }));
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  const audit = mock.method(securityAudit, 'recordClientMutation', async () => {});

  await invitesService.resendClientInvite({ firmId: 'firm-1', clientId: 'client-2', actor: null, req: null });

  assert.equal(audit.mock.calls[0].arguments[0].action, 'client.invite.resent');
});

// ---------------------------------------------------------------------------
// createBulkClientInvites
// ---------------------------------------------------------------------------

test('createBulkClientInvites: rejeita lista vazia com 400', async () => {
  await assert.rejects(
    () => invitesService.createBulkClientInvites({ firmId: 'firm-1', clientIds: [], actor: null, req: null }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('createBulkClientInvites: conta clientes já activos sem gerar novo convite para eles', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientsByIds', async () => [CLIENT_ACTIVE]);
  const createInvite = mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-x' }));

  const result = await invitesService.createBulkClientInvites({
    firmId: 'firm-1',
    clientIds: ['client-2'],
    actor: null,
    req: null,
  });

  assert.equal(result.alreadyActive, 1);
  assert.equal(result.sent, 0);
  assert.equal(createInvite.mock.callCount(), 0);
});

test('createBulkClientInvites: conta clientes sem e-mail como skippedNoEmail', async () => {
  stubHappyPathDeps();
  const noEmailClient = { ...CLIENT_NO_ACCESS, id: 'client-3', email: null };
  mock.method(clientsRepository, 'findClientsByIds', async () => [noEmailClient]);
  const createInvite = mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-x' }));

  const result = await invitesService.createBulkClientInvites({
    firmId: 'firm-1',
    clientIds: ['client-3'],
    actor: null,
    req: null,
  });

  assert.equal(result.skippedNoEmail, 1);
  assert.equal(createInvite.mock.callCount(), 0);
});

test('createBulkClientInvites: envia convite para clientes sem acesso e com e-mail, gerando token hasheado por cliente', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientsByIds', async () => [CLIENT_NO_ACCESS]);
  mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  const createInvite = mock.method(invitesRepository, 'createInvite', async (args) => ({ id: 'inv-y', ...args }));

  const result = await invitesService.createBulkClientInvites({
    firmId: 'firm-1',
    clientIds: ['client-1'],
    actor: null,
    req: null,
  });

  assert.equal(result.sent, 1);
  assert.equal(createInvite.mock.callCount(), 1);
  assert.equal(createInvite.mock.calls[0].arguments[0].token.length, 64); // hex sha256
});

test('createBulkClientInvites: uma falha isolada não interrompe o lote (conta como failed e continua)', async () => {
  stubHappyPathDeps();
  const clientA = { ...CLIENT_NO_ACCESS, id: 'client-a', email: 'a@exemplo.pt' };
  const clientB = { ...CLIENT_NO_ACCESS, id: 'client-b', email: 'b@exemplo.pt' };
  mock.method(clientsRepository, 'findClientsByIds', async () => [clientA, clientB]);
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  let call = 0;
  mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {
    call += 1;
    if (call === 1) throw new Error('falha simulada no cliente A');
  });
  const createInvite = mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-z' }));

  const result = await invitesService.createBulkClientInvites({
    firmId: 'firm-1',
    clientIds: ['client-a', 'client-b'],
    actor: null,
    req: null,
  });

  assert.equal(result.failed, 1);
  assert.equal(result.sent, 1);
  assert.equal(createInvite.mock.callCount(), 1); // só o segundo cliente chegou a criar o convite
});

test('createBulkClientInvites: regista auditoria única com o resumo do lote', async () => {
  stubHappyPathDeps();
  mock.method(clientsRepository, 'findClientsByIds', async () => [CLIENT_NO_ACCESS, CLIENT_ACTIVE]);
  mock.method(invitesRepository, 'revokePendingInvitesForClient', async () => {});
  mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  mock.method(invitesRepository, 'createInvite', async () => ({ id: 'inv-z' }));
  const audit = mock.method(securityAudit, 'recordClientMutation', async () => {});

  await invitesService.createBulkClientInvites({
    firmId: 'firm-1',
    clientIds: ['client-1', 'client-2'],
    actor: null,
    req: null,
  });

  assert.equal(audit.mock.callCount(), 1);
  assert.equal(audit.mock.calls[0].arguments[0].action, 'client.invite.bulk_sent');
  assert.equal(audit.mock.calls[0].arguments[0].metadata.requested, 2);
});

// ---------------------------------------------------------------------------
// Lookup de convite por token — precisa comparar por hash, não em texto puro
// ---------------------------------------------------------------------------

test('getInvitePublicPreview: procura o convite pelo hash do token recebido, não pelo texto puro', async () => {
  const rawToken = 'token-de-teste-abc123';
  const findByToken = mock.method(invitesRepository, 'findInviteByToken', async () => null);

  await assert.rejects(() => invitesService.getInvitePublicPreview(rawToken));

  assert.equal(findByToken.mock.calls[0].arguments[0], sha256(rawToken));
  assert.notEqual(findByToken.mock.calls[0].arguments[0], rawToken);
});

test('getInvitePublicPreview: convite REVOKED devolve mensagem específica de "não é mais válido"', async () => {
  mock.method(invitesRepository, 'findInviteByToken', async () => ({
    id: 'inv-1',
    status: 'REVOKED',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    firm_id: 'firm-1',
  }));

  await assert.rejects(
    () => invitesService.getInvitePublicPreview('qualquer-token'),
    (err) => {
      assert.match(err.message, /não é mais válido/i);
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// registerClientWithInvite — activação marca portal_access_status ACTIVE
// ---------------------------------------------------------------------------

test('registerClientWithInvite: convite REVOKED é rejeitado com mensagem específica', async () => {
  mock.method(invitesRepository, 'findInviteByToken', async () => ({
    id: 'inv-1',
    status: 'REVOKED',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  }));

  await assert.rejects(
    () =>
      invitesService.registerClientWithInvite({
        token: 'x',
        email: 'novo@exemplo.pt',
        password: 'SenhaForte!2026',
        fullName: 'Novo Cliente',
      }),
    (err) => {
      assert.match(err.message, /não é mais válido/i);
      return true;
    },
  );
});

test('registerClientWithInvite: cliente novo (sem client_id prévio) fica ACTIVE após activar o convite', async () => {
  stubHappyPathDeps();
  mock.method(invitesRepository, 'findInviteByToken', async () => ({
    id: 'inv-1',
    client_id: null,
    email: null,
    status: 'PENDING',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    firm_id: 'firm-1',
  }));
  mock.method(clientsRepository, 'findClientsByEmail', async () => []);
  mock.method(clientsRepository, 'createClient', async ({ firmId, displayName, email }) => ({
    id: 'client-novo',
    firmId,
    displayName,
    email,
  }));
  mock.method(clientsRepository, 'updateClientAuth', async () => {});
  const updateStatus = mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  mock.method(invitesRepository, 'markInviteAccepted', async () => {});

  const result = await invitesService.registerClientWithInvite({
    token: 'x',
    email: 'novo@exemplo.pt',
    password: 'SenhaForte!2026',
    fullName: 'Novo Cliente',
  });

  assert.equal(result.clientId, 'client-novo');
  assert.deepEqual(updateStatus.mock.calls[0].arguments, ['client-novo', 'ACTIVE', 'firm-1']);
});

test('registerClientWithInvite: cliente pré-existente (revogado e reemitido) volta a ficar ACTIVE, preservando o mesmo client_id', async () => {
  stubHappyPathDeps();
  mock.method(invitesRepository, 'findInviteByToken', async () => ({
    id: 'inv-2',
    client_id: 'client-2', // mesmo cliente de antes — não é criado um novo
    email: null,
    status: 'PENDING',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    firm_id: 'firm-1',
  }));
  mock.method(clientsRepository, 'findClientsByEmail', async () => []);
  mock.method(clientsRepository, 'updateClientAuth', async () => {});
  mock.method(clientsRepository, 'updateClient', async () => ({ id: 'client-2' }));
  const eq2 = async () => ({ data: null, error: null });
  const eq1 = () => ({ eq: eq2 });
  const stubSb = { from: () => ({ update: () => ({ eq: eq1 }) }) };
  mock.method(supabaseClient, 'getSupabaseAdmin', () => stubSb);
  const updateStatus = mock.method(clientsRepository, 'updatePortalAccessStatus', async () => {});
  mock.method(invitesRepository, 'markInviteAccepted', async () => {});

  const result = await invitesService.registerClientWithInvite({
    token: 'x',
    email: 'cliente2@exemplo.pt',
    password: 'SenhaForte!2026',
    fullName: 'Cliente Activo',
  });

  assert.equal(result.clientId, 'client-2'); // mesmo id — nunca cria um cliente duplicado
  assert.deepEqual(updateStatus.mock.calls[0].arguments, ['client-2', 'ACTIVE', 'firm-1']);
});
