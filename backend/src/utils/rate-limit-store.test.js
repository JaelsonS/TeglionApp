const test = require('node:test');
const assert = require('node:assert/strict');
const { failOpenRedisResponse } = require('./rate-limit-store');

test('failOpenRedisResponse returns safe values for rate-limit commands', () => {
  assert.deepEqual(failOpenRedisResponse(['EVALSHA', 'sha', '1', 'key', '0', '900000']), [1, 60_000]);
  assert.equal(failOpenRedisResponse(['SCRIPT', 'LOAD', 'lua']), 'teglion-fallback-sha');
  assert.equal(failOpenRedisResponse(['INCR', 'key']), 1);
  assert.equal(failOpenRedisResponse(['DECR', 'key']), 0);
  assert.equal(failOpenRedisResponse(['GET', 'key']), '0');
  assert.equal(failOpenRedisResponse(['PTTL', 'key']), 60_000);
  assert.equal(failOpenRedisResponse(['PEXPIRE', 'key', '900000']), 1);
  assert.equal(failOpenRedisResponse(['DEL', 'key']), 1);
});
