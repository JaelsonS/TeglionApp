const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const serviceInquiriesRepository = require('../../db/supabase/repositories/service-inquiries.repository');
const serviceInquiryDocumentsRepository = require('../../db/supabase/repositories/service-inquiry-documents.repository');
const serviceInquiryRequestsRepository = require('../../db/supabase/repositories/service-inquiry-requests.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const leadsService = require('./leads.service');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const bookingService = require('../booking/booking.service');
const serviceInquiriesService = require('./service-inquiries.service');

const FIRM = { id: 'firm-x', name: 'Escritório X', settings: {} };
const SERVICE = {
  id: 'service-irs',
  name: 'IRS 2026',
  slug: 'irs-2026',
  isPubliclyListed: true,
  documentRequirements: [{ tag: 'cc', title: 'Cartão de Cidadão' }],
  intakeForm: { questions: [] },
};

function resetMocks() {
  mock.restoreAll();
}

function mockNoise() {
  mock.method(auditRepository, 'writeAuditLog', async () => {});
  mock.method(firmUsersRepository, 'findFirmOwnerEmail', async () => null);
  mock.method(contabilNotifications, 'notifyLeadIntakeReceived', async () => ({ ok: true }));
  mock.method(contabilNotifications, 'notifyFirmIntakeSubmitted', async () => ({ ok: true }));
  mock.method(contabilNotifications, 'notifyFirmIntakeDocumentReceived', async () => ({ ok: true }));
  mock.method(contabilNotifications, 'notifyLeadIntakeChecklist', async () => ({ ok: true }));
  mock.method(serviceInquiriesRepository, 'findOpenLeadCapture', async () => null);
  mock.method(serviceInquiryRequestsRepository, 'createMany', async (rows) =>
    rows.map((r, i) => ({ id: `req-${i}`, ...r, status: 'PENDING' })),
  );
}

test('submitPublicIntake: firm inexistente devolve 404', async () => {
  resetMocks();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => null);

  await assert.rejects(
    () => serviceInquiriesService.submitPublicIntake({ firmSlug: 'nao-existe', serviceSlug: 'irs-2026', payload: {} }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('submitPublicIntake: serviço não público (ou slug errado) devolve 404', async () => {
  resetMocks();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [{ ...SERVICE, isPubliclyListed: false }]);

  await assert.rejects(
    () => serviceInquiriesService.submitPublicIntake({ firmSlug: 'x', serviceSlug: 'irs-2026', payload: { name: 'Ana' } }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('submitPublicIntake: rejeita sem nome', async () => {
  resetMocks();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [SERVICE]);

  await assert.rejects(
    () =>
      serviceInquiriesService.submitPublicIntake({
        firmSlug: 'x',
        serviceSlug: 'irs-2026',
        payload: { email: 'a@x.com' },
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('submitPublicIntake: rejeita sem email', async () => {
  resetMocks();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [SERVICE]);

  await assert.rejects(
    () =>
      serviceInquiriesService.submitPublicIntake({
        firmSlug: 'x',
        serviceSlug: 'irs-2026',
        payload: { name: 'Ana', phone: '912345678' },
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('submitPublicIntake: identidade nova (Lead) -> materializa docs immediate e DOCS_REQUESTED', async () => {
  resetMocks();
  mockNoise();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async (firmId) => {
    assert.equal(firmId, FIRM.id);
    return [SERVICE];
  });
  mock.method(leadsService, 'resolveIdentity', async (firmId, opts) => {
    assert.equal(firmId, FIRM.id);
    assert.equal(opts.source, 'PUBLIC_FORM');
    return { type: 'LEAD', id: 'lead-novo' };
  });
  let created = null;
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'inquiry-1', accessToken: args.accessToken, ...args };
  });
  let checklistRows = null;
  mock.method(serviceInquiryRequestsRepository, 'createMany', async (rows) => {
    checklistRows = rows;
    return rows.map((r, i) => ({ id: `req-${i}`, ...r, status: 'PENDING' }));
  });

  const { inquiry, requiredDocuments } = await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Ana', email: 'ana@x.com' },
  });

  assert.equal(created.leadId, 'lead-novo');
  assert.equal(created.clientId, null);
  assert.equal(created.status, 'DOCS_REQUESTED');
  assert.equal(created.accessToken.length, 64);
  assert.ok(created.accessTokenExpiresAt, 'devia definir um tecto de expiração já na criação');
  const daysUntilExpiry = (new Date(created.accessTokenExpiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  assert.ok(daysUntilExpiry > 170 && daysUntilExpiry <= 180, 'tecto inicial devia ser ~180 dias');
  assert.equal(requiredDocuments.length, 1, 'sugestões continuam disponíveis para a equipa');
  assert.equal(checklistRows.length, 1);
  assert.equal(checklistRows[0].tag, 'cc');
  assert.equal(inquiry.id, 'inquiry-1');
});

test('submitPublicIntake: sem documentos exigidos -> status IN_PROGRESS logo à criação', async () => {
  resetMocks();
  mockNoise();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [{ ...SERVICE, documentRequirements: [] }]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'LEAD', id: 'lead-novo' }));
  let created = null;
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'inquiry-2', ...args };
  });

  await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Bruno', email: 'bruno@x.com', phone: '900000000' },
  });

  assert.equal(created.status, 'IN_PROGRESS');
});

test('submitPublicIntake: materializa só docs immediate; manual fica para a equipa pedir depois', async () => {
  resetMocks();
  mockNoise();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [
    {
      ...SERVICE,
      documentRequirements: [
        { tag: 'cc', title: 'Cartão de Cidadão', timing: 'immediate' },
        { tag: 'certidao_casamento', title: 'Certidão de casamento', timing: 'manual' },
      ],
    },
  ]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'LEAD', id: 'lead-novo' }));
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => ({
    id: 'inquiry-3',
    status: args.status,
    ...args,
  }));
  let checklistRows = [];
  mock.method(serviceInquiryRequestsRepository, 'createMany', async (rows) => {
    checklistRows = rows;
    return rows.map((r, i) => ({ id: `req-${i}`, ...r, status: 'PENDING' }));
  });

  const { inquiry, requiredDocuments } = await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Carla', email: 'carla@x.com' },
  });

  assert.equal(checklistRows.length, 1);
  assert.equal(checklistRows[0].tag, 'cc');
  assert.equal(inquiry.status, 'DOCS_REQUESTED');
  assert.equal(requiredDocuments.length, 2);
});

