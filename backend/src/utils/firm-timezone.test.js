const test = require('node:test');
const assert = require('node:assert/strict');

require('../test/ensure-test-env');
const { resolveFirmTimezone, todayInTimezone, addDaysToDateString, DEFAULT_FIRM_TIMEZONE } = require('./firm-timezone');

// Regressão do ROADMAP item 0.3: "hoje" nas obrigações/automações era sempre calculado em
// UTC (new Date().toISOString().slice(0, 10)), independente do escritório. Perto da virada
// do dia civil, isso diverge da data real do fuso do escritório — o suficiente pra marcar
// uma obrigação como atrasada com um dia de erro. Esse arquivo testa o utilitário que
// substitui esse cálculo.

test('resolveFirmTimezone: usa o fuso configurado em settings.booking.timezone quando é um valor permitido', () => {
  const firm = { settings: { booking: { timezone: 'Atlantic/Azores' } } };
  assert.equal(resolveFirmTimezone(firm), 'Atlantic/Azores');
});

test('resolveFirmTimezone: cai para Europe/Lisbon quando não há fuso configurado', () => {
  assert.equal(resolveFirmTimezone({ settings: {} }), DEFAULT_FIRM_TIMEZONE);
  assert.equal(resolveFirmTimezone(null), DEFAULT_FIRM_TIMEZONE);
  assert.equal(resolveFirmTimezone(undefined), DEFAULT_FIRM_TIMEZONE);
});

test('resolveFirmTimezone: cai para Europe/Lisbon quando o valor configurado não está na allow-list', () => {
  const firm = { settings: { booking: { timezone: 'America/Sao_Paulo' } } };
  assert.equal(resolveFirmTimezone(firm), DEFAULT_FIRM_TIMEZONE);
});

test('todayInTimezone: perto da virada do dia, UTC e Atlantic/Azores (UTC-1 fixo, sem DST) discordam do dia civil', () => {
  // 00:30 UTC de 1 de janeiro = 23:30 do dia 31 de dezembro em Azores (UTC-1 o ano inteiro).
  const reference = new Date('2026-01-01T00:30:00.000Z');
  assert.equal(reference.toISOString().slice(0, 10), '2026-01-01', 'sanity check do valor UTC bruto');
  assert.equal(todayInTimezone('UTC', reference), '2026-01-01');
  assert.equal(todayInTimezone('Atlantic/Azores', reference), '2025-12-31');
});

test('todayInTimezone: no horário de verão europeu, UTC e Europe/Lisbon (UTC+1) também discordam perto da meia-noite', () => {
  // 23:30 UTC de 15 de julho = 00:30 do dia 16 em Lisboa (WEST, UTC+1 no verão).
  const reference = new Date('2026-07-15T23:30:00.000Z');
  assert.equal(todayInTimezone('UTC', reference), '2026-07-15');
  assert.equal(todayInTimezone('Europe/Lisbon', reference), '2026-07-16');
});

test('addDaysToDateString: soma dias de calendário sem depender de fuso horário', () => {
  assert.equal(addDaysToDateString('2026-01-28', 7), '2026-02-04');
  assert.equal(addDaysToDateString('2026-12-30', 5), '2027-01-04');
});
