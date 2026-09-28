const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeScope } = require('./recurring-removal.service');

test('normalizeScope: occurrence by default', () => {
  assert.equal(normalizeScope(undefined), 'occurrence');
  assert.equal(normalizeScope(''), 'occurrence');
});

test('normalizeScope: series aliases', () => {
  assert.equal(normalizeScope('series'), 'series');
  assert.equal(normalizeScope('all'), 'series');
  assert.equal(normalizeScope('all_future'), 'series');
});

test('normalizeScope: occurrence explicit', () => {
  assert.equal(normalizeScope('occurrence'), 'occurrence');
  assert.equal(normalizeScope('month'), 'occurrence');
});
