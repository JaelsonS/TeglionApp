const test = require('node:test');
const assert = require('node:assert/strict');

const { overdueSyncKey, operationalDashboardKey, liveBadgeKey } = require('./tenant-scoped-keys');

test('cache keys include firmId and do not collide across tenants', () => {
  assert.notEqual(overdueSyncKey('firm-a'), overdueSyncKey('firm-b'));
  assert.notEqual(operationalDashboardKey('firm-a'), operationalDashboardKey('firm-b'));
  assert.notEqual(
    liveBadgeKey({ scope: 'firm', firmId: 'firm-a', actorId: 'user-1' }),
    liveBadgeKey({ scope: 'firm', firmId: 'firm-b', actorId: 'user-1' }),
  );
});

test('live badge keys include actor so two users in the same firm do not share notifications', () => {
  assert.notEqual(
    liveBadgeKey({ scope: 'firm', firmId: 'firm-a', actorId: 'user-1' }),
    liveBadgeKey({ scope: 'firm', firmId: 'firm-a', actorId: 'user-2' }),
  );
  assert.notEqual(
    liveBadgeKey({ scope: 'client', firmId: 'firm-a', actorId: 'client-1' }),
    liveBadgeKey({ scope: 'client', firmId: 'firm-a', actorId: 'client-2' }),
  );
});

test('refuses to build a key without tenant context', () => {
  assert.throws(() => overdueSyncKey(''), { code: 'CACHE_KEY_TENANT_REQUIRED' });
  assert.throws(() => operationalDashboardKey(null), { code: 'CACHE_KEY_TENANT_REQUIRED' });
  assert.throws(() => liveBadgeKey({ scope: 'firm', firmId: 'firm-a', actorId: '' }), {
    code: 'CACHE_KEY_TENANT_REQUIRED',
  });
});
