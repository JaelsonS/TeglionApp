require('../test/ensure-test-env');

delete process.env.TURNSTILE_SECRET_KEY;

const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('./error.middleware');
const { requireTurnstile } = require('./turnstile.middleware');

test('requireTurnstile: em test sem secret, deixa passar (skip)', async () => {
  const mw = requireTurnstile({ action: 'login-firm' });
  let nextErr;
  let nextCalled = false;
  await mw({ body: {} }, {}, (err) => {
    nextErr = err;
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(nextErr, undefined);
});

test('requireTurnstile: exige action na factory', () => {
  assert.throws(() => requireTurnstile({}), /action/);
});

test('AppError turnstile codes usam 403', () => {
  const err = new AppError('x', 403, { code: 'TURNSTILE_FAILED' }, 'TURNSTILE_FAILED');
  assert.equal(err.statusCode, 403);
  assert.equal(err.code, 'TURNSTILE_FAILED');
});
