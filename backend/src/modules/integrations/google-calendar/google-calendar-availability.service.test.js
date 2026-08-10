const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const connectionsService = require('./google-calendar-connections.service');
const googleCalendarService = require('./google-calendar.service');
const ttlCache = require('../../../utils/cache/ttl-cache');
const availabilityService = require('./google-calendar-availability.service');

const FIRM_ID = 'firm-x';
const CONNECTION = { id: 'conn-1', calendarId: 'primary', accessToken: 'access-abc' };

function resetMocks() {
  mock.restoreAll();
  // O cache TTL é um Map em memória partilhado entre testes deste ficheiro (sem
  // Redis configurado localmente) — limpar entre testes evita que um teste
  // reaproveite a resposta em cache de outro (chaves diferentes por firmId+janela
  // já ajudam, mas o intervalo usado em vários testes aqui é literalmente o mesmo).
  ttlCache.clearMemory();
}

test('getBusyRangesForFirm: sem nenhuma conta ligada, devolve lista vazia', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'listByFirm', async () => []);

  const result = await availabilityService.getBusyRangesForFirm({ firmId: FIRM_ID, fromMs: 1000, toMs: 2000 });
  assert.deepEqual(result, []);
});

test('getBusyRangesForFirm: mapeia eventos com dateTime para intervalos em ms', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'listByFirm', async () => [CONNECTION]);
  mock.method(connectionsService, 'getValidAccessToken', async () => 'access-abc');
  mock.method(googleCalendarService, 'listCalendarEvents', async () => [
    {
      status: 'confirmed',
      start: { dateTime: '2026-09-14T10:00:00.000Z' },
      end: { dateTime: '2026-09-14T11:00:00.000Z' },
    },
  ]);

  const result = await availabilityService.getBusyRangesForFirm({
    firmId: FIRM_ID,
    fromMs: new Date('2026-09-14T00:00:00.000Z').getTime(),
    toMs: new Date('2026-09-15T00:00:00.000Z').getTime(),
  });

  assert.deepEqual(result, [
    { start: new Date('2026-09-14T10:00:00.000Z').getTime(), end: new Date('2026-09-14T11:00:00.000Z').getTime() },
  ]);
});

test('getBusyRangesForFirm: ignora eventos cancelados e marcados como "livre" (transparent)', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'listByFirm', async () => [CONNECTION]);
  mock.method(connectionsService, 'getValidAccessToken', async () => 'access-abc');
  mock.method(googleCalendarService, 'listCalendarEvents', async () => [
    { status: 'cancelled', start: { dateTime: '2026-09-14T10:00:00.000Z' }, end: { dateTime: '2026-09-14T11:00:00.000Z' } },
    {
      status: 'confirmed',
      transparency: 'transparent',
      start: { dateTime: '2026-09-14T12:00:00.000Z' },
      end: { dateTime: '2026-09-14T13:00:00.000Z' },
    },
  ]);

  const result = await availabilityService.getBusyRangesForFirm({
    firmId: FIRM_ID,
    fromMs: new Date('2026-09-14T00:00:00.000Z').getTime(),
    toMs: new Date('2026-09-15T00:00:00.000Z').getTime(),
  });

  assert.deepEqual(result, []);
});

test('getBusyRangesForFirm: eventos de dia inteiro (start.date/end.date) também contam', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'listByFirm', async () => [CONNECTION]);
  mock.method(connectionsService, 'getValidAccessToken', async () => 'access-abc');
  mock.method(googleCalendarService, 'listCalendarEvents', async () => [
    { status: 'confirmed', start: { date: '2026-09-14' }, end: { date: '2026-09-15' } },
  ]);

  const result = await availabilityService.getBusyRangesForFirm({
    firmId: FIRM_ID,
    fromMs: new Date('2026-09-14T00:00:00.000Z').getTime(),
    toMs: new Date('2026-09-16T00:00:00.000Z').getTime(),
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].start, new Date('2026-09-14').getTime());
});

test('getBusyRangesForFirm: uma ligação a falhar não derruba as outras (falha aberta por ligação)', async () => {
  resetMocks();
  const OTHER_CONNECTION = { id: 'conn-2', calendarId: 'primary', accessToken: 'access-def' };
  mock.method(googleCalendarConnectionsRepository, 'listByFirm', async () => [CONNECTION, OTHER_CONNECTION]);
  mock.method(connectionsService, 'getValidAccessToken', async (conn) => {
    if (conn.id === 'conn-1') throw new Error('token expirado e refresh falhou');
    return 'access-def';
  });
  mock.method(googleCalendarService, 'listCalendarEvents', async () => [
    { status: 'confirmed', start: { dateTime: '2026-09-14T10:00:00.000Z' }, end: { dateTime: '2026-09-14T11:00:00.000Z' } },
  ]);

  const result = await availabilityService.getBusyRangesForFirm({
    firmId: FIRM_ID,
    fromMs: new Date('2026-09-14T00:00:00.000Z').getTime(),
    toMs: new Date('2026-09-15T00:00:00.000Z').getTime(),
  });

  assert.equal(result.length, 1);
});

test('getBusyRangesForFirm: falha ao listar ligações não lança, devolve lista vazia (falha aberta)', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'listByFirm', async () => {
    throw new Error('Supabase indisponível');
  });

  const result = await availabilityService.getBusyRangesForFirm({ firmId: FIRM_ID, fromMs: 1000, toMs: 2000 });
  assert.deepEqual(result, []);
});