test('submitPublicIntake: só documentos "manual" pendentes -> status IN_PROGRESS (nada foi realmente pedido ainda)', async () => {
  resetMocks();
  mockNoise();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [
    { ...SERVICE, documentRequirements: [{ tag: 'certidao_casamento', title: 'Certidão de casamento', timing: 'manual' }] },
  ]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'LEAD', id: 'lead-novo' }));
  let created = null;
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'inquiry-4', ...args };
  });

  await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Diana', email: 'diana@x.com' },
  });

  assert.equal(created.status, 'IN_PROGRESS');
});

test('submitPublicIntake: nome do serviço com {{ano_fiscal}} chega interpolado ao email do cliente e da equipa', async () => {
  resetMocks();
  mockNoise();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [
    { ...SERVICE, name: 'Declaração de IRS {{ano_fiscal}}' },
  ]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'LEAD', id: 'lead-novo' }));
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => ({ id: 'inquiry-5', ...args }));
  mock.method(firmUsersRepository, 'findFirmOwnerEmail', async () => 'dona@x.com');
  let leadEmailArgs = null;
  mock.method(contabilNotifications, 'notifyLeadIntakeReceived', async (args) => {
    leadEmailArgs = args;
    return { ok: true };
  });
  let staffEmailArgs = null;
  mock.method(contabilNotifications, 'notifyFirmIntakeSubmitted', async (args) => {
    staffEmailArgs = args;
    return { ok: true };
  });

  await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Elsa', email: 'elsa@x.com' },
  });
  await new Promise((resolve) => setImmediate(resolve));

  const expectedYear = new Date().getFullYear() - 1;
  assert.equal(leadEmailArgs.serviceName, `Declaração de IRS ${expectedYear}`);
  assert.equal(staffEmailArgs.serviceName, `Declaração de IRS ${expectedYear}`);
  assert.equal(leadEmailArgs.accessToken, undefined, 'email de obrigado não inclui link de documentos');
});

