const test = require('node:test');
const assert = require('node:assert/strict');
const { failOpenRedisResponse } = require('./rate-limit-store');

test('failOpenRedisResponse incrementa contadores em memória (não falha aberto)', () => {
  const key = `test-rl-${Date.now()}`;
  const first = failOpenRedisResponse(['INCR', key]);
  const second = failOpenRedisResponse(['INCR', key]);
  assert.equal(first, 1);
  assert.equal(second, 2);
  assert.equal(failOpenRedisResponse(['GET', key]), '2');
  assert.equal(failOpenRedisResponse(['SCRIPT', 'LOAD', 'lua']), 'teglion-fallback-sha');
});

test('failOpenRedisResponse EVALSHA também conta hits em memória', () => {
  const key = `eval-key-${Date.now()}`;
  const a = failOpenRedisResponse(['EVALSHA', 'sha', '1', key, '0', '900000']);
  const b = failOpenRedisResponse(['EVALSHA', 'sha', '1', key, '0', '900000']);
  assert.equal(a[0], 1);
  assert.equal(b[0], 2);
  assert.ok(a[1] > 0);
});
