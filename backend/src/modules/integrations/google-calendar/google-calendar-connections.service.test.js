const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const googleCalendarConnectionsRepository = require('../../../db/supabase/repositories/google-calendar-connections.repository');
const googleSsoService = require('../../auth/google/google-sso.service');
const googleCalendarService = require('./google-calendar.service');
const connectionsService = require('./google-calendar-connections.service');

const FIRM_ID = 'firm-x';
const STAFF_ID = 'staff-1';

function resetMocks() {
  mock.restoreAll();
}

test('completeConnection: rejeita quando o Google não devolve refresh_token', async () => {
  resetMocks();
  mock.method(googleCalendarService, 'exchangeCalendarCode', async () => ({
    access_token: 'access-abc',
    expires_in: 3600,
    // sem refresh_token — acontece quando a conta já autorizou antes
  }));
  mock.method(googleCalendarConnectionsRepository, 'upsertConnection', async () => {
    throw new Error('não devia chegar a gravar sem refresh_token');
  });

  await assert.rejects(() =>
    connectionsService.completeConnection({ firmId: FIRM_ID, staffUserId: STAFF_ID, code: 'code-1' }),
  );
});

test('completeConnection: com refresh_token, grava a ligação e devolve o email', async () => {
  resetMocks();
  mock.method(googleCalendarService, 'exchangeCalendarCode', async () => ({
    access_token: 'access-abc',
    refresh_token: 'refresh-abc',
    expires_in: 3600,
  }));
  mock.method(googleSsoService, 'fetchGoogleUserInfo', async (accessToken) => {
    assert.equal(accessToken, 'access-abc');
    return { email: 'contabilista@gmail.com', email_verified: true };
  });
  let upsertArgs = null;
  mock.method(googleCalendarConnectionsRepository, 'upsertConnection', async (args) => {
    upsertArgs = args;
    return { id: 'conn-1', ...args };
  });

  const result = await connectionsService.completeConnection({ firmId: FIRM_ID, staffUserId: STAFF_ID, code: 'code-1' });

  assert.equal(result.googleEmail, 'contabilista@gmail.com');
  assert.equal(upsertArgs.firmId, FIRM_ID);
  assert.equal(upsertArgs.staffUserId, STAFF_ID);
  assert.equal(upsertArgs.accessToken, 'access-abc');
  assert.equal(upsertArgs.refreshToken, 'refresh-abc');
  assert.equal(upsertArgs.calendarId, 'primary');
  assert.ok(new Date(upsertArgs.tokenExpiresAt).getTime() > Date.now());
});

test('getStatus: connected=false quando não há ligação', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => null);

  const result = await connectionsService.getStatus({ firmId: FIRM_ID, staffUserId: STAFF_ID });
  assert.deepEqual(result, { connected: false, googleEmail: null });
});

test('getStatus: connected=true com o email quando há ligação', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => ({
    id: 'conn-1',
    googleEmail: 'contabilista@gmail.com',
  }));

  const result = await connectionsService.getStatus({ firmId: FIRM_ID, staffUserId: STAFF_ID });
  assert.deepEqual(result, { connected: true, googleEmail: 'contabilista@gmail.com' });
});

test('disconnect: sem ligação existente, não faz nada', async () => {
  resetMocks();
  mock.method(googleCalendarConnectionsRepository, 'findByStaffUser', async () => null);
  mock.method(googleCalendarService, 'revokeGoogleToken', async () => {
    throw new Error('não devia tentar revogar sem ligação');
  });

  const result = await connectionsService.disconnect({ firmId: FIRM_ID, staffUserId: STAFF_ID });
  assert.deepEqual(result, { disconnected: false });
});

test('disconnect: com ligação existente, revoga o token e apaga a linha', async () => {
  resetMocks();
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

  const result = await connectionsService.disconnect({ firmId: FIRM_ID, staffUserId: STAFF_ID });

  assert.deepEqual(result, { disconnected: true });
  assert.equal(revokedToken, 'refresh-abc');
  assert.deepEqual(deleteArgs, { firmId: FIRM_ID, staffUserId: STAFF_ID });
});
