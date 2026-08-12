const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const consultationsRepository = require('../../../db/supabase/repositories/consultations.repository');
const googleCalendarService = require('./google-calendar.service');
const connectionsService = require('./google-calendar-connections.service');
const syncService = require('./google-calendar-sync.service');

const FIRM_ID = 'firm-x';
const CONNECTION = {
  id: 'conn-1',
  calendarId: 'primary',
  authStatus: 'ok',
  accessToken: 'access-abc',
  refreshToken: 'refresh-abc',
  tokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
};

function resetMocks() {
  mock.restoreAll();
}

function mockValidToken() {
  mock.method(connectionsService, 'getValidAccessToken', async () => 'access-abc');
}

test('syncConsultationToGoogle: sem staffId, skipped', async () => {
  resetMocks();
  let syncPatch = null;
  mock.method(consultationsRepository, 'updateConsultation', async (_id, _firmId, patch) => {
    syncPatch = patch;
  });
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => {
    throw new Error('não devia sequer procurar ligação sem staffId');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: null, status: 'SCHEDULED' },
  });

  assert.deepEqual(result, { synced: false, reason: 'no_staff_assigned' });
  assert.equal(syncPatch.googleSyncStatus, 'skipped');
});

test('syncConsultationToGoogle: staff sem ligação, skipped', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => null);
  mock.method(consultationsRepository, 'updateConsultation', async () => null);
  mock.method(googleCalendarService, 'createCalendarEvent', async () => {
    throw new Error('não devia chamar a API do Google sem ligação');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: 'staff-1', status: 'SCHEDULED' },
  });

  assert.deepEqual(result, { synced: false, reason: 'not_connected' });
});

test('syncConsultationToGoogle: needs_reconnect na connection, não chama Google', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => ({
    ...CONNECTION,
    authStatus: 'needs_reconnect',
  }));
  mock.method(consultationsRepository, 'updateConsultation', async () => null);
  mock.method(connectionsService, 'getValidAccessToken', async () => {
    throw new Error('não devia renovar token com needs_reconnect');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: 'staff-1', status: 'SCHEDULED' },
  });

  assert.deepEqual(result, { synced: false, reason: 'needs_reconnect' });
});

test('syncConsultationToGoogle: CANCELLED sem googleEventId, nothing_to_cancel', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mockValidToken();
  mock.method(consultationsRepository, 'updateConsultation', async () => null);
  mock.method(googleCalendarService, 'deleteCalendarEvent', async () => {
    throw new Error('não devia tentar apagar sem googleEventId');
  });

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: { id: 'c1', staffId: 'staff-1', status: 'CANCELLED', googleEventId: null },
  });

  assert.deepEqual(result, { synced: false, reason: 'nothing_to_cancel' });
});

test('syncConsultationToGoogle: CANCELLED com googleEventId, apaga o evento', async () => {
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
  assert.equal(updateArgs.patch.googleEventId, null);
  assert.equal(updateArgs.patch.googleSyncStatus, 'synced');
});

test('syncConsultationToGoogle: cria evento com timezone e iCalUID; não duplica se já existir', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mockValidToken();
  mock.method(googleCalendarService, 'findEventByICalUID', async () => null);
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
    timeZone: 'Europe/Lisbon',
  });

  assert.deepEqual(result, { synced: true, action: 'created' });
  assert.equal(createArgs.event.summary, 'Consultoria — Ana Cliente');
  assert.equal(createArgs.event.start.timeZone, 'Europe/Lisbon');
  assert.equal(createArgs.event.iCalUID, 'teglion-consultation-c1@teglion.com');
  assert.equal(updateArgs.patch.googleEventId, 'evt-novo');
  assert.equal(updateArgs.patch.googleSyncStatus, 'synced');
});

test('syncConsultationToGoogle: se iCalUID já existe, recupera sem criar duplicado', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mockValidToken();
  mock.method(googleCalendarService, 'findEventByICalUID', async () => ({ id: 'evt-existente' }));
  mock.method(googleCalendarService, 'updateCalendarEvent', async () => ({ id: 'evt-existente' }));
  mock.method(googleCalendarService, 'createCalendarEvent', async () => {
    throw new Error('não devia criar quando iCalUID já existe');
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
  });

  assert.deepEqual(result, { synced: true, action: 'recovered' });
  assert.equal(updateArgs.patch.googleEventId, 'evt-existente');
});

test('syncConsultationToGoogle: com googleEventId, actualiza', async () => {
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
  mock.method(consultationsRepository, 'updateConsultation', async () => null);

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

test('syncConsultationToGoogle: invalid_grant → needs_reconnect sem lançar para o caller', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => CONNECTION);
  mock.method(connectionsService, 'getValidAccessToken', async () => {
    const err = new Error('Google Calendar token refresh failed: invalid_grant');
    throw err;
  });
  let marked = null;
  mock.method(googleCalendarConnectionsRepository, 'markNeedsReconnect', async (id, message) => {
    marked = { id, message };
  });
  mock.method(consultationsRepository, 'updateConsultation', async () => null);

  const result = await syncService.syncConsultationToGoogle({
    firmId: FIRM_ID,
    consultation: {
      id: 'c1',
      staffId: 'staff-1',
      status: 'SCHEDULED',
      googleEventId: null,
      title: 'X',
      scheduledAt: '2026-09-14T10:00:00.000Z',
      durationMinutes: 30,
    },
  });

  assert.equal(result.reason, 'needs_reconnect');
  assert.equal(marked.id, 'conn-1');
});
