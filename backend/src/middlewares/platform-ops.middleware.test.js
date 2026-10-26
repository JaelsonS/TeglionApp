const test = require('node:test');
const assert = require('node:assert/strict');

const { env } = require('../config/env');
const { isPlatformOpsEmail, requirePlatformOps } = require('./platform-ops.middleware');

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

test('requirePlatformOps: >1 email na allowlist → PLATFORM_OPS_ALLOWLIST_INVALID', async () => {
  const originalEnabled = env.PLATFORM_OPS_ENABLED;
  const originalList = [...(env.PLATFORM_OPS_EMAIL_ALLOWLIST || [])];
  try {
    env.PLATFORM_OPS_ENABLED = true;
    env.PLATFORM_OPS_EMAIL_ALLOWLIST.length = 0;
    env.PLATFORM_OPS_EMAIL_ALLOWLIST.push('a@example.com', 'b@example.com');

    let captured = null;
    const req = { user: { id: 'u1', role: 'FIRM_OWNER' } };
    await requirePlatformOps(req, {}, (err) => {
      captured = err;
    });
    assert.ok(captured);
    assert.equal(captured.statusCode, 503);
    assert.equal(captured.details?.code || captured.code, 'PLATFORM_OPS_ALLOWLIST_INVALID');
  } finally {
    env.PLATFORM_OPS_ENABLED = originalEnabled;
    env.PLATFORM_OPS_EMAIL_ALLOWLIST.length = 0;
    for (const e of originalList) env.PLATFORM_OPS_EMAIL_ALLOWLIST.push(e);
  }
});
