const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const bookingHoldsRepository = require('../../db/supabase/repositories/booking-holds.repository');
const googleCalendarAvailabilityService = require('../integrations/google-calendar/google-calendar-availability.service');
const bookingService = require('./booking.service');

const FIRM_ID = 'firm-x';
const FIRM = { id: FIRM_ID, settings: {} };
const SERVICE = {
  id: 'service-1',
  name: 'Consultoria',
  isActive: true,
  requiresBooking: true,
  durationMinutes: 60,
  priceCents: 5000,
  currency: 'EUR',
};
const HOLD_TOKEN = 'a'.repeat(64);

function resetMocks() {
  mock.restoreAll();
}

function mockHolds(active = []) {
  mock.method(bookingHoldsRepository, 'listActiveForFirm', async () => active);
  mock.method(bookingHoldsRepository, 'deleteExpired', async () => 0);
  mock.method(bookingHoldsRepository, 'findByToken', async () => null);
  mock.method(bookingHoldsRepository, 'createHold', async (row) => ({ id: 'hold-1', ...row }));
  mock.method(bookingHoldsRepository, 'deleteById', async () => {});
}

function mockAvailability() {
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(consultationsRepository, 'listConsultations', async () => []);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
  mockHolds();
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

test('bookAsClient: violação da exclusion constraint (23P01) vira 409 amigável, não 500', async () => {
  resetMocks();
  mockAvailability();
  mock.method(consultationsRepository, 'createConsultation', async () => {
    const err = new Error('conflicting key value violates exclusion constraint "consultations_no_overlap"');
    err.code = '23P01';
    throw err;
  });

  await assert.rejects(
    () =>
      bookingService.bookAsClient({
        firmId: FIRM_ID,
        clientId: 'client-1',
        serviceId: SERVICE.id,
        scheduledAt: nextWeekdayNoonUtc(),
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('bookAsClient: outro erro de banco (não 23P01) continua a propagar sem virar 409', async () => {
  resetMocks();
  mockAvailability();
  mock.method(consultationsRepository, 'createConsultation', async () => {
    const err = new Error('connection reset');
    err.code = '08006';
    throw err;
  });

  await assert.rejects(
    () =>
      bookingService.bookAsClient({
        firmId: FIRM_ID,
        clientId: 'client-1',
        serviceId: SERVICE.id,
        scheduledAt: nextWeekdayNoonUtc(),
      }),
    (err) => {
      assert.equal(err.code, '08006');
      assert.notEqual(err.statusCode, 409);
      return true;
    },
  );
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
  mockHolds();

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

test('listSlotsForBooking: override de schedule restringe horários (manhã) e fecha os outros dias', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({
    ...SERVICE,
    bookingOverrides: {
      weekdays: [1],
      schedule: { 1: [{ start: '09:00', end: '12:00' }] },
    },
  }));
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: FIRM_ID,
    settings: {
      booking: {
        timezone: 'UTC',
        slotMinutes: 60,
        leadTimeHours: 0,
        horizonDays: 14,
        weekdays: [1, 2, 3, 4, 5],
        schedule: {
          1: [{ start: '09:00', end: '17:00' }],
          2: [{ start: '09:00', end: '17:00' }],
          3: [{ start: '09:00', end: '17:00' }],
          4: [{ start: '09:00', end: '17:00' }],
          5: [{ start: '09:00', end: '17:00' }],
        },
      },
    },
  }));
  mock.method(consultationsRepository, 'listConsultations', async () => []);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
  mockHolds();

  const { slots, booking } = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: SERVICE.id,
    fromIso: '2026-08-24T00:00:00.000Z', // segunda
    toIso: '2026-08-28T23:59:59.000Z',
  });

  assert.deepEqual(booking.weekdays, [1]);
  assert.ok(slots.length > 0);
  for (const iso of slots) {
    const d = new Date(iso);
    assert.equal(d.getUTCDay(), 1);
    assert.ok(d.getUTCHours() < 12, `slot ${iso} devia ser de manhã`);
  }
});

test('listSlotsForBooking: dois serviços no mesmo escritório podem ter disponibilidades diferentes', async () => {
  resetMocks();
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: FIRM_ID,
    settings: {
      booking: {
        timezone: 'UTC',
        slotMinutes: 60,
        leadTimeHours: 0,
        horizonDays: 14,
        weekdays: [1, 2],
        schedule: {
          1: [{ start: '09:00', end: '17:00' }],
          2: [{ start: '09:00', end: '17:00' }],
        },
      },
    },
  }));
  mock.method(consultationsRepository, 'listConsultations', async () => []);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
  mockHolds();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async (id) => {
    if (id === 'svc-mon') {
      return { ...SERVICE, id, bookingOverrides: { weekdays: [1], schedule: { 1: [{ start: '09:00', end: '12:00' }] } } };
    }
    return { ...SERVICE, id, bookingOverrides: { weekdays: [2], schedule: { 2: [{ start: '14:00', end: '17:00' }] } } };
  });

  const fromIso = '2026-08-24T00:00:00.000Z';
  const toIso = '2026-08-25T23:59:59.000Z';
  const mon = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: 'svc-mon',
    fromIso,
    toIso,
  });
  const tue = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: 'svc-tue',
    fromIso,
    toIso,
  });

  assert.ok(mon.slots.every((iso) => new Date(iso).getUTCDay() === 1));
  assert.ok(tue.slots.every((iso) => new Date(iso).getUTCDay() === 2));
  assert.ok(mon.slots.length > 0);
  assert.ok(tue.slots.length > 0);
});

