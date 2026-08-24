const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Regressão do achado "CSRF/CORS Achado A" (auditoria de segurança 19-20/08/2026):
// o preflight CORS de rotas /api/public/* tratava `OPTIONS` como método seguro sem olhar
// para `Access-Control-Request-Method`, deixando QUALQUER origem "passar" o preflight de
// uma rota de mutação pública (ex.: POST /api/public/support). O POST real acabava
// rejeitado, mas o servidor processava-o mesmo assim (cors@2.8.6 não interrompe o request).
// A correção resolve o método real pretendido a partir desse header quando é um preflight.

let server;
let baseUrl;

before(async () => {
  process.env.CORS_ORIGINS = 'https://app.teglion.com';
  process.env.FRONTEND_URL = 'https://app.teglion.com';
  const { app } = require('./app');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('preflight OPTIONS para POST /api/public/support com origem NÃO autorizada é rejeitado (sem Access-Control-Allow-Origin)', async () => {
  const res = await fetch(`${baseUrl}/api/public/support`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://attacker.example',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('preflight OPTIONS para GET /api/public/pricing com origem NÃO autorizada é aceito (leitura pública real)', async () => {
  const res = await fetch(`${baseUrl}/api/public/pricing`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://attacker.example',
      'Access-Control-Request-Method': 'GET',
    },
  });
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://attacker.example');
});

test('preflight OPTIONS para POST /api/public/support com origem autorizada continua a funcionar (sem regressão)', async () => {
  const res = await fetch(`${baseUrl}/api/public/support`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://app.teglion.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://app.teglion.com');
});
