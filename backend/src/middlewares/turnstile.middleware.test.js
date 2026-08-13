require('../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('./error.middleware');
const { env } = require('../config/env');
const { requireTurnstile } = require('./turnstile.middleware');

test('requireTurnstile: sem secret (não-produção), deixa passar (skip)', async () => {
  const previousSecret = env.TURNSTILE_SECRET_KEY;
  const previousProd = env.isProduction;
  env.TURNSTILE_SECRET_KEY = null;
  env.isProduction = false;
  try {
    const mw = requireTurnstile({ action: 'login-firm' });
    let nextErr;
    let nextCalled = false;
    await mw({ body: {} }, {}, (err) => {
      nextErr = err;
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(nextErr, undefined);
  } finally {
    env.TURNSTILE_SECRET_KEY = previousSecret;
    env.isProduction = previousProd;
  }
});

test('requireTurnstile: produção sem secret → fail closed TURNSTILE_UNAVAILABLE', async () => {
  const previousSecret = env.TURNSTILE_SECRET_KEY;
  const previousProd = env.isProduction;
  env.TURNSTILE_SECRET_KEY = null;
  env.isProduction = true;
  try {
    const mw = requireTurnstile({ action: 'login-firm' });
    let nextErr;
    await mw({ body: {} }, {}, (err) => {
      nextErr = err;
    });
    assert.ok(nextErr instanceof AppError);
    assert.equal(nextErr.code, 'TURNSTILE_UNAVAILABLE');
    assert.equal(nextErr.statusCode, 403);
  } finally {
    env.TURNSTILE_SECRET_KEY = previousSecret;
    env.isProduction = previousProd;
  }
});

test('requireTurnstile: exige action na factory', () => {
  assert.throws(() => requireTurnstile({}), /action/);
});

test('requireTurnstile: staging FRONTEND_URL sem token → skip UAT', async () => {
  const previousSecret = env.TURNSTILE_SECRET_KEY;
  const previousFrontend = env.FRONTEND_URL;
  const previousProd = env.isProduction;
  env.TURNSTILE_SECRET_KEY = '0xTEST_STAGING_SECRET';
  env.FRONTEND_URL = 'https://staging.teglion.com';
  env.isProduction = true;
  try {
    const mw = requireTurnstile({ action: 'login-firm' });
    let nextErr;
    let nextCalled = false;
    await mw({ body: {} }, {}, (err) => {
      nextErr = err;
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(nextErr, undefined);
  } finally {
    env.TURNSTILE_SECRET_KEY = previousSecret;
    env.FRONTEND_URL = previousFrontend;
    env.isProduction = previousProd;
  }
});

test('AppError turnstile codes usam 403', () => {
  const err = new AppError('x', 403, { code: 'TURNSTILE_FAILED' }, 'TURNSTILE_FAILED');
  assert.equal(err.statusCode, 403);
  assert.equal(err.code, 'TURNSTILE_FAILED');
});