test('submitPublicIntake: identidade batida em Client existente -> clientId (não cria Lead)', async () => {
  resetMocks();
  mockNoise();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [SERVICE]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'CLIENT', id: 'client-1' }));
  let created = null;
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'inquiry-3', ...args };
  });

  await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Carla', email: 'carla@x.com', taxId: '123456789' },
  });

  assert.equal(created.clientId, 'client-1');
  assert.equal(created.leadId, null);
});

test('submitPublicIntake: requiresBooking + Client + slot válido -> reaproveita bookAsClient e liga consultationId', async () => {
  resetMocks();
  mockNoise();
  const bookableService = { ...SERVICE, requiresBooking: true };
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [bookableService]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'CLIENT', id: 'client-1' }));
  let bookAsClientArgs = null;
  mock.method(bookingService, 'bookAsClient', async (args) => {
    bookAsClientArgs = args;
    return { consultation: { id: 'consultation-1' }, service: bookableService };
  });
  let created = null;
  let updatedPatch = null;
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'inquiry-9', ...args };
  });
  mock.method(serviceInquiriesRepository, 'updateRow', async (id, firmId, patch) => {
    updatedPatch = patch;
    return {};
  });

  const { consultation } = await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Dora', email: 'dora@x.com', scheduledAt: '2026-09-10T10:00:00.000Z' },
  });

  assert.equal(bookAsClientArgs.clientId, 'client-1');
  assert.equal(bookAsClientArgs.serviceId, bookableService.id);
  assert.equal(bookAsClientArgs.scheduledAt, '2026-09-10T10:00:00.000Z');
  assert.equal(created.notes, null);
  assert.equal(updatedPatch.consultationId, 'consultation-1');
  assert.equal(consultation.id, 'consultation-1');
});

test('submitPublicIntake: requiresBooking + Lead novo + slot -> reserva consultation real via leadId (Fase 3a)', async () => {
  resetMocks();
  mockNoise();
  const bookableService = { ...SERVICE, requiresBooking: true };
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [bookableService]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'LEAD', id: 'lead-novo' }));
  let bookAsClientArgs = null;
  mock.method(bookingService, 'bookAsClient', async (args) => {
    bookAsClientArgs = args;
    return { consultation: { id: 'consultation-lead-1' }, service: bookableService };
  });
  let created = null;
  let updatedPatch = null;
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'inquiry-10', ...args };
  });
  mock.method(serviceInquiriesRepository, 'updateRow', async (id, firmId, patch) => {
    updatedPatch = patch;
    return {};
  });

  const { consultation } = await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Eva', email: 'eva@x.com', scheduledAt: '2026-09-10T10:00:00.000Z' },
  });

  assert.equal(bookAsClientArgs.leadId, 'lead-novo');
  assert.equal(bookAsClientArgs.clientId, undefined);
  assert.equal(bookAsClientArgs.scheduledAt, '2026-09-10T10:00:00.000Z');
  assert.equal(created.notes, null);
  assert.equal(updatedPatch.consultationId, 'consultation-lead-1');
  assert.equal(consultation.id, 'consultation-lead-1');
});

