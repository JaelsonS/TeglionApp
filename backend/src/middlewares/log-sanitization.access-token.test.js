const test = require('node:test');
const assert = require('node:assert/strict');

const { sanitizeObject } = require('./log-sanitization.middleware');

test('sanitizeObject: redige accessToken mesmo com casing camelCase', () => {
  const out = sanitizeObject({
    clientId: 'c1',
    accessToken: 'ya29.secret-token',
    fileId: 'file-1',
  });
  assert.equal(out.accessToken, '[REDACTED]');
  assert.equal(out.clientId, 'c1');
  assert.equal(out.fileId, 'file-1');
});

test('sanitizeObject: redige senhas oficiais do CSV (at_senha)', () => {
  const out = sanitizeObject({
    at_senha: 'portal-secret',
    ss_senha: 'ss-secret',
    nif: '123456789',
  });
  assert.equal(out.at_senha, '[REDACTED]');
  assert.equal(out.ss_senha, '[REDACTED]');
  assert.equal(out.nif, '[REDACTED]');
});

test('sanitizeObject: redige apiKey / Authorization case-insensitive', () => {
  const out = sanitizeObject({
    apiKey: 'AIzaSy-test',
    Authorization: 'Bearer x',
  });
  assert.equal(out.apiKey, '[REDACTED]');
  assert.equal(out.Authorization, '[REDACTED]');
});
