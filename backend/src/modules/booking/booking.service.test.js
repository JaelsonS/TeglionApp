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

test('normalizeBooking: config antiga sem schedule gera schedule a partir de weekdays+dayStart/dayEnd', () => {
  const booking = bookingService.normalizeBooking({
    weekdays: [1, 3, 5],
    dayStart: '10:00',
    dayEnd: '14:00',
  });
  assert.deepEqual(booking.weekdays, [1, 3, 5]);
  assert.deepEqual(booking.schedule[1], [{ start: '10:00', end: '14:00' }]);
  assert.deepEqual(booking.schedule[3], [{ start: '10:00', end: '14:00' }]);
  assert.deepEqual(booking.schedule[5], [{ start: '10:00', end: '14:00' }]);
  assert.equal(booking.schedule[2], undefined);
});

test('normalizeBooking: schedule com múltiplos intervalos no mesmo dia', () => {
  const booking = bookingService.normalizeBooking({
    schedule: {
      1: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
    },
  });
  assert.deepEqual(booking.weekdays, [1]);
  assert.deepEqual(booking.schedule[1], [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '17:00' },
  ]);
  assert.equal(booking.dayStart, '09:00');
  assert.equal(booking.dayEnd, '17:00');
});

test('computeAvailableSlotsTz: gera slots em ambos os intervalos do dia', () => {
  const booking = bookingService.normalizeBooking({
    slotMinutes: 60,
    leadTimeHours: 0,
    horizonDays: 7,
    timezone: 'UTC',
    schedule: {
      // Usa um dia fixo: calculamos a partir de uma segunda-feira conhecida
      1: [
        { start: '09:00', end: '11:00' },
        { start: '15:00', end: '17:00' },
      ],
    },
  });
  // 2026-08-10 é segunda-feira
  const fromMs = Date.parse('2026-08-10T00:00:00.000Z');
  const toMs = Date.parse('2026-08-10T23:59:59.000Z');
  const slots = bookingService.computeAvailableSlotsTz({
    fromMs,
    toMs,
    booking,
    durationMinutes: 60,
    busyRanges: [],
  });
  const hours = slots.map((iso) => new Date(iso).getUTCHours());
  assert.ok(hours.includes(9), `esperava slot às 09h, got ${slots.join(',')}`);
  assert.ok(hours.includes(10), `esperava slot às 10h, got ${slots.join(',')}`);
  assert.ok(hours.includes(15), `esperava slot às 15h, got ${slots.join(',')}`);
  assert.ok(hours.includes(16), `esperava slot às 16h, got ${slots.join(',')}`);
  assert.equal(hours.includes(12), false);
  assert.equal(hours.includes(13), false);
});

test('computeAvailableSlotsTz: dateOverrides[] fecha o dia (prioridade sobre schedule)', () => {
  const booking = bookingService.normalizeBooking({
    slotMinutes: 60,
    leadTimeHours: 0,
    timezone: 'UTC',
    schedule: { 1: [{ start: '09:00', end: '17:00' }] },
    dateOverrides: { '2026-08-10': [] },
  });
  const slots = bookingService.computeAvailableSlotsTz({
    fromMs: Date.parse('2026-08-10T00:00:00.000Z'),
    toMs: Date.parse('2026-08-10T23:59:59.000Z'),
    booking,
    durationMinutes: 60,
    busyRanges: [],
  });
  assert.equal(slots.length, 0);
});

test('computeAvailableSlotsTz: dateOverrides com horário especial substitui o schedule do weekday', () => {
  const booking = bookingService.normalizeBooking({
    slotMinutes: 60,
    leadTimeHours: 0,
    timezone: 'UTC',
    schedule: { 1: [{ start: '09:00', end: '17:00' }] },
    dateOverrides: { '2026-08-10': [{ start: '10:00', end: '12:00' }] },
  });
  const slots = bookingService.computeAvailableSlotsTz({
    fromMs: Date.parse('2026-08-10T00:00:00.000Z'),
    toMs: Date.parse('2026-08-10T23:59:59.000Z'),
    booking,
    durationMinutes: 60,
    busyRanges: [],
  });
  const hours = slots.map((iso) => new Date(iso).getUTCHours());
  assert.deepEqual(hours, [10, 11]);
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
