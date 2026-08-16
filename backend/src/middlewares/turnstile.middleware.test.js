require('../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const { AppError } = require('./error.middleware');
const { env } = require('../config/env');
const turnstileService = require('../services/turnstile/turnstile.service');
const { requireTurnstile } = require('./turnstile.middleware');

function restoreEnv(snapshot) {
  env.TURNSTILE_SECRET_KEY = snapshot.secret;
  env.isProduction = snapshot.isProduction;
  env.FRONTEND_URL = snapshot.frontend;
}

test('requireTurnstile: sem secret (não-produção local), deixa passar (skip)', async () => {
  const snapshot = {
    secret: env.TURNSTILE_SECRET_KEY,
    isProduction: env.isProduction,
    frontend: env.FRONTEND_URL,
  };
  env.TURNSTILE_SECRET_KEY = null;
  env.isProduction = false;
  env.FRONTEND_URL = 'http://localhost:3000';
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
    restoreEnv(snapshot);
  }
});

test('requireTurnstile: produção sem secret → fail closed TURNSTILE_UNAVAILABLE', async () => {
  const snapshot = {
    secret: env.TURNSTILE_SECRET_KEY,
    isProduction: env.isProduction,
    frontend: env.FRONTEND_URL,
  };
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
    restoreEnv(snapshot);
  }
});

test('requireTurnstile: staging FRONTEND_URL sem secret → fail closed (mesmo com isProduction false)', async () => {
  const snapshot = {
    secret: env.TURNSTILE_SECRET_KEY,
    isProduction: env.isProduction,
    frontend: env.FRONTEND_URL,
  };
  env.TURNSTILE_SECRET_KEY = null;
  env.isProduction = false;
  env.FRONTEND_URL = 'https://staging.teglion.com';
  try {
    const mw = requireTurnstile({ action: 'intake-lead' });
    let nextErr;
    await mw({ body: {} }, {}, (err) => {
      nextErr = err;
    });
    assert.ok(nextErr instanceof AppError);
    assert.equal(nextErr.code, 'TURNSTILE_UNAVAILABLE');
    assert.equal(nextErr.statusCode, 403);
  } finally {
    restoreEnv(snapshot);
  }
});

test('requireTurnstile: exige action na factory', () => {
  assert.throws(() => requireTurnstile({}), /action/);
});

test('requireTurnstile: staging com secret e sem token → fail closed (TURNSTILE_MISSING)', async () => {
  const snapshot = {
    secret: env.TURNSTILE_SECRET_KEY,
    isProduction: env.isProduction,
    frontend: env.FRONTEND_URL,
  };
  env.TURNSTILE_SECRET_KEY = '0xTEST_STAGING_SECRET';
  env.FRONTEND_URL = 'https://staging.teglion.com';
  env.isProduction = true;
  try {
    const mw = requireTurnstile({ action: 'login-firm' });
    let nextErr;
    await mw({ body: {} }, {}, (err) => {
      nextErr = err;
    });
    assert.ok(nextErr instanceof AppError);
    assert.equal(nextErr.code, 'TURNSTILE_MISSING');
    assert.equal(nextErr.statusCode, 403);
  } finally {
    restoreEnv(snapshot);
  }
});

test('requireTurnstile: staging + token inválido → 403 TURNSTILE_FAILED (Siteverify mockado)', async () => {
  const snapshot = {
    secret: env.TURNSTILE_SECRET_KEY,
    isProduction: env.isProduction,
    frontend: env.FRONTEND_URL,
  };
  env.TURNSTILE_SECRET_KEY = '0xTEST_STAGING_SECRET';
  env.FRONTEND_URL = 'https://staging.teglion.com';
  env.isProduction = true;
  mock.method(turnstileService, 'verifyTurnstileToken', async () => {
    throw new AppError('Verificação de segurança falhou.', 403, { code: 'TURNSTILE_FAILED' }, 'TURNSTILE_FAILED');
  });
  try {
    const mw = requireTurnstile({ action: 'intake-submit' });
    let nextErr;
    await mw({ body: { turnstileToken: 'bad-token' } }, {}, (err) => {
      nextErr = err;
    });
    assert.ok(nextErr instanceof AppError);
    assert.equal(nextErr.code, 'TURNSTILE_FAILED');
    assert.equal(nextErr.statusCode, 403);
  } finally {
    mock.restoreAll();
    restoreEnv(snapshot);
  }
});

test('requireTurnstile: staging + token válido → operação continua (Siteverify mockado)', async () => {
  const snapshot = {
    secret: env.TURNSTILE_SECRET_KEY,
    isProduction: env.isProduction,
    frontend: env.FRONTEND_URL,
  };
  env.TURNSTILE_SECRET_KEY = '0xTEST_STAGING_SECRET';
  env.FRONTEND_URL = 'https://staging.teglion.com';
  env.isProduction = true;
  mock.method(turnstileService, 'verifyTurnstileToken', async ({ token, expectedAction }) => {
    assert.equal(token, 'good-token');
    assert.equal(expectedAction, 'intake-lead');
    return { success: true, action: expectedAction, hostname: 'staging.teglion.com' };
  });
  try {
    const mw = requireTurnstile({ action: 'intake-lead' });
    const req = { body: { turnstileToken: 'good-token', name: 'Ana' } };
    let nextErr;
    let nextCalled = false;
    await mw(req, {}, (err) => {
      nextErr = err;
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(nextErr, undefined);
    assert.equal(req.body.turnstileToken, undefined);
    assert.equal(req.body.name, 'Ana');
  } finally {
    mock.restoreAll();
    restoreEnv(snapshot);
  }
});

test('AppError turnstile codes usam 403', () => {
  const err = new AppError('x', 403, { code: 'TURNSTILE_FAILED' }, 'TURNSTILE_FAILED');
  assert.equal(err.statusCode, 403);
  assert.equal(err.code, 'TURNSTILE_FAILED');
});
