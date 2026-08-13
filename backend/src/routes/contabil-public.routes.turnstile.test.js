/**
 * Garante que os POSTs públicos da Fase 2 têm requireTurnstile com a action correcta.
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

test('Fase 2: POSTs públicos protegidos por Turnstile com actions correctas', () => {
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
  ];

  for (const { path, action } of expected) {
    const route = posts.find((p) => p.path === path);
    assert.ok(route, `rota POST ${path} deve existir`);
    assert.ok(
      route.names.includes('turnstileMiddleware'),
      `POST ${path} deve incluir turnstileMiddleware (encontrado: ${route.names.join(', ')})`,
    );
  }

  // Portal upload/reply (P1) ainda sem Turnstile nesta fase
  const upload = posts.find((p) => p.path === '/service-inquiries/:token/documents');
  const reply = posts.find((p) => p.path === '/service-inquiries/:token/requests/:requestId/reply');
  assert.ok(upload, 'upload route exists');
  assert.ok(reply, 'reply route exists');
  assert.ok(!upload.names.includes('turnstileMiddleware'), 'upload ainda sem Turnstile (P1)');
  assert.ok(!reply.names.includes('turnstileMiddleware'), 'reply ainda sem Turnstile (P1)');

  assert.equal(TURNSTILE_ACTIONS.INTAKE_LEAD, 'intake-lead');
  assert.equal(TURNSTILE_ACTIONS.INTAKE_SUBMIT, 'intake-submit');
  assert.equal(TURNSTILE_ACTIONS.SUPPORT, 'support');
  assert.equal(TURNSTILE_ACTIONS.NEWSLETTER, 'newsletter');
  assert.equal(TURNSTILE_ACTIONS.TEAM_INVITE_ACCEPT, 'team-invite-accept');
});
