const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const leadsService = require('./leads.service');

const FIRM_ID = 'firm-x';

function resetMocks() {
  mock.restoreAll();
}

// Nunca deixar um teste tocar a Supabase real de produção — audit_logs é sempre mockado.
function mockAudit() {
  mock.method(auditRepository, 'writeAuditLog', async () => {});
}

test('resolveIdentity: NIF match em clients tem prioridade sobre tudo', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientByTaxId', async () => ({ id: 'client-1' }));
  mock.method(clientsRepository, 'findClientByEmailForFirm', async () => {
    throw new Error('não deveria chegar aqui — NIF já resolveu');
  });

  const result = await leadsService.resolveIdentity(FIRM_ID, { email: 'a@x.com', taxId: '123456789' });
  assert.deepEqual(result, { type: 'CLIENT', id: 'client-1' });
});

test('resolveIdentity: sem NIF match, cai para email em clients', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientByTaxId', async () => null);
  mock.method(clientsRepository, 'findClientByEmailForFirm', async (email, firmId) => {
    assert.equal(email, 'a@x.com');
    assert.equal(firmId, FIRM_ID);
    return { id: 'client-2' };
  });

  const result = await leadsService.resolveIdentity(FIRM_ID, { email: 'A@X.com  ' });
  assert.deepEqual(result, { type: 'CLIENT', id: 'client-2' });
});

test('resolveIdentity: sem match em clients, reaproveita Lead existente', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientByTaxId', async () => null);
  mock.method(clientsRepository, 'findClientByEmailForFirm', async () => null);
  mock.method(leadsRepository, 'findMatchForFirm', async () => ({ id: 'lead-1' }));

  const result = await leadsService.resolveIdentity(FIRM_ID, { email: 'novo@x.com' });
  assert.deepEqual(result, { type: 'LEAD', id: 'lead-1' });
});

test('resolveIdentity: sem nenhum match, cria Lead novo', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientByTaxId', async () => null);
  mock.method(clientsRepository, 'findClientByEmailForFirm', async () => null);
  mock.method(leadsRepository, 'findMatchForFirm', async () => null);
  mock.method(leadsRepository, 'createRow', async (args) => ({ id: 'lead-novo', ...args }));

  const result = await leadsService.resolveIdentity(FIRM_ID, { name: 'Maria', email: 'maria@x.com' });
  assert.deepEqual(result, { type: 'LEAD', id: 'lead-novo' });
});

test('resolveIdentity: email normalizado antes de comparar (maiúsculas/espaços não geram duplicado)', async () => {
  resetMocks();
  mock.method(clientsRepository, 'findClientByTaxId', async () => null);
  let capturedEmail = null;
  mock.method(clientsRepository, 'findClientByEmailForFirm', async (email) => {
    capturedEmail = email;
    return null;
  });
  mock.method(leadsRepository, 'findMatchForFirm', async () => null);
  mock.method(leadsRepository, 'createRow', async (args) => ({ id: 'lead-x', ...args }));

  await leadsService.resolveIdentity(FIRM_ID, { email: '  Maria@Exemplo.COM  ' });
  assert.equal(capturedEmail, 'maria@exemplo.com');
});

test('resolveIdentity: NIF com formatação (pontos/espaços) é normalizado para dígitos', async () => {
  resetMocks();
  let capturedTaxId = null;
  mock.method(clientsRepository, 'findClientByTaxId', async (firmId, taxId) => {
    capturedTaxId = taxId;
    return null;
  });
  mock.method(clientsRepository, 'findClientByEmailForFirm', async () => null);
  mock.method(leadsRepository, 'findMatchForFirm', async () => null);
  mock.method(leadsRepository, 'createRow', async (args) => ({ id: 'lead-y', ...args }));

  await leadsService.resolveIdentity(FIRM_ID, { taxId: '123.456.789' });
  assert.equal(capturedTaxId, '123456789');
});

test('update: transição a partir de estado terminal (CONVERTED) é rejeitada', async () => {
  resetMocks();
  mockAudit();
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ id: 'lead-1', status: 'CONVERTED' }));

  await assert.rejects(
    () => leadsService.update({ firmId: FIRM_ID, id: 'lead-1', actor: { id: 'staff-1' }, payload: { status: 'CONTACTED' } }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('update: transição para estado inválido é rejeitada', async () => {
  resetMocks();
  mockAudit();
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ id: 'lead-1', status: 'NEW' }));

  await assert.rejects(
    () => leadsService.update({ firmId: FIRM_ID, id: 'lead-1', actor: { id: 'staff-1' }, payload: { status: 'NOT_A_STATUS' } }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('update: salto directo NEW -> CONVERTED é permitido (não é linear obrigatório)', async () => {
  resetMocks();
  mockAudit();
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ id: 'lead-1', status: 'NEW' }));
  mock.method(leadsRepository, 'updateRow', async (id, firmId, patch) => ({ id, status: patch.status }));

  const { lead } = await leadsService.update({
    firmId: FIRM_ID,
    id: 'lead-1',
    actor: { id: 'staff-1' },
    payload: { status: 'CONVERTED' },
  });
  assert.equal(lead.status, 'CONVERTED');
});

resetMocks();