test('submitPublicIntake: requiresBooking + Client + horário já indisponível propaga 409 e não cria nada', async () => {
  resetMocks();
  mockNoise();
  const bookableService = { ...SERVICE, requiresBooking: true };
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [bookableService]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'CLIENT', id: 'client-1' }));
  mock.method(bookingService, 'bookAsClient', async () => {
    const err = new Error('Este horário já não está disponível');
    err.statusCode = 409;
    throw err;
  });
  mock.method(serviceInquiriesRepository, 'createRow', async () => {
    throw new Error('não devia chegar a criar a inquiry se a reserva falhou');
  });

  await assert.rejects(
    () =>
      serviceInquiriesService.submitPublicIntake({
        firmSlug: 'x',
        serviceSlug: 'irs-2026',
        payload: { name: 'Filipe', email: 'filipe@x.com', scheduledAt: '2026-09-10T10:00:00.000Z' },
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('submitPublicIntake: requiresBooking + Lead + horário já indisponível propaga 409 e não cria nada (mesma protecção do Client)', async () => {
  resetMocks();
  mockNoise();
  const bookableService = { ...SERVICE, requiresBooking: true };
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [bookableService]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'LEAD', id: 'lead-2' }));
  mock.method(bookingService, 'bookAsClient', async () => {
    const err = new Error('Este horário já não está disponível');
    err.statusCode = 409;
    throw err;
  });
  mock.method(serviceInquiriesRepository, 'createRow', async () => {
    throw new Error('não devia chegar a criar a inquiry se a reserva falhou');
  });

  await assert.rejects(
    () =>
      serviceInquiriesService.submitPublicIntake({
        firmSlug: 'x',
        serviceSlug: 'irs-2026',
        payload: { name: 'Gabriela', email: 'gabriela@x.com', scheduledAt: '2026-09-10T10:00:00.000Z' },
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('submitPublicIntake: requiresBooking=false ignora scheduledAt mesmo se enviado', async () => {
  resetMocks();
  mockNoise();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => FIRM);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [{ ...SERVICE, requiresBooking: false }]);
  mock.method(leadsService, 'resolveIdentity', async () => ({ type: 'LEAD', id: 'lead-1' }));
  mock.method(bookingService, 'bookAsClient', async () => {
    throw new Error('não devia chamar bookAsClient quando requiresBooking=false');
  });
  let created = null;
  mock.method(serviceInquiriesRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'inquiry-11', ...args };
  });

  await serviceInquiriesService.submitPublicIntake({
    firmSlug: 'x',
    serviceSlug: 'irs-2026',
    payload: { name: 'Gil', email: 'gil@x.com', scheduledAt: '2026-09-10T10:00:00.000Z' },
  });

  assert.equal(created.notes, null);
});

test('getByAccessToken: token inexistente devolve 404', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => null);

  await assert.rejects(
    () => serviceInquiriesService.getByAccessToken('token-invalido'),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('getByAccessToken: devolve checklist com received=true só para tags já entregues', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    serviceId: SERVICE.id,
    status: 'DOCS_REQUESTED',
    answers: {},
  }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
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
      id: 'req-iban',
      kind: 'document',
      tag: 'iban',
      title: 'Comprovativo de IBAN',
      status: 'PENDING',
      documentId: null,
      textReply: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      answeredAt: null,
    },
  ]);

  const result = await serviceInquiriesService.getByAccessToken('token-valido');
  assert.equal(result.serviceName, 'IRS 2026');
  const byTag = Object.fromEntries(result.checklist.map((d) => [d.tag, d.received]));
  assert.equal(byTag.cc, true);
  assert.equal(byTag.iban, false);
  assert.equal(result.firmId, undefined);
});

