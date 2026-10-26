const test = require('node:test');
const assert = require('node:assert/strict');

const { env } = require('../config/env');
const { isPlatformOpsEmail } = require('./platform-ops.middleware');

test('isPlatformOpsEmail: allowlist case-insensitive e rejeita fora da lista', () => {
  const original = [...(env.PLATFORM_OPS_EMAIL_ALLOWLIST || [])];
  try {
    env.PLATFORM_OPS_EMAIL_ALLOWLIST.length = 0;
    env.PLATFORM_OPS_EMAIL_ALLOWLIST.push('ops@afdigital.example');
    assert.equal(isPlatformOpsEmail('OPS@afdigital.example'), true);
    assert.equal(isPlatformOpsEmail('ops@afdigital.example'), true);
    assert.equal(isPlatformOpsEmail('other@example.com'), false);
    assert.equal(isPlatformOpsEmail(''), false);
    assert.equal(isPlatformOpsEmail(null), false);
  } finally {
    env.PLATFORM_OPS_EMAIL_ALLOWLIST.length = 0;
    for (const e of original) env.PLATFORM_OPS_EMAIL_ALLOWLIST.push(e);
  }
});
