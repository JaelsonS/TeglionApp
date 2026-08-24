const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const googleCalendarSyncService = require('../integrations/google-calendar/google-calendar-sync.service');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const consultationsService = require('./consultations.service');

const FIRM_ID = 'firm-x';

function resetMocks() {
  mock.restoreAll();
}

function mockFirmTimezone(tz = 'Europe/Lisbon') {
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: FIRM_ID,
    settings: { booking: { timezone: tz } },
  }));
}

test('listConsultations: resolve holderName a partir do Client quando clientId presente', async () => {
  resetMocks();
  mock.method(consultationsRepository, 'listConsultations', async () => [
    { id: 'c1', clientId: 'client-1', leadId: null, title: 'Consulta' },
  ]);
  mock.method(clientsRepository, 'findClientById', async (firmId, clientId) => {
    assert.equal(firmId, FIRM_ID);
    assert.equal(clientId, 'client-1');
    return { displayName: 'Ana Cliente' };
  });
  mock.method(leadsRepository, 'findByIdForFirm', async () => {
    throw new Error('não devia chamar leads quando é um Client');
  });

  const items = await consultationsService.listConsultations({ firmId: FIRM_ID });
  assert.equal(items[0].holderName, 'Ana Cliente');
});

test('listConsultations: resolve holderName a partir do Lead quando leadId presente (Fase 3a)', async () => {
  resetMocks();
  mock.method(consultationsRepository, 'listConsultations', async () => [
    { id: 'c2', clientId: null, leadId: 'lead-1', title: 'Consulta' },
  ]);
  mock.method(leadsRepository, 'findByIdForFirm', async (leadId, firmId) => {
    assert.equal(leadId, 'lead-1');
    assert.equal(firmId, FIRM_ID);
    return { name: 'Bruno Lead' };
  });
  mock.method(clientsRepository, 'findClientById', async () => {
    throw new Error('não devia chamar clients quando é um Lead');
  });

  const items = await consultationsService.listConsultations({ firmId: FIRM_ID });
  assert.equal(items[0].holderName, 'Bruno Lead');
});

test('createConsultation: dispara sync para o Google Calendar (fire-and-forget, Fase Hb)', async () => {
  resetMocks();
  mockFirmTimezone('Europe/Lisbon');
  mock.method(clientsRepository, 'findClientById', async () => ({ id: 'client-1', displayName: 'Ana Cliente' }));
  mock.method(consultationsRepository, 'findRecentDuplicateConsultation', async () => null);
  mock.method(consultationsRepository, 'createConsultation', async (args) => ({ id: 'c1', ...args }));
  let syncArgs = null;
  mock.method(googleCalendarSyncService, 'syncConsultationToGoogle', async (args) => {
    syncArgs = args;
    return { synced: false };
  });

  await consultationsService.createConsultation({
    firmId: FIRM_ID,
    clientId: 'client-1',
    staffId: 'staff-1',
    title: 'Consulta',
    scheduledAt: '2026-09-14T10:00:00.000Z',
  });

  assert.equal(syncArgs.firmId, FIRM_ID);
  assert.equal(syncArgs.consultation.id, 'c1');
  assert.equal(syncArgs.requesterName, 'Ana Cliente');
  assert.equal(syncArgs.timeZone, 'Europe/Lisbon');
});

test('createConsultation: com accountingServiceId usa a duração do serviço da firma e ignora o body', async () => {
  resetMocks();
  mockFirmTimezone();
  mock.method(clientsRepository, 'findClientById', async () => ({ id: 'client-1', displayName: 'Ana Cliente' }));
  mock.method(consultationsRepository, 'findRecentDuplicateConsultation', async () => null);
  mock.method(accountingServicesRepository, 'findByIdForFirm', async (id, firmId) => {
    assert.equal(id, 'service-90');
    assert.equal(firmId, FIRM_ID);
    return { id: 'service-90', durationMinutes: 90, name: 'Consultoria' };
  });
  let createArgs = null;
  mock.method(consultationsRepository, 'createConsultation', async (args) => {
    createArgs = args;
    return { id: 'c-dur', ...args };
  });
  mock.method(googleCalendarSyncService, 'syncConsultationToGoogle', async () => ({ synced: false }));

  await consultationsService.createConsultation({
    firmId: FIRM_ID,
    clientId: 'client-1',
    staffId: 'staff-1',
    title: 'Consultoria',
    scheduledAt: '2026-09-14T10:00:00.000Z',
    durationMinutes: 15,
    accountingServiceId: 'service-90',
  });

  assert.equal(createArgs.durationMinutes, 90);
  assert.equal(createArgs.accountingServiceId, 'service-90');
});

test('createConsultation: accountingServiceId de outro tenant é 404 e não grava', async () => {
  resetMocks();
  mockFirmTimezone();
  mock.method(clientsRepository, 'findClientById', async () => ({ id: 'client-1', displayName: 'Ana Cliente' }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => null);
  mock.method(consultationsRepository, 'createConsultation', async () => {
    throw new Error('não devia gravar reunião com serviço de outro escritório');
  });
  mock.method(googleCalendarSyncService, 'syncConsultationToGoogle', async () => ({ synced: false }));

  await assert.rejects(
    () =>
      consultationsService.createConsultation({
        firmId: FIRM_ID,
        clientId: 'client-1',
        staffId: 'staff-1',
        title: 'Consultoria',
        scheduledAt: '2026-09-14T10:00:00.000Z',
        durationMinutes: 60,
        accountingServiceId: 'service-other-firm',
      }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('createConsultation: violação da exclusion constraint (23P01) vira 409', async () => {
  resetMocks();
  mockFirmTimezone();
  mock.method(clientsRepository, 'findClientById', async () => ({ id: 'client-1', displayName: 'Ana Cliente' }));
  mock.method(consultationsRepository, 'findRecentDuplicateConsultation', async () => null);
  mock.method(consultationsRepository, 'createConsultation', async () => {
    const err = new Error('conflicting key value violates exclusion constraint "consultations_no_overlap"');
    err.code = '23P01';
    throw err;
  });
  mock.method(googleCalendarSyncService, 'syncConsultationToGoogle', async () => {
    throw new Error('não devia sincronizar depois de overlap');
  });

  await assert.rejects(
    () =>
      consultationsService.createConsultation({
        firmId: FIRM_ID,
        clientId: 'client-1',
        staffId: 'staff-1',
        title: 'Consulta',
        scheduledAt: '2026-09-14T10:00:00.000Z',
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('updateConsultation: dispara sync para o Google Calendar com o holderName resolvido (Fase Hb)', async () => {
  resetMocks();
  mockFirmTimezone('Europe/Lisbon');
  mock.method(consultationsRepository, 'findByIdForFirm', async () => ({
    id: 'c1',
    clientId: 'client-1',
    leadId: null,
    status: 'SCHEDULED',
  }));
  mock.method(consultationsRepository, 'updateConsultation', async () => ({
    id: 'c1',
    clientId: 'client-1',
    leadId: null,
    status: 'CANCELLED',
  }));
  mock.method(clientsRepository, 'findClientById', async () => ({ displayName: 'Ana Cliente' }));
  let syncArgs = null;
  mock.method(googleCalendarSyncService, 'syncConsultationToGoogle', async (args) => {
    syncArgs = args;
  });

  await consultationsService.updateConsultation({ firmId: FIRM_ID, id: 'c1', patch: { status: 'CANCELLED' } });

  assert.equal(syncArgs.consultation.id, 'c1');
  assert.equal(syncArgs.requesterName, 'Ana Cliente');
  assert.equal(syncArgs.timeZone, 'Europe/Lisbon');
});
