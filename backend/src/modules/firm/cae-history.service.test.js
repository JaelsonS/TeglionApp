require('../../test/ensure-test-env');

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { _test } = require('./cae-history.service');

test('normalizeCae trim e limita tamanho', () => {
  assert.equal(_test.normalizeCae('  62010 — Foo  '), '62010 — Foo');
  assert.equal(_test.normalizeCae('x'.repeat(200)).length, 120);
});

test('dedupePreserveOrder é case-insensitive e mantém ordem', () => {
  assert.deepEqual(_test.dedupePreserveOrder(['A', 'a', 'B', '  ', 'b', 'C']), ['A', 'B', 'C']);
});
