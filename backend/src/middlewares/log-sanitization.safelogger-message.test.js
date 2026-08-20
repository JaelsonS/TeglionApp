const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SafeLogger } = require('./log-sanitization.middleware');

function makeCapturingLogger() {
  const calls = { debug: [], info: [], warn: [], error: [] };
  return {
    calls,
    debug: (...args) => calls.debug.push(args),
    info: (...args) => calls.info.push(args),
    warn: (...args) => calls.warn.push(args),
    error: (...args) => calls.error.push(args),
  };
}

test('SafeLogger.info sanitiza a MENSAGEM (regressão: morgan loga a URL inteira, incl. querystring OAuth)', () => {
  const raw = makeCapturingLogger();
  const safe = new SafeLogger(raw);

  // Formato real de linha do morgan: método + URL completa (com querystring) + status.
  const httpLine = 'GET /api/auth/google/callback?code=4/0AVeryRealAuthCode&state=abc123def456 200 45ms';
  safe.info(httpLine);

  const [loggedMessage] = raw.calls.info[0];
  assert.ok(!loggedMessage.includes('4/0AVeryRealAuthCode'), 'código OAuth não deve aparecer em texto plano no log');
  assert.ok(!loggedMessage.includes('abc123def456'), 'state OAuth não deve aparecer em texto plano no log');
  assert.ok(loggedMessage.includes('code=[REDACTED]'), 'código OAuth deve estar redigido');
  assert.ok(loggedMessage.includes('state=[REDACTED]'), 'state OAuth deve estar redigido');
});

test('SafeLogger.error sanitiza a mensagem (não só o objeto de erro)', () => {
  const raw = makeCapturingLogger();
  const safe = new SafeLogger(raw);

  safe.error('Falha ao processar Bearer eyJhbGciOiJIUzI1NiJ9.fake.signature', new Error('boom'));

  const [loggedMessage] = raw.calls.error[0];
  assert.ok(!loggedMessage.includes('eyJhbGciOiJIUzI1NiJ9'), 'JWT não deve aparecer em texto plano na mensagem');
  assert.ok(loggedMessage.includes('Bearer [REDACTED]'));
});

test('SafeLogger.debug/warn continuam a sanitizar `data` como antes (sem regressão)', () => {
  const raw = makeCapturingLogger();
  const safe = new SafeLogger(raw);

  safe.warn('login falhou', { email: 'user@example.com', password: 'hunter2' });
  const [, data] = raw.calls.warn[0];
  assert.equal(data.password, '[REDACTED]');
  assert.equal(data.email, '[REDACTED]');
});

test('mensagem não-string (undefined) não quebra o logger', () => {
  const raw = makeCapturingLogger();
  const safe = new SafeLogger(raw);
  assert.doesNotThrow(() => safe.info(undefined, { ok: true }));
});