test('listSlotsForBooking: reserva de um serviço esconde o horário no outro (mesmo calendário/recurso)', async () => {
  resetMocks();
  const busyStart = Date.parse('2026-08-24T10:00:00.000Z');
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => ({
    ...SERVICE,
    id: 'svc-b',
    bookingOverrides: { weekdays: [1], schedule: { 1: [{ start: '09:00', end: '17:00' }] } },
  }));
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: FIRM_ID,
    settings: { booking: { timezone: 'UTC', slotMinutes: 60, leadTimeHours: 0, horizonDays: 14 } },
  }));
  mock.method(consultationsRepository, 'listConsultations', async () => [
    {
      status: 'SCHEDULED',
      scheduledAt: '2026-08-24T10:00:00.000Z',
      durationMinutes: 60,
      accountingServiceId: 'svc-a',
    },
  ]);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
  mockHolds();

  const { slots } = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: 'svc-b',
    fromIso: '2026-08-24T00:00:00.000Z',
    toIso: '2026-08-24T23:59:59.000Z',
  });

  const blocked = slots.some((iso) => Math.abs(new Date(iso).getTime() - busyStart) < 60 * 1000);
  assert.equal(blocked, false);
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

test('computeAvailableSlotsTz: duração 90 min com slotMinutes 30 só gera inícios que cabem no intervalo', () => {
  const booking = bookingService.normalizeBooking({
    slotMinutes: 30,
    leadTimeHours: 0,
    timezone: 'UTC',
    schedule: { 1: [{ start: '09:00', end: '11:00' }] },
  });
  const slots = bookingService.computeAvailableSlotsTz({
    fromMs: Date.parse('2026-08-10T00:00:00.000Z'),
    toMs: Date.parse('2026-08-10T23:59:59.000Z'),
    booking,
    durationMinutes: 90,
    busyRanges: [],
  });
  const minutes = slots.map((iso) => new Date(iso).getUTCHours() * 60 + new Date(iso).getUTCMinutes());
  assert.deepEqual(minutes, [9 * 60, 9 * 60 + 30]);
});

