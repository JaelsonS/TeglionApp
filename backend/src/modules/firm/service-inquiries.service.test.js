const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const serviceInquiryRequestsRepository = require('../../db/supabase/repositories/service-inquiry-requests.repository');
const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const serviceInquiriesService = require('./service-inquiries.service');

const FIRM_ID = 'firm-x';

function resetMocks() {
  mock.restoreAll();
  mock.method(firmInquiryTagsRepository, 'listLinksForInquiries', async () => []);
  mock.method(firmInquiryTagsRepository, 'listByFirm', async () => []);
  mock.method(firmInquiryTagsRepository, 'replaceLinksForInquiry', async () => []);
}

function mockAudit() {
  mock.method(auditRepository, 'writeAuditLog', async () => {});
}

function mockTags() {
  mock.method(firmInquiryTagsRepository, 'listLinksForInquiries', async () => []);
  mock.method(firmInquiryTagsRepository, 'listByFirm', async () => []);
  mock.method(firmInquiryTagsRepository, 'replaceLinksForInquiry', async () => []);
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

test('getById: monta o checklist a partir de service_inquiry_requests (não recalcula do zero)', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    firmId: FIRM_ID,
    serviceId: 'service-1',
    leadId: 'lead-1',
    clientId: null,
    status: 'DOCS_REQUESTED',
    answers: { q1: 'sim' },
  }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1', name: 'IRS 2026' }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    {
      id: 'req-cc',
      kind: 'document',
      tag: 'cc',
      title: 'Cartão de Cidadão',
      status: 'ANSWERED',
      documentId: 'doc-1',
      textReply: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      answeredAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'req-extra',
      kind: 'question',
      tag: null,
      title: 'Tem dependentes a cargo?',
      status: 'PENDING',
      documentId: null,
      textReply: null,
      createdAt: '2026-01-03T00:00:00.000Z',
      answeredAt: null,
    },
  ]);
  let historyArgs = null;
  mock.method(auditRepository, 'listByEntity', async (args) => {
    historyArgs = args;
    return [{ id: 'log-1', action: 'service_inquiry.submitted', actorRole: 'PUBLIC', metadata: {}, createdAt: '2026-01-01T00:00:00.000Z' }];
  });

  const { inquiry, checklist, history } = await serviceInquiriesService.getById({ firmId: FIRM_ID, id: 'inquiry-1' });

  assert.equal(inquiry.serviceName, 'IRS 2026');
  assert.equal(inquiry.requesterName, 'Ana');
  assert.equal(checklist.length, 2);
  assert.equal(checklist[0].received, true);
  assert.equal(checklist[0].kind, 'document');
  assert.equal(checklist[1].received, false);
  assert.equal(checklist[1].kind, 'question');
  assert.deepEqual(historyArgs, { firmId: FIRM_ID, entityType: 'service_inquiry', entityId: 'inquiry-1' });
  assert.equal(history.length, 1);
  assert.equal(history[0].action, 'service_inquiry.submitted');
});

test('getById: sugere documentos "manual" activados pelas respostas mas ainda não pedidos', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-2',
    firmId: FIRM_ID,
    serviceId: 'service-1',
    leadId: 'lead-1',
    clientId: null,
    status: 'IN_PROGRESS',
    answers: { casado: 'sim' },
  }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({
    id: 'service-1',
    name: 'IRS 2026',
    documentRequirements: [
      { tag: 'certidao_casamento', title: 'Certidão de casamento', timing: 'manual' },
      { tag: 'cc', title: 'Cartão de Cidadão', timing: 'immediate' },
    ],
    intakeForm: { questions: [] },
  }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    { id: 'req-cc', kind: 'document', tag: 'cc', title: 'Cartão de Cidadão', status: 'PENDING', documentId: null, textReply: null, createdAt: null, answeredAt: null },
  ]);
  mock.method(auditRepository, 'listByEntity', async () => []);

  const { suggestedDocuments } = await serviceInquiriesService.getById({ firmId: FIRM_ID, id: 'inquiry-2' });

  assert.equal(suggestedDocuments.length, 1);
  assert.equal(suggestedDocuments[0].tag, 'certidao_casamento');
});

