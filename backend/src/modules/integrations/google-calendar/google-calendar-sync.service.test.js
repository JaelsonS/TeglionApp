const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const consultationsRepository = require('../../../db/supabase/repositories/consultations.repository');
const googleCalendarService = require('./google-calendar.service');
const connectionsService = require('./google-calendar-connections.service');
const syncService = require('./google-calendar-sync.service');

const FIRM_ID = 'firm-x';
const CONNECTION = { id: 'conn-1', calendarId: 'primary', accessToken: 'access-abc', refreshToken: 'refresh-abc', tokenExpiresAt: new Date(Date.now() + 3600_000).toISOString() };

function resetMocks() {
  mock.restoreAll();
}

function mockValidToken() {
  mock.method(connectionsService, 'getValidAccessToken', async () => 'access-abc');
}

test('syncConsultationToGoogle: sem staffId, não sincroniza (Fase Hb)', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => {
    throw new Error('não devia sequer procurar ligação sem staffId');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: null, status: 'SCHEDULED' },
  });

  assert.deepEqual(result, { synced: false, reason: 'no_staff_assigned' });
});

test('syncConsultationToGoogle: staff sem ligação Google Calendar, não sincroniza', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => null);
  mock.method(googleCalendarService, 'createCalendarEvent', async () => {
    throw new Error('não devia chamar a API do Google sem ligação');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: 'staff-1', status: 'SCHEDULED' },
  });

  assert.deepEqual(result, { synced: false, reason: 'not_connected' });
});

test('syncConsultationToGoogle: CANCELLED sem googleEventId prévio, nada a apagar', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mockValidToken();
  mock.method(googleCalendarService, 'deleteCalendarEvent', async () => {
    throw new Error('não devia tentar apagar sem googleEventId');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: 'staff-1', status: 'CANCELLED', googleEventId: null },
  });

  assert.deepEqual(result, { synced: false, reason: 'nothing_to_cancel' });
});

test('syncConsultationToGoogle: CANCELLED com googleEventId, apaga o evento e limpa a coluna', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mockValidToken();
  let deleteArgs = null;
  mock.method(googleCalendarService, 'deleteCalendarEvent', async (args) => {
    deleteArgs = args;
  });
  let updateArgs = null;
  mock.method(consultationsRepository, 'updateConsultation', async (id, firmId, patch) => {
    updateArgs = { id, firmId, patch };
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: 'staff-1', status: 'CANCELLED', googleEventId: 'evt-1' },
  });

  assert.deepEqual(result, { synced: true, action: 'deleted' });
  assert.equal(deleteArgs.eventId, 'evt-1');
  assert.equal(deleteArgs.calendarId, 'primary');
  assert.deepEqual(updateArgs, { id: 'c1', firmId: FIRM_ID, patch: { googleEventId: null } });
});

test('syncConsultationToGoogle: activo sem googleEventId, cria o evento e grava o id devolvido', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mockValidToken();
  let createArgs = null;
  mock.method(googleCalendarService, 'createCalendarEvent', async (args) => {
    createArgs = args;
    return { id: 'evt-novo' };
  });
  let updateArgs = null;
  mock.method(consultationsRepository, 'updateConsultation', async (id, firmId, patch) => {
    updateArgs = { id, firmId, patch };
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: {
      id: 'c1',
      staffId: 'staff-1',
      status: 'SCHEDULED',
      googleEventId: null,
      title: 'Consultoria',
      scheduledAt: '2026-09-14T10:00:00.000Z',
      durationMinutes: 60,
    },
    requesterName: 'Ana Cliente',
  });

  assert.deepEqual(result, { synced: true, action: 'created' });
  assert.equal(createArgs.event.summary, 'Consultoria — Ana Cliente');
  assert.equal(createArgs.event.start.dateTime, '2026-09-14T10:00:00.000Z');
  assert.equal(createArgs.event.end.dateTime, '2026-09-14T11:00:00.000Z');
  assert.deepEqual(updateArgs, { id: 'c1', firmId: FIRM_ID, patch: { googleEventId: 'evt-novo' } });
});

test('syncConsultationToGoogle: activo com googleEventId existente, actualiza em vez de criar', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mockValidToken();
  let updateEventArgs = null;
  mock.method(googleCalendarService, 'updateCalendarEvent', async (args) => {
    updateEventArgs = args;
    return { id: 'evt-1' };
  });
  mock.method(googleCalendarService, 'createCalendarEvent', async () => {
    throw new Error('não devia criar quando já existe googleEventId');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: {
      id: 'c1',
      staffId: 'staff-1',
      status: 'SCHEDULED',
      googleEventId: 'evt-1',
      title: 'Consultoria',
      scheduledAt: '2026-09-14T10:00:00.000Z',
      durationMinutes: 60,
    },
  });

  assert.deepEqual(result, { synced: true, action: 'updated' });
  assert.equal(updateEventArgs.eventId, 'evt-1');
});
