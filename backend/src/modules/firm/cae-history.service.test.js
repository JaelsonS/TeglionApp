const dotenv = require('dotenv');
const originalDotenvConfig = dotenv.config.bind(dotenv);
dotenv.config = (options = {}) => originalDotenvConfig({ ...options, override: false });

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-min-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-min-32-chars!';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

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
