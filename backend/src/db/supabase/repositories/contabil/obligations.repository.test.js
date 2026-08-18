const test = require('node:test');
const assert = require('node:assert/strict');

require('../../../../test/ensure-test-env');
const ttlCache = require('../../../../utils/cache/ttl-cache');
const { maybeSyncOverdueObligations } = require('./obligations.repository');

test('maybeSyncOverdueObligations: second call for the same firm skips the UPDATE', async () => {
  ttlCache.clearMemory();
  let calls = 0;
  const sync = async () => {
    calls += 1;
  };
  assert.equal(await maybeSyncOverdueObligations('firm-a', sync), true);
  assert.equal(await maybeSyncOverdueObligations('firm-a', sync), false);
  assert.equal(calls, 1);
});

test('maybeSyncOverdueObligations: different firms do not share the throttle', async () => {
  ttlCache.clearMemory();
  const seen = [];
  const sync = async (firmId) => {
    seen.push(firmId);
  };
  await maybeSyncOverdueObligations('firm-a', sync);
  await maybeSyncOverdueObligations('firm-b', sync);
  assert.deepEqual(seen, ['firm-a', 'firm-b']);
});
