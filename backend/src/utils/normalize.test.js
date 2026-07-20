const test = require('node:test');
const assert = require('node:assert/strict');
const validator = require('validator');
const { normalizeEmail, SAFE_NORMALIZE_EMAIL_OPTIONS } = require('./normalize');

test('normalizeEmail só faz trim + lowercase (mantém pontos Gmail)', () => {
  assert.equal(normalizeEmail('  Geral.LLCNunes@Gmail.com '), 'geral.llcnunes@gmail.com');
  assert.equal(normalizeEmail('colaborador.llcnunes@gmail.com'), 'colaborador.llcnunes@gmail.com');
});

test('SAFE_NORMALIZE_EMAIL_OPTIONS não remove pontos do Gmail', () => {
  const email = 'colaborador.llcnunes@gmail.com';
  assert.equal(validator.normalizeEmail(email, SAFE_NORMALIZE_EMAIL_OPTIONS), email);
  assert.notEqual(validator.normalizeEmail(email), email);
});
