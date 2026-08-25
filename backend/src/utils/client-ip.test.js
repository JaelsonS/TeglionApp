const test = require('node:test');
const assert = require('node:assert/strict');

const { clientIp } = require('./client-ip');

// Regressão: clientIp() lia X-Forwarded-For diretamente do header, sem qualquer
// validação de proxy confiável. Um chamador podia forjar esse header para corromper
// logs de auditoria de segurança (IP em bloqueios de conta, eventos de login, etc.),
// potencialmente incriminando terceiros ou escondendo a origem real de um ataque.
// req.ip (populado pelo Express a partir de `trust proxy`) é a única fonte confiável.

test('clientIp: usa req.ip (resolvido pelo Express via trust proxy), não o header cru', () => {
  const req = {
    ip: '203.0.113.5',
    headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.5' },
    socket: { remoteAddress: '10.0.0.1' },
  };
  assert.equal(clientIp(req), '203.0.113.5');
});

test('clientIp: um X-Forwarded-For forjado sem proxy confiável não é usado', () => {
  const req = {
    ip: undefined,
    headers: { 'x-forwarded-for': '8.8.8.8' },
    socket: { remoteAddress: '10.0.0.1' },
  };
  // Sem req.ip (ex.: trust proxy não configurado ou requisição fora do Express router),
  // cai para o socket real — nunca para o header forjável.
  assert.equal(clientIp(req), '10.0.0.1');
});

test('clientIp: sem req.ip nem socket, devolve null em vez de confiar em headers', () => {
  const req = { headers: { 'x-forwarded-for': '8.8.8.8' } };
  assert.equal(clientIp(req), null);
});
