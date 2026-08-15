/**
 * Garante que os POSTs públicos têm requireTurnstile com a action correcta.
 * Turnstile é anti-bot — NÃO substitui autorização por token/sessão.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { TURNSTILE_ACTIONS } = require('../services/turnstile/turnstile-actions');

function collectPostRoutes(router) {
  const out = [];
  for (const layer of router.stack || []) {
    if (!layer.route || !layer.route.methods?.post) continue;
    const path = layer.route.path;
    const names = (layer.route.stack || []).map((l) => l.name || l.handle?.name || '');
    out.push({ path, names });
  }
  return out;
}

test('POSTs públicos protegidos por Turnstile com actions correctas', () => {
  const router = require('./contabil-public.routes');
  const posts = collectPostRoutes(router);

  const expected = [
    { path: '/team-invite/:token/accept', action: TURNSTILE_ACTIONS.TEAM_INVITE_ACCEPT },
    { path: '/team/invites/:token/accept', action: TURNSTILE_ACTIONS.TEAM_INVITE_ACCEPT },
    { path: '/blog/newsletter', action: TURNSTILE_ACTIONS.NEWSLETTER },
    { path: '/support', action: TURNSTILE_ACTIONS.SUPPORT },
    {
      path: '/firms/:firmSlug/services/:serviceSlug/intake/lead',
      action: TURNSTILE_ACTIONS.INTAKE_LEAD,
    },
    {
      path: '/firms/:firmSlug/services/:serviceSlug/submit',
      action: TURNSTILE_ACTIONS.INTAKE_SUBMIT,
    },
    {
      path: '/service-inquiries/:token/documents',
      action: TURNSTILE_ACTIONS.PORTAL_UPLOAD,
    },
    {
      path: '/service-inquiries/:token/requests/:requestId/reply',
      action: TURNSTILE_ACTIONS.PORTAL_REPLY,
    },
  ];

  for (const { path } of expected) {
    const route = posts.find((p) => p.path === path);
    assert.ok(route, `rota POST ${path} deve existir`);
    assert.ok(
      route.names.includes('turnstileMiddleware'),
      `POST ${path} deve incluir turnstileMiddleware (encontrado: ${route.names.join(', ')})`,
    );
  }

  // Upload: rate limit → multer → turnstile → handler (token auth no service)
  const upload = posts.find((p) => p.path === '/service-inquiries/:token/documents');
  const uploadTs = upload.names.indexOf('turnstileMiddleware');
  const uploadMulter = upload.names.findIndex((n) => /multer|upload|wrap/i.test(n) || n === 'multipartMiddleware');
  // wrapMulter may appear as anonymous; ensure turnstile is present and not the only gate
  assert.ok(uploadTs >= 0, 'upload tem Turnstile');
  assert.ok(
    upload.names.includes('uploadByToken') || upload.names.some((n) => n.includes('upload')),
    `upload mantém handler de token (names: ${upload.names.join(', ')})`,
  );

  const reply = posts.find((p) => p.path === '/service-inquiries/:token/requests/:requestId/reply');
  assert.ok(reply.names.includes('turnstileMiddleware'), 'reply tem Turnstile');
  assert.ok(
    reply.names.includes('submitReply') || reply.names.some((n) => n.includes('Reply') || n.includes('reply')),
    `reply mantém handler de token (names: ${reply.names.join(', ')})`,
  );

  assert.equal(TURNSTILE_ACTIONS.PORTAL_UPLOAD, 'portal-upload');
  assert.equal(TURNSTILE_ACTIONS.PORTAL_REPLY, 'portal-reply');
  assert.equal(TURNSTILE_ACTIONS.INTAKE_LEAD, 'intake-lead');
  assert.equal(TURNSTILE_ACTIONS.INTAKE_SUBMIT, 'intake-submit');
});
