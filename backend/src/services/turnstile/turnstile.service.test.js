require('../../test/ensure-test-env');

process.env.TURNSTILE_SECRET_KEY = '0xTEST_REAL_LOOKING_SECRET_FOR_UNIT';
process.env.TURNSTILE_EXPECTED_HOSTNAMES = 'www.teglion.com,teglion.com';

const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyTurnstileToken, hostnameAllowed, extractTurnstileToken } = require('./turnstile.service');
const { AppError } = require('../../middlewares/error.middleware');

test('hostnameAllowed / extractTurnstileToken', () => {
  assert.equal(hostnameAllowed('www.teglion.com', ['www.teglion.com']), true);
  assert.equal(extractTurnstileToken({ body: { turnstileToken: 'abc' } }), 'abc');
});

test('verifyTurnstileToken: sem token → TURNSTILE_MISSING', async () => {
  await assert.rejects(
    () => verifyTurnstileToken({ token: '', expectedAction: 'login-firm' }),
    (err) => err instanceof AppError && err.code === 'TURNSTILE_MISSING' && err.statusCode === 403,
  );
});

test('verifyTurnstileToken: success + action + hostname OK', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      action: 'login-firm',
      hostname: 'www.teglion.com',
    }),
  });
  try {
    const out = await verifyTurnstileToken({
      token: 'valid-token-not-logged',
      expectedAction: 'login-firm',
    });
    assert.equal(out.success, true);
    assert.equal(out.action, 'login-firm');
  } finally {
    global.fetch = originalFetch;
  }
});

test('verifyTurnstileToken: action incorrecta → TURNSTILE_ACTION_MISMATCH', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      action: 'recover',
      hostname: 'www.teglion.com',
    }),
  });
  try {
    await assert.rejects(
      () => verifyTurnstileToken({ token: 'tok', expectedAction: 'login-firm' }),
      (err) => err instanceof AppError && err.code === 'TURNSTILE_ACTION_MISMATCH',
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('verifyTurnstileToken: hostname incorrecto → TURNSTILE_HOSTNAME_MISMATCH', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      action: 'login-firm',
      hostname: 'evil.example',
    }),
  });
  try {
    await assert.rejects(
      () => verifyTurnstileToken({ token: 'tok', expectedAction: 'login-firm' }),
      (err) => err instanceof AppError && err.code === 'TURNSTILE_HOSTNAME_MISMATCH',
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('verifyTurnstileToken: success false → TURNSTILE_FAILED', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: false,
      'error-codes': ['invalid-input-response'],
    }),
  });
  try {
    await assert.rejects(
      () => verifyTurnstileToken({ token: 'bad', expectedAction: 'login-firm' }),
      (err) => err instanceof AppError && err.code === 'TURNSTILE_FAILED',
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('verifyTurnstileToken: timeout/rede → TURNSTILE_UNAVAILABLE', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('network down');
  };
  try {
    await assert.rejects(
      () => verifyTurnstileToken({ token: 'tok', expectedAction: 'login-firm' }),
      (err) => err instanceof AppError && err.code === 'TURNSTILE_UNAVAILABLE',
    );
  } finally {
    global.fetch = originalFetch;
  }
});
