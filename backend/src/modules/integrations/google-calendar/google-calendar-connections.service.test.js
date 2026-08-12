const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const firmsRepository = require('../../../db/supabase/repositories/firms.repository');
const googleSsoService = require('../../auth/google/google-sso.service');
const googleCalendarService = require('./google-calendar.service');
const connectionsService = require('./google-calendar-connections.service');

const FIRM_ID = 'firm-x';
const STAFF_ID = '11111111-1111-4111-8111-111111111111';

function resetMocks() {
  mock.restoreAll();
}

function mockFirmBooking(staffUserId = null) {
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: FIRM_ID,
    settings: { booking: { googleCalendarStaffUserId: staffUserId } },
  }));
  mock.method(firmsRepository, 'mergeSettingsKey', async () => ({ id: FIRM_ID }));
}

test('completeConnection: rejeita quando o Google não devolve refresh_token', async () => {
  resetMocks();
  mock.method(googleCalendarService, 'exchangeCalendarCode', async () => ({
    access_token: 'access-abc',
    expires_in: 3600,
  }));
  mock.method(googleCalendarConnectionsRepository, 'upsertConnection', async () => {
    throw new Error('não devia chegar a gravar sem refresh_token');
  });

  await assert.rejects(() =>
    connectionsService.completeConnection({ firmId: FIRM_ID, staffUserId: STAFF_ID, code: 'code-1' }),
  );
});

test('completeConnection: com refresh_token, grava a ligação e define public sync se vazio', async () => {
  resetMocks();
  mockFirmBooking(null);
  mock.method(googleCalendarService, 'exchangeCalendarCode', async () => ({
    access_token: 'access-abc',
    refresh_token: 'refresh-abc',
    expires_in: 3600,
  }));
  mock.method(googleSsoService, 'fetchGoogleUserInfo', async (accessToken) => {
    assert.equal(accessToken, 'access-abc');
    return { email: 'contabilista@gmail.com', email_verified: true };
  });
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => null);
  let upsertArgs = null;
  mock.method(googleCalendarConnectionsRepository, 'upsertConnection', async (args) => {
    upsertArgs = args;
    return { id: 'conn-1', ...args };
  });
  let merged = null;
  mock.method(firmsRepository, 'mergeSettingsKey', async (firmId, key, value) => {
    merged = { firmId, key, value };
    return { id: firmId };
  });

  const result = await connectionsService.completeConnection({
    firmId: FIRM_ID,
    staffUserId: STAFF_ID,
    code: 'code-1',
  });

  assert.equal(result.googleEmail, 'contabilista@gmail.com');
  assert.equal(upsertArgs.authStatus, 'ok');
  assert.equal(upsertArgs.calendarId, 'primary');
  assert.equal(merged.key, 'booking');
  assert.equal(merged.value.googleCalendarStaffUserId, STAFF_ID);
});

test('getStatus: connected=false quando não há ligação', async () => {
  resetMocks();
  mockFirmBooking(null);
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => null);

  const result = await connectionsService.getStatus({ firmId: FIRM_ID, staffUserId: STAFF_ID });
  assert.equal(result.connected, false);
  assert.equal(result.authStatus, null);
  assert.equal(result.publicSyncEnabled, false);
});

test('getStatus: needs_reconnect reflectido no status', async () => {
  resetMocks();
  mockFirmBooking(STAFF_ID);
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => ({
    id: 'conn-1',
    googleEmail: 'contabilista@gmail.com',
    authStatus: 'needs_reconnect',
    calendarId: 'primary',
    calendarSummary: 'Principal',
    lastAuthError: 'invalid_grant',
  }));

  const result = await connectionsService.getStatus({ firmId: FIRM_ID, staffUserId: STAFF_ID });
  assert.equal(result.connected, true);
  assert.equal(result.authStatus, 'needs_reconnect');
  assert.equal(result.publicSyncEnabled, true);
});

test('disconnect: com ligação existente, revoga o token e apaga a linha', async () => {
  resetMocks();
  mockFirmBooking(STAFF_ID);
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => ({
    id: 'conn-1',
    refreshToken: 'refresh-abc',
  }));
  let revokedToken = null;
  mock.method(googleCalendarService, 'revokeGoogleToken', async (token) => {
    revokedToken = token;
  });
  let deleteArgs = null;
  mock.method(googleCalendarConnectionsRepository, 'deleteConnection', async (firmId, staffUserId) => {
    deleteArgs = { firmId, staffUserId };
  });
  let cleared = false;
  mock.method(firmsRepository, 'mergeSettingsKey', async (_firmId, _key, value) => {
    cleared = value.googleCalendarStaffUserId === null;
    return { id: FIRM_ID };
  });

  const result = await connectionsService.disconnect({ firmId: FIRM_ID, staffUserId: STAFF_ID });

  assert.deepEqual(result, { disconnected: true });
  assert.equal(revokedToken, 'refresh-abc');
  assert.deepEqual(deleteArgs, { firmId: FIRM_ID, staffUserId: STAFF_ID });
  assert.equal(cleared, true);
});

test('getValidAccessToken: token ainda válido, devolve sem chamar o Google', async () => {
  resetMocks();
  mock.method(googleCalendarService, 'refreshAccessToken', async () => {
    throw new Error('não devia renovar um token ainda válido');
  });

  const token = await connectionsService.getValidAccessToken({
    id: 'conn-1',
    accessToken: 'access-still-valid',
    refreshToken: 'refresh-abc',
    tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  assert.equal(token, 'access-still-valid');
});

test('getValidAccessToken: token expirado, renova e grava', async () => {
  resetMocks();
  mock.method(googleCalendarService, 'refreshAccessToken', async (refreshToken) => {
    assert.equal(refreshToken, 'refresh-abc');
    return { access_token: 'access-novo', expires_in: 3600 };
  });
  let updateArgs = null;
  mock.method(googleCalendarConnectionsRepository, 'updateAccessToken', async (id, patch) => {
    updateArgs = { id, patch };
  });

  const token = await connectionsService.getValidAccessToken({
    id: 'conn-1',
    accessToken: 'access-velho',
    refreshToken: 'refresh-abc',
    tokenExpiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
  });

  assert.equal(token, 'access-novo');
  assert.equal(updateArgs.id, 'conn-1');
  assert.equal(updateArgs.patch.accessToken, 'access-novo');
});

test('getValidAccessToken: invalid_grant marca needs_reconnect', async () => {
  resetMocks();
  mock.method(googleCalendarService, 'refreshAccessToken', async () => {
    throw new Error('Google Calendar token refresh failed: {"error":"invalid_grant"}');
  });
  let marked = null;
  mock.method(googleCalendarConnectionsRepository, 'markNeedsReconnect', async (id, message) => {
    marked = { id, message };
  });

  await assert.rejects(() =>
    connectionsService.getValidAccessToken({
      id: 'conn-1',
      accessToken: 'access-velho',
      refreshToken: 'refresh-morto',
      tokenExpiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
    }),
  );

  assert.equal(marked.id, 'conn-1');
  assert.ok(/invalid_grant/i.test(marked.message));
});

test('isInvalidGrantError: detecta invalid_grant e 401', () => {
  assert.equal(connectionsService.isInvalidGrantError(new Error('invalid_grant')), true);
  assert.equal(connectionsService.isInvalidGrantError(Object.assign(new Error('x'), { status: 401 })), true);
  assert.equal(connectionsService.isInvalidGrantError(new Error('rate limit')), false);
});