test('computeAvailableSlotsTz: slotMinutes 60 não gera meias horas', () => {
  const booking = bookingService.normalizeBooking({
    slotMinutes: 60,
    leadTimeHours: 0,
    timezone: 'UTC',
    schedule: { 1: [{ start: '09:00', end: '12:00' }] },
  });
  const slots = bookingService.computeAvailableSlotsTz({
    fromMs: Date.parse('2026-08-10T00:00:00.000Z'),
    toMs: Date.parse('2026-08-10T23:59:59.000Z'),
    booking,
    durationMinutes: 60,
    busyRanges: [],
  });
  const minutes = slots.map((iso) => new Date(iso).getUTCMinutes());
  assert.ok(minutes.every((m) => m === 0));
  assert.equal(slots.length, 3);
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
  mockHolds();

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

test('listSlotsForBooking: hold anónimo activo esconde o horário dos outros visitantes', async () => {
  resetMocks();
  const target = nextWeekdayNoonUtc();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(consultationsRepository, 'listConsultations', async () => []);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
  mockHolds([
    {
      id: 'hold-1',
      firmId: FIRM_ID,
      accountingServiceId: SERVICE.id,
      scheduledAt: target,
      durationMinutes: SERVICE.durationMinutes,
      holdToken: HOLD_TOKEN,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  ]);

  const { slots } = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: SERVICE.id,
    fromIso: new Date().toISOString(),
    toIso: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const hidden = slots.some((iso) => Math.abs(new Date(iso).getTime() - new Date(target).getTime()) < 60 * 1000);
  assert.equal(hidden, false);
});

test('listSlotsForBooking: ignoreHoldToken mostra o horário ao dono da reserva temporária', async () => {
  resetMocks();
  const target = nextWeekdayNoonUtc();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(consultationsRepository, 'listConsultations', async () => []);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
  mockHolds([
    {
      id: 'hold-1',
      firmId: FIRM_ID,
      accountingServiceId: SERVICE.id,
      scheduledAt: target,
      durationMinutes: SERVICE.durationMinutes,
      holdToken: HOLD_TOKEN,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  ]);

  const { slots } = await bookingService.listSlotsForBooking({
    firmId: FIRM_ID,
    serviceId: SERVICE.id,
    fromIso: new Date(new Date(target).getTime() - 120 * 1000).toISOString(),
    toIso: new Date(new Date(target).getTime() + 120 * 1000).toISOString(),
    ignoreHoldToken: HOLD_TOKEN,
  });

  const visible = slots.some((iso) => Math.abs(new Date(iso).getTime() - new Date(target).getTime()) <= 90 * 1000);
  assert.equal(visible, true);
});

test('createAnonymousHold: 409 quando o horário já não está livre', async () => {
  resetMocks();
  mockAvailability();
  const scheduledAt = nextWeekdayNoonUtc();
  mock.method(consultationsRepository, 'listConsultations', async () => [
    {
      status: 'SCHEDULED',
      scheduledAt,
      durationMinutes: 60,
    },
  ]);

  await assert.rejects(
    () =>
      bookingService.createAnonymousHold({
        firmId: FIRM_ID,
        serviceId: SERVICE.id,
        scheduledAt,
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('createAnonymousHold: reserva o slot e devolve token opaco', async () => {
  resetMocks();
  mockAvailability();
  let created = null;
  mock.method(bookingHoldsRepository, 'createHold', async (row) => {
    created = row;
    return { id: 'hold-1', ...row };
  });

  const scheduledAt = nextWeekdayNoonUtc();
  const result = await bookingService.createAnonymousHold({
    firmId: FIRM_ID,
    serviceId: SERVICE.id,
    scheduledAt,
  });

  assert.equal(typeof result.holdToken, 'string');
  assert.ok(result.holdToken.length >= 32);
  assert.equal(created.firmId, FIRM_ID);
  assert.equal(created.accountingServiceId, SERVICE.id);
  assert.equal(created.durationMinutes, 60);
});

test('assertAnonymousHold: token de outro escritório é 409 (isolamento)', async () => {
  resetMocks();
  mock.method(bookingHoldsRepository, 'findByToken', async () => ({
    id: 'hold-1',
    firmId: 'outra-firm',
    accountingServiceId: SERVICE.id,
    scheduledAt: nextWeekdayNoonUtc(),
    durationMinutes: 60,
    holdToken: HOLD_TOKEN,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }));

  await assert.rejects(
    () =>
      bookingService.assertAnonymousHold({
        firmId: FIRM_ID,
        serviceId: SERVICE.id,
        holdToken: HOLD_TOKEN,
        scheduledAt: nextWeekdayNoonUtc(),
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('assertAnonymousHold: hold expirado é 409 e apaga a linha', async () => {
  resetMocks();
  let deleted = false;
  mock.method(bookingHoldsRepository, 'findByToken', async () => ({
    id: 'hold-exp',
    firmId: FIRM_ID,
    accountingServiceId: SERVICE.id,
    scheduledAt: nextWeekdayNoonUtc(),
    durationMinutes: 60,
    holdToken: HOLD_TOKEN,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  }));
  mock.method(bookingHoldsRepository, 'deleteById', async (id, firmId) => {
    deleted = id === 'hold-exp' && firmId === FIRM_ID;
  });

  await assert.rejects(
    () =>
      bookingService.assertAnonymousHold({
        firmId: FIRM_ID,
        serviceId: SERVICE.id,
        holdToken: HOLD_TOKEN,
        scheduledAt: nextWeekdayNoonUtc(),
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
  assert.equal(deleted, true);
});

test('expireAnonymousHolds: delega no repositório', async () => {
  resetMocks();
  mock.method(bookingHoldsRepository, 'deleteExpired', async () => 3);
  assert.equal(await bookingService.expireAnonymousHolds(), 3);
});

test('bookAsClient: ignoreHoldToken permite confirmar o horário da própria reserva temporária', async () => {
  resetMocks();
  const scheduledAt = nextWeekdayNoonUtc();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(firmsRepository, 'findFirmById', async () => FIRM);
  mock.method(consultationsRepository, 'listConsultations', async () => []);
  mock.method(googleCalendarAvailabilityService, 'getBusyRangesForFirm', async () => []);
  mockHolds([
    {
      id: 'hold-1',
      firmId: FIRM_ID,
      accountingServiceId: SERVICE.id,
      scheduledAt,
      durationMinutes: SERVICE.durationMinutes,
      holdToken: HOLD_TOKEN,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  ]);
  let created = null;
  mock.method(consultationsRepository, 'createConsultation', async (args) => {
    created = args;
    return { id: 'consultation-hold', ...args };
  });

  await bookingService.bookAsClient({
    firmId: FIRM_ID,
    leadId: 'lead-1',
    serviceId: SERVICE.id,
    scheduledAt,
    ignoreHoldToken: HOLD_TOKEN,
  });

  assert.equal(created.leadId, 'lead-1');
  assert.equal(created.status, 'SCHEDULED');
});
