const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const googleCalendarAvailabilityService = require('../integrations/google-calendar/google-calendar-availability.service');
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
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
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

test('listSlotsForBooking: bookingOverrides do Service restringe os dias, sem afectar as regras do escritório (Fase 3b)', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({
    ...SERVICE,
    bookingOverrides: { weekdays: [2] }, // só terça-feira
  }));
  mock.method(firmsRepository, 'findFirmById', async () => FIRM); // escritório: seg-sex (default)
  mock.method(consultationsRepository, 'listConsultations', async () => []);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);

  const now = new Date();
  const from = now.toISOString();
  const to = new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString();

  const { slots, booking } = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: SERVICE.id,
    fromIso: from,
    toIso: to,
  });

  assert.deepEqual(booking.weekdays, [2]);
  assert.ok(slots.length > 0, 'devia haver pelo menos um slot de terça-feira na janela de 13 dias');
  for (const iso of slots) {
    assert.equal(new Date(iso).getUTCDay(), 2, `slot ${iso} devia cair numa terça-feira`);
  }
});

test('listSlotsForBooking: sem bookingOverrides, usa as regras do escritório tal como antes (sem regressão)', async () => {
  resetMocks();
  mockAvailability(); // SERVICE sem bookingOverrides

  const now = new Date();
  const from = now.toISOString();
  const to = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();

  const { booking } = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: SERVICE.id,
    fromIso: from,
    toIso: to,
  });

  assert.deepEqual(booking.weekdays, [1, 2, 3, 4, 5]);
});

test('listSlotsForBooking: horário ocupado no Google Calendar ligado não aparece como slot livre (Fase Hc)', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(consultationsRepository, 'listConsultations', async () => []);

  const target = nextWeekdayNoonUtc();
  const targetMs = new Date(target).getTime();
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => [
    { start: targetMs, end: targetMs + SERVICE.durationMinutes * 60 * 1000 },
  ]);

  const now = new Date();
  const from = now.toISOString();
  const to = new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString();

  const { slots } = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: SERVICE.id,
    fromIso: from,
    toIso: to,
  });

  const blocked = slots.some((iso) => Math.abs(new Date(iso).getTime() - targetMs) < 60 * 1000);
  assert.equal(blocked, false, 'o slot coberto pelo evento do Google não devia aparecer como livre');
});
