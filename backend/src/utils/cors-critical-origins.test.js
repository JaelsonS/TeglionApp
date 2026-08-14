const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  isStagingFrontendUrl,
  buildCriticalCorsOrigins,
} = require('./cors-critical-origins');

test('isStagingFrontendUrl: staging.teglion.com', () => {
  assert.equal(isStagingFrontendUrl('https://staging.teglion.com'), true);
});

test('isStagingFrontendUrl: produção não é staging', () => {
  assert.equal(isStagingFrontendUrl('https://teglion.com'), false);
  assert.equal(isStagingFrontendUrl('https://www.teglion.com'), false);
});

test('buildCriticalCorsOrigins em staging NÃO inclui teglion.com', () => {
  const origins = buildCriticalCorsOrigins('https://staging.teglion.com');
  assert.ok(origins.includes('https://staging.teglion.com'));
  assert.ok(!origins.includes('https://teglion.com'));
  assert.ok(!origins.includes('https://www.teglion.com'));
});

test('buildCriticalCorsOrigins em produção inclui BRAND.productionOrigins', () => {
  const origins = buildCriticalCorsOrigins('https://teglion.com');
  assert.ok(origins.includes('https://teglion.com'));
  assert.ok(origins.includes('https://www.teglion.com'));
});