test('getById: documento "manual" já pedido (existe no checklist) deixa de ser sugerido', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-3',
    firmId: FIRM_ID,
    serviceId: 'service-1',
    leadId: 'lead-1',
    clientId: null,
    status: 'IN_PROGRESS',
    answers: { casado: 'sim' },
  }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({
    id: 'service-1',
    name: 'IRS 2026',
    documentRequirements: [{ tag: 'certidao_casamento', title: 'Certidão de casamento', timing: 'manual' }],
    intakeForm: { questions: [] },
  }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    { id: 'req-1', kind: 'document', tag: 'certidao_casamento', title: 'Certidão de casamento', status: 'PENDING', documentId: null, textReply: null, createdAt: null, answeredAt: null },
  ]);
  mock.method(auditRepository, 'listByEntity', async () => []);

  const { suggestedDocuments } = await serviceInquiriesService.getById({ firmId: FIRM_ID, id: 'inquiry-3' });

  assert.deepEqual(suggestedDocuments, []);
});

test('addServiceInquiryRequest: solicitação inexistente devolve 404', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => null);

  await assert.rejects(
    () =>
      serviceInquiriesService.addServiceInquiryRequest({
        firmId: FIRM_ID,
        inquiryId: 'inquiry-x',
        actor: {},
        payload: { kind: 'question', title: 'Tem dependentes?' },
      }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('addServiceInquiryRequest: rejeita em estado terminal com 409', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', status: 'COMPLETED' }));

  await assert.rejects(
    () =>
      serviceInquiriesService.addServiceInquiryRequest({
        firmId: FIRM_ID,
        inquiryId: 'inquiry-1',
        actor: {},
        payload: { kind: 'question', title: 'Mais uma coisa' },
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('addServiceInquiryRequest: rejeita kind inválido', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', status: 'IN_PROGRESS' }));

  await assert.rejects(
    () =>
      serviceInquiriesService.addServiceInquiryRequest({
        firmId: FIRM_ID,
        inquiryId: 'inquiry-1',
        actor: {},
        payload: { kind: 'chat', title: 'X' },
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('addServiceInquiryRequest: rejeita sem title', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({ id: 'inquiry-1', status: 'IN_PROGRESS' }));

  await assert.rejects(
    () =>
      serviceInquiriesService.addServiceInquiryRequest({
        firmId: FIRM_ID,
        inquiryId: 'inquiry-1',
        actor: {},
        payload: { kind: 'question' },
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('addServiceInquiryRequest: kind document gera tag automática; kind question fica sem tag', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    status: 'IN_PROGRESS',
    leadId: 'lead-1',
    clientId: null,
    accessToken: 'a'.repeat(64),
  }));
  mock.method(serviceInquiriesRepository, 'updateRow', async (_id, _firmId, patch) => ({ id: 'inquiry-1', ...patch }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana', email: null }));
  let created = null;
  mock.method(serviceInquiryRequestsRepository, 'createMany', async (rows) => {
    created = rows[0];
    return rows.map((args, i) => ({ id: `req-${i + 1}`, ...args, status: 'PENDING' }));
  });

  await serviceInquiriesService.addServiceInquiryRequest({
    firmId: FIRM_ID,
    inquiryId: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { kind: 'document', title: 'Comprovativo de morada actualizado' },
  });

  assert.ok(created.tag && created.tag.startsWith('pend_'), 'documento devia ganhar tag automática');

  await serviceInquiriesService.addServiceInquiryRequest({
    firmId: FIRM_ID,
    inquiryId: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { kind: 'question', title: 'Tem dependentes a cargo?' },
  });
  assert.equal(created.tag, null);
});

test('addServiceInquiryRequest: tag explícita (aceitar sugestão) é preservada em vez de gerar uma aleatória', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    status: 'IN_PROGRESS',
    leadId: 'lead-1',
    clientId: null,
    accessToken: 'a'.repeat(64),
  }));
  mock.method(serviceInquiriesRepository, 'updateRow', async (_id, _firmId, patch) => ({ id: 'inquiry-1', ...patch }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana', email: null }));
  let created = null;
  mock.method(serviceInquiryRequestsRepository, 'createMany', async (rows) => {
    created = rows[0];
    return rows.map((args, i) => ({ id: `req-${i + 1}`, ...args, status: 'PENDING' }));
  });

  await serviceInquiriesService.addServiceInquiryRequest({
    firmId: FIRM_ID,
    inquiryId: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { kind: 'document', title: 'Certidão de casamento', tag: 'certidao_casamento' },
  });

  assert.equal(created.tag, 'certidao_casamento');
});

test('addServiceInquiryRequest: audita e notifica o submissor quando há email, reaproveitando o mesmo token', async () => {
  resetMocks();
  mock.method(auditRepository, 'writeAuditLog', async () => {});
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    firmId: FIRM_ID,
    serviceId: 'service-1',
    status: 'IN_PROGRESS',
    leadId: 'lead-1',
    clientId: null,
    accessToken: 'b'.repeat(64),
  }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana', email: 'ana@x.com' }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1', name: 'IRS 2026' }));
  mock.method(firmsRepository, 'findFirmById', async () => ({ id: FIRM_ID, name: 'Escritório X' }));
  mock.method(serviceInquiryRequestsRepository, 'createMany', async (rows) =>
    rows.map((args, i) => ({ id: `req-${i + 1}`, ...args, status: 'PENDING' })),
  );

  let notifyArgs = null;
  mock.method(contabilNotifications, 'notifyLeadNewRequest', async (args) => {
    notifyArgs = args;
    return { ok: true };
  });

  await serviceInquiriesService.addServiceInquiryRequest({
    firmId: FIRM_ID,
    inquiryId: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: { kind: 'question', title: 'Tem dependentes a cargo?' },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(notifyArgs.toEmail, 'ana@x.com');
  assert.equal(notifyArgs.accessToken, 'b'.repeat(64));
  assert.equal(notifyArgs.items?.[0]?.title, 'Tem dependentes a cargo?');
});

test('addServiceInquiryRequestsBatch: cria vários itens e notifica uma vez', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    firmId: FIRM_ID,
    serviceId: 'service-1',
    status: 'IN_PROGRESS',
    leadId: 'lead-1',
    clientId: null,
    accessToken: 'c'.repeat(64),
  }));
  mock.method(serviceInquiriesRepository, 'updateRow', async (_id, _firmId, patch) => ({ id: 'inquiry-1', ...patch }));
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana', email: 'ana@x.com' }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({ id: 'service-1', name: 'IRS 2026' }));
  mock.method(firmsRepository, 'findFirmById', async () => ({ id: FIRM_ID, name: 'Escritório X' }));
  mock.method(serviceInquiryRequestsRepository, 'createMany', async (rows) =>
    rows.map((args, i) => ({ id: `req-${i + 1}`, ...args, status: 'PENDING' })),
  );

  let notifyArgs = null;
  mock.method(contabilNotifications, 'notifyLeadNewRequest', async (args) => {
    notifyArgs = args;
    return { ok: true };
  });

  const result = await serviceInquiriesService.addServiceInquiryRequestsBatch({
    firmId: FIRM_ID,
    inquiryId: 'inquiry-1',
    actor: { id: 'staff-1' },
    payload: {
      items: [
        { kind: 'document', title: 'Certidão de casamento', tag: 'certidao' },
        { kind: 'question', title: 'NIF do cônjuge?' },
      ],
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(result.requests.length, 2);
  assert.equal(notifyArgs.items.length, 2);
  assert.equal(notifyArgs.items[0].title, 'Certidão de casamento');
});

test('remove: solicitação inexistente devolve 404, nunca chega a chamar deleteRow', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => null);
  mock.method(serviceInquiriesRepository, 'deleteRow', async () => {
    throw new Error('não devia tentar apagar uma solicitação que não foi encontrada');
  });

  await assert.rejects(
    () => serviceInquiriesService.remove({ firmId: FIRM_ID, id: 'inquiry-1', actor: { id: 'staff-1' } }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('remove: caminho feliz — apaga e regista auditoria', async () => {
  resetMocks();
  mockAudit();
  mock.method(serviceInquiriesRepository, 'findByIdForFirm', async () => ({
    id: 'inquiry-1',
    status: 'NEW',
    serviceId: 'service-1',
  }));
  let deletedArgs = null;
  mock.method(serviceInquiriesRepository, 'deleteRow', async (id, firmId) => {
    deletedArgs = { id, firmId };
  });
  let auditArgs = null;
  mock.method(auditRepository, 'writeAuditLog', async (args) => {
    auditArgs = args;
  });

  const result = await serviceInquiriesService.remove({ firmId: FIRM_ID, id: 'inquiry-1', actor: { id: 'staff-1' } });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(deletedArgs, { id: 'inquiry-1', firmId: FIRM_ID });
  assert.equal(auditArgs.action, 'service_inquiry.deleted');
  assert.equal(auditArgs.entityId, 'inquiry-1');
});
