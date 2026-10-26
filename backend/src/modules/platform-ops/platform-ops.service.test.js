require('../../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { env } = require('../../config/env');
const { resolveOpsEnvironmentLabel } = require('./platform-ops.service');

test('resolveOpsEnvironmentLabel: FRONTEND_URL staging → staging', () => {
  const snap = env.FRONTEND_URL;
  try {
    env.FRONTEND_URL = 'https://staging.teglion.com';
    assert.equal(resolveOpsEnvironmentLabel(), 'staging');
  } finally {
    env.FRONTEND_URL = snap;
  }
});

test('resolveOpsEnvironmentLabel: FRONTEND_URL produção → production', () => {
  const snap = env.FRONTEND_URL;
  try {
    env.FRONTEND_URL = 'https://www.teglion.com';
    assert.equal(resolveOpsEnvironmentLabel(), 'production');
  } finally {
    env.FRONTEND_URL = snap;
  }
});