test('recordDocumentDelivery: token inexistente devolve 404', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => null);

  await assert.rejects(
    () => serviceInquiriesService.recordDocumentDelivery({ token: 'x', tag: 'cc', file: {} }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('recordDocumentDelivery: pedido já encerrado (COMPLETED) rejeita com 409', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    status: 'COMPLETED',
  }));

  await assert.rejects(
    () => serviceInquiriesService.recordDocumentDelivery({ token: 'x', tag: 'cc', file: {} }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('recordDocumentDelivery: tag não reconhecida para o pedido rejeita com 400', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    serviceId: SERVICE.id,
    status: 'DOCS_REQUESTED',
    answers: {},
  }));
  mock.method(serviceInquiryRequestsRepository, 'findPendingDocumentByTag', async () => null);

  await assert.rejects(
    () => serviceInquiriesService.recordDocumentDelivery({ token: 'x', tag: 'tag-fantasma', file: { buffer: Buffer.from('x') } }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('recordDocumentDelivery: entrega parcial não avança o estado', async () => {
  resetMocks();
  mockNoise();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    serviceId: SERVICE.id,
    status: 'DOCS_REQUESTED',
    answers: {},
    leadId: 'lead-1',
    clientId: null,
  }));
  mock.method(serviceInquiryRequestsRepository, 'findPendingDocumentByTag', async () => ({
    id: 'req-cc',
    tag: 'cc',
    title: 'Cartão de Cidadão',
    status: 'PENDING',
  }));
  mock.method(contabilStorage, 'uploadServiceInquiryDocument', async () => ({ provider: 'supabase', path: 'p/1' }));
  mock.method(serviceInquiryDocumentsRepository, 'createRow', async () => ({ id: 'doc-1' }));
  mock.method(serviceInquiryRequestsRepository, 'markAnswered', async () => ({}));
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    { id: 'req-cc', kind: 'document', tag: 'cc', title: 'Cartão de Cidadão', status: 'ANSWERED', createdBy: null },
    { id: 'req-iban', kind: 'document', tag: 'iban', title: 'Comprovativo de IBAN', status: 'PENDING', createdBy: null },
  ]);
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  let updateCalled = false;
  mock.method(serviceInquiriesRepository, 'updateRow', async () => {
    updateCalled = true;
    return {};
  });
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));

  const result = await serviceInquiriesService.recordDocumentDelivery({
    token: 'x',
    tag: 'cc',
    file: { buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 10 },
  });

  assert.equal(result.allComplete, false);
  assert.equal(updateCalled, false);
});

test('recordDocumentDelivery: última entrega completa a checklist e avança DOCS_REQUESTED -> IN_PROGRESS', async () => {
  resetMocks();
  mockNoise();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    serviceId: SERVICE.id,
    status: 'DOCS_REQUESTED',
    answers: {},
    leadId: 'lead-1',
    clientId: null,
  }));
  mock.method(serviceInquiryRequestsRepository, 'findPendingDocumentByTag', async () => ({
    id: 'req-cc',
    tag: 'cc',
    title: 'Cartão de Cidadão',
    status: 'PENDING',
  }));
  mock.method(contabilStorage, 'uploadServiceInquiryDocument', async () => ({ provider: 'supabase', path: 'p/1' }));
  mock.method(serviceInquiryDocumentsRepository, 'createRow', async () => ({ id: 'doc-1' }));
  mock.method(serviceInquiryRequestsRepository, 'markAnswered', async () => ({}));
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    { id: 'req-cc', kind: 'document', tag: 'cc', title: 'Cartão de Cidadão', status: 'ANSWERED', createdBy: null },
  ]);
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  let updatedPatch = null;
  mock.method(serviceInquiriesRepository, 'updateRow', async (id, firmId, patch) => {
    updatedPatch = patch;
    return {};
  });
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));

  const result = await serviceInquiriesService.recordDocumentDelivery({
    token: 'x',
    tag: 'cc',
    file: { buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 10 },
  });

  assert.equal(result.allComplete, true);
  assert.equal(updatedPatch.status, 'IN_PROGRESS');
});

