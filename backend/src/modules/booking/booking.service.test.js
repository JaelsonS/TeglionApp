const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const bookingService = require('./booking.service');

const FIRM_ID = 'firm-x';
const FIRM = { id: FIRM_ID, settings: {} };
const SERVICE = {
  id: 'service-1',
  name: 'Consultoria',
  isActive: true,
  durationMinutes: 60,
  priceCents: 5000,
  currency: 'EUR',
};

function resetMocks() {
  mock.restoreAll();
}

function mockAvailability() {
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(consultationsRepository, 'listConsultations', async () => []);
}

/** Próximo dia útil ao meio-dia UTC — dentro da janela default (seg-sex 09-17 Lisboa), com
 * folga confortável face a leadTimeHours (2h) e horizonDays (14 dias) por construção. */
function nextWeekdayNoonUtc() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setUTCHours(12, 0, 0, 0);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString();
}

test('bookAsClient: rejeita quando nem clientId nem leadId são indicados', async () => {
  resetMocks();
  mockAvailability();
  await assert.rejects(
    () =>
      bookingService.bookAsClient({
        firmId: FIRM_ID,
        serviceId: SERVICE.id,
        scheduledAt: nextWeekdayNoonUtc(),
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('bookAsClient: rejeita quando clientId e leadId são ambos indicados', async () => {
  resetMocks();
  mockAvailability();
  await assert.rejects(
    () =>
      bookingService.bookAsClient({
        firmId: FIRM_ID,
        clientId: 'client-1',
        leadId: 'lead-1',
        serviceId: SERVICE.id,
        scheduledAt: nextWeekdayNoonUtc(),
      }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('bookAsClient: leadId sozinho -> cria consultation com lead_id, sem client_id (Fase 3a)', async () => {
  resetMocks();
  mockAvailability();
  let createArgs = null;
  mock.method(consultationsRepository, 'createConsultation', async (args) => {
    createArgs = args;
    return { id: 'consultation-1', ...args };
  });

  const { consultation } = await bookingService.bookAsClient({
    firmId: FIRM_ID,
    leadId: 'lead-1',
    serviceId: SERVICE.id,
    scheduledAt: nextWeekdayNoonUtc(),
  });

  assert.equal(createArgs.leadId, 'lead-1');
  assert.equal(createArgs.clientId, null);
  assert.equal(consultation.id, 'consultation-1');
});

test('bookAsClient: clientId sozinho continua a funcionar tal como antes', async () => {
  resetMocks();
  mockAvailability();
  let createArgs = null;
  mock.method(consultationsRepository, 'createConsultation', async (args) => {
    createArgs = args;
    return { id: 'consultation-2', ...args };
  });

  await bookingService.bookAsClient({
    firmId: FIRM_ID,
    clientId: 'client-1',
    serviceId: SERVICE.id,
    scheduledAt: nextWeekdayNoonUtc(),
  });

  assert.equal(createArgs.clientId, 'client-1');
  assert.equal(createArgs.leadId, null);
});
