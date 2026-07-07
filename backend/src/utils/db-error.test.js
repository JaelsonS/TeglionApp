const test = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../middlewares/error.middleware');
const { mapDbError } = require('./db-error');

test('mapDbError maps duplicate email to 409', () => {
  const err = mapDbError({ code: '23505', message: 'duplicate key value violates unique constraint "firm_users_email_key"' });
  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, 409);
  assert.match(err.message, /E-mail já registado/i);
});

test('mapDbError maps missing table to 503', () => {
  const err = mapDbError({ code: '42P01', message: 'relation "user_legal_consents" does not exist' });
  assert.equal(err.statusCode, 503);
});