test('recordDocumentDelivery: audita a entrega mesmo numa entrega parcial (não só quando completa)', async () => {
  resetMocks();
  const auditCalls = [];
  mock.method(auditRepository, 'writeAuditLog', async (args) => {
    auditCalls.push(args.action);
  });
  mock.method(firmUsersRepository, 'findFirmOwnerEmail', async () => null);
  mock.method(contabilNotifications, 'notifyFirmIntakeDocumentReceived', async () => ({ ok: true }));
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    serviceId: SERVICE.id,
    status: 'DOCS_REQUESTED',
    answers: {},
    leadId: 'lead-1',
    clientId: null,
  }));
  mock.method(serviceInquiryRequestsRepository, 'findPendingDocumentByTag', async () => ({
    id: 'req-cc',
    tag: 'cc',
    title: 'Cartão de Cidadão',
    status: 'PENDING',
  }));
  mock.method(contabilStorage, 'uploadServiceInquiryDocument', async () => ({ provider: 'supabase', path: 'p/1' }));
  mock.method(serviceInquiryDocumentsRepository, 'createRow', async () => ({ id: 'doc-1' }));
  mock.method(serviceInquiryRequestsRepository, 'markAnswered', async () => ({}));
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    { id: 'req-cc', kind: 'document', tag: 'cc', title: 'Cartão de Cidadão', status: 'ANSWERED', createdBy: null },
    { id: 'req-iban', kind: 'document', tag: 'iban', title: 'Comprovativo de IBAN', status: 'PENDING', createdBy: null },
  ]);
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(serviceInquiriesRepository, 'updateRow', async () => ({}));
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));

  await serviceInquiriesService.recordDocumentDelivery({
    token: 'x',
    tag: 'cc',
    file: { buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 10 },
  });

  assert.ok(auditCalls.includes('service_inquiry.document_delivered'));
  assert.ok(
    !auditCalls.includes('service_inquiry.status_changed'),
    'entrega parcial não avança estado, não devia auditar transição',
  );
});

test('recordDocumentDelivery: entrega que completa a checklist audita entrega E transição de estado', async () => {
  resetMocks();
  const auditCalls = [];
  mock.method(auditRepository, 'writeAuditLog', async (args) => {
    auditCalls.push(args.action);
  });
  mock.method(firmUsersRepository, 'findFirmOwnerEmail', async () => null);
  mock.method(contabilNotifications, 'notifyFirmIntakeDocumentReceived', async () => ({ ok: true }));
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    serviceId: SERVICE.id,
    status: 'DOCS_REQUESTED',
    answers: {},
    leadId: 'lead-1',
    clientId: null,
  }));
  mock.method(serviceInquiryRequestsRepository, 'findPendingDocumentByTag', async () => ({
    id: 'req-cc',
    tag: 'cc',
    title: 'Cartão de Cidadão',
    status: 'PENDING',
  }));
  mock.method(contabilStorage, 'uploadServiceInquiryDocument', async () => ({ provider: 'supabase', path: 'p/1' }));
  mock.method(serviceInquiryDocumentsRepository, 'createRow', async () => ({ id: 'doc-1' }));
  mock.method(serviceInquiryRequestsRepository, 'markAnswered', async () => ({}));
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    { id: 'req-cc', kind: 'document', tag: 'cc', title: 'Cartão de Cidadão', status: 'ANSWERED', createdBy: null },
  ]);
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(serviceInquiriesRepository, 'updateRow', async () => ({}));
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));

  await serviceInquiriesService.recordDocumentDelivery({
    token: 'x',
    tag: 'cc',
    file: { buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 10 },
  });

  assert.deepEqual(auditCalls, ['service_inquiry.document_delivered', 'service_inquiry.status_changed']);
});

