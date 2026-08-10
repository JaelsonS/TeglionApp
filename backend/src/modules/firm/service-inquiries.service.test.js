const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const serviceInquiriesService = require('./service-inquiries.service');

const FIRM_ID = 'firm-x';

function resetMocks() {
  mock.restoreAll();
}

function mockAudit() {
  mock.method(auditRepository, 'writeAuditLog', async () => {});
}

test('create: rejeita quando nem leadId nem clientId são indicados', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1' }));

  await assert.rejects(
    () => serviceInquiriesService.create({ firmId: FIRM_ID, actor: {}, payload: { serviceId: 'service-1' } }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('create: rejeita quando leadId e clientId são indicados ao mesmo tempo (XOR)', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1' }));

  await assert.rejects(
    () =>
      serviceInquiriesService.create({
        firmId: FIRM_ID,
        actor: {},
        payload: { serviceId: 'service-1', leadId: 'lead-1', clientId: 'client-1' },
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('create: aceita só leadId, cria a inquiry', async () => {
  resetMocks();
  mockAudit();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1' }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ id: 'lead-1' }));
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => ({ id: 'inquiry-1', ...args }));

  const { inquiry } = await serviceInquiriesService.create({
    firmId: FIRM_ID,
    actor: { id: 'staff-1' },
    payload: { serviceId: 'service-1', leadId: 'lead-1' },
  });
  assert.equal(inquiry.id, 'inquiry-1');
  assert.equal(inquiry.leadId, 'lead-1');
  assert.equal(inquiry.clientId, null);
});

test('create: serviço de outro firm (não encontrado com o firmId do actor) é rejeitado', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => null);

  await assert.rejects(
    () =>
      serviceInquiriesService.create({
        firmId: FIRM_ID,
        actor: {},
        payload: { serviceId: 'service-de-outro-firm', leadId: 'lead-1' },
      }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('update: não permite transição a partir de estado terminal (COMPLETED)', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', status: 'COMPLETED' }));

  await assert.rejects(
    () =>
      serviceInquiriesService.update({
        firmId: FIRM_ID,
        id: 'inquiry-1',
        actor: {},
        payload: { status: 'IN_PROGRESS' },
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('update: CANCELLED é aceite a partir de qualquer estado não-terminal', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', status: 'DOCS_REQUESTED' }));
  mock.method(serviceInquiriesRepository, 'updateRow', async (id, firmId, patch) => ({ id, status: patch.status }));

  const { inquiry } = await serviceInquiriesService.update({
    firmId: FIRM_ID,
    id: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { status: 'CANCELLED' },
  });
  assert.equal(inquiry.status, 'CANCELLED');
});

test('update: transição para estado terminal aperta access_token_expires_at (não fica indefinido)', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', status: 'IN_PROGRESS' }));
  let patchSent = null;
  mock.method(serviceInquiriesRepository, 'updateRow', async (id, firmId, patch) => {
    patchSent = patch;
    return { id, status: patch.status };
  });

  await serviceInquiriesService.update({
    firmId: FIRM_ID,
    id: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { status: 'COMPLETED' },
  });

  assert.ok(patchSent.accessTokenExpiresAt, 'devia apertar a expiração ao concluir');
  const daysUntilExpiry = (new Date(patchSent.accessTokenExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  assert.ok(daysUntilExpiry <= 31 && daysUntilExpiry >= 29, 'janela de graça devia ser ~30 dias, não o tecto de 180');
});

test('update: transição não-terminal não mexe em access_token_expires_at', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', status: 'NEW' }));
  let patchSent = null;
  mock.method(serviceInquiriesRepository, 'updateRow', async (id, firmId, patch) => {
    patchSent = patch;
    return { id, status: patch.status };
  });

  await serviceInquiriesService.update({
    firmId: FIRM_ID,
    id: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { status: 'CONTACTED' },
  });

  assert.equal(patchSent.accessTokenExpiresAt, undefined);
});

test('revokeAccessToken: marca revogado e audita', async () => {
  resetMocks();
  let auditAction = null;
  mock.method(auditRepository, 'writeAuditLog', async (args) => {
    auditAction = args.action;
  });
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', accessTokenRevokedAt: null }));
  let patchSent = null;
  mock.method(serviceInquiriesRepository, 'updateRow', async (id, firmId, patch) => {
    patchSent = patch;
    return { id, accessTokenRevokedAt: patch.accessTokenRevokedAt };
  });

  const { inquiry } = await serviceInquiriesService.revokeAccessToken({
    firmId: FIRM_ID,
    id: 'inquiry-1',
    actor: { id: 'staff-1' },
  });

  assert.ok(inquiry.accessTokenRevokedAt);
  assert.ok(patchSent.accessTokenRevokedAt);
  assert.equal(auditAction, 'service_inquiry.token_revoked');
});

test('revokeAccessToken: já revogado é idempotente (não chama updateRow de novo)', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    accessTokenRevokedAt: '2026-01-01T00:00:00.000Z',
  }));
  mock.method(serviceInquiriesRepository, 'updateRow', async () => {
    throw new Error('não devia chamar updateRow para um token já revogado');
  });

  const { inquiry } = await serviceInquiriesService.revokeAccessToken({
    firmId: FIRM_ID,
    id: 'inquiry-1',
    actor: { id: 'staff-1' },
  });
  assert.equal(inquiry.accessTokenRevokedAt, '2026-01-01T00:00:00.000Z');
});

test('revokeAccessToken: solicitação inexistente devolve 404', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => null);

  await assert.rejects(
    () => serviceInquiriesService.revokeAccessToken({ firmId: FIRM_ID, id: 'inquiry-x', actor: {} }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});