test('recordTextReply: token inexistente devolve 404', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => null);

  await assert.rejects(
    () => serviceInquiriesService.recordTextReply({ token: 'x', requestId: 'req-1', textReply: 'Sim' }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('recordTextReply: pedido já encerrado rejeita com 409', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    status: 'CANCELLED',
  }));

  await assert.rejects(
    () => serviceInquiriesService.recordTextReply({ token: 'x', requestId: 'req-1', textReply: 'Sim' }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('recordTextReply: requestId inexistente ou de kind errado rejeita com 400', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    status: 'IN_PROGRESS',
  }));
  mock.method(serviceInquiryRequestsRepository, 'findByIdForInquiry', async () => ({
    id: 'req-cc',
    kind: 'document',
    status: 'PENDING',
  }));

  await assert.rejects(
    () => serviceInquiriesService.recordTextReply({ token: 'x', requestId: 'req-cc', textReply: 'Sim' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('recordTextReply: já respondida (ANSWERED) rejeita com 400 — não deixa sobrescrever', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    status: 'IN_PROGRESS',
  }));
  mock.method(serviceInquiryRequestsRepository, 'findByIdForInquiry', async () => ({
    id: 'req-q1',
    kind: 'question',
    status: 'ANSWERED',
  }));

  await assert.rejects(
    () => serviceInquiriesService.recordTextReply({ token: 'x', requestId: 'req-q1', textReply: 'Outra resposta' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('recordTextReply: rejeita resposta vazia', async () => {
  resetMocks();
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    status: 'IN_PROGRESS',
  }));
  mock.method(serviceInquiryRequestsRepository, 'findByIdForInquiry', async () => ({
    id: 'req-q1',
    kind: 'question',
    status: 'PENDING',
  }));

  await assert.rejects(
    () => serviceInquiriesService.recordTextReply({ token: 'x', requestId: 'req-q1', textReply: '   ' }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('recordTextReply: marca ANSWERED, audita e notifica a equipa', async () => {
  resetMocks();
  const auditCalls = [];
  mock.method(auditRepository, 'writeAuditLog', async (args) => {
    auditCalls.push(args.action);
  });
  mock.method(firmUsersRepository, 'findFirmOwnerEmail', async () => 'staff@x.com');
  let notifyArgs = null;
  mock.method(contabilNotifications, 'notifyFirmIntakeReplyReceived', async (args) => {
    notifyArgs = args;
    return { ok: true };
  });
  mock.method(serviceInquiriesRepository, 'findByAccessToken', async () => ({
    id: 'inquiry-1',
    firmId: FIRM.id,
    serviceId: SERVICE.id,
    status: 'IN_PROGRESS',
    leadId: 'lead-1',
    clientId: null,
  }));
  mock.method(serviceInquiryRequestsRepository, 'findByIdForInquiry', async () => ({
    id: 'req-q1',
    kind: 'question',
    title: 'Tem dependentes a cargo?',
    status: 'PENDING',
  }));
  let markAnsweredArgs = null;
  mock.method(serviceInquiryRequestsRepository, 'markAnswered', async (id, firmId, patch) => {
    markAnsweredArgs = { id, firmId, patch };
    return {};
  });
  mock.method(serviceInquiryRequestsRepository, 'listByInquiry', async () => [
    { id: 'req-q1', kind: 'question', title: 'Tem dependentes a cargo?', status: 'ANSWERED', textReply: 'Sim, um.' },
  ]);
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(leadsRepository, 'findByIdForFirm', async () => ({ name: 'Ana' }));

  const result = await serviceInquiriesService.recordTextReply({
    token: 'x',
    requestId: 'req-q1',
    textReply: 'Sim, um.',
  });

  assert.equal(markAnsweredArgs.id, 'req-q1');
  assert.equal(markAnsweredArgs.patch.textReply, 'Sim, um.');
  assert.deepEqual(auditCalls, ['service_inquiry.request_answered']);
  assert.equal(result.checklist[0].textReply, 'Sim, um.');

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(notifyArgs.requestTitle, 'Tem dependentes a cargo?');
});

resetMocks();
