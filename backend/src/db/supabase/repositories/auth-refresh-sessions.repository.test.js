const test = require('node:test');
const assert = require('node:assert/strict');

require('../../../test/ensure-test-env');

// Regressão: a rotação de refresh token fazia findByJti() + deleteByJti() em duas
// chamadas separadas. Dois pedidos concorrentes com o mesmo refresh token liam a
// mesma sessão antes de qualquer um apagar, e ambos passavam na verificação de
// token_hash — emitindo duas sessões novas a partir de um único token (quebra a
// garantia de rotação single-use). claimByJti() faz DELETE...RETURNING atómico:
// só um dos dois pedidos concorrentes consegue "reclamar" a linha.

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

function createFakeSupabase(rows) {
  return {
    from(tableName) {
      assert.equal(tableName, 'auth_refresh_sessions');
      const filters = [];
      let isDelete = false;

      const matches = () => rows.filter((r) => filters.every(([f, v]) => r[f] === v));

      const builder = {
        delete() {
          isDelete = true;
          return builder;
        },
        select() {
          return builder;
        },
        eq(field, value) {
          filters.push([field, value]);
          return builder;
        },
        async maybeSingle() {
          if (!isDelete) return { data: matches()[0] || null, error: null };
          const affected = matches();
          if (affected.length) {
            const removedIds = new Set(affected.map((r) => r.jti));
            const remaining = rows.filter((r) => !removedIds.has(r.jti));
            rows.length = 0;
            rows.push(...remaining);
          }
          return { data: affected[0] || null, error: null };
        },
      };
      return builder;
    },
  };
}

function setup(rows) {
  const fakeSb = createFakeSupabase(rows);
  stubModule('../client', { getSupabaseAdmin: () => fakeSb });
  delete require.cache[require.resolve('./auth-refresh-sessions.repository')];
  return require('./auth-refresh-sessions.repository');
}

test('claimByJti: apenas um de dois pedidos concorrentes com o mesmo token consegue reclamar a sessão', async () => {
  const rows = [{ jti: 'jti-1', actor_type: 'firm_user', actor_id: 'user-1', token_hash: 'hash-abc', expires_at: null }];
  const repo = setup(rows);

  const [first, second] = await Promise.all([
    repo.claimByJti('jti-1', 'hash-abc'),
    repo.claimByJti('jti-1', 'hash-abc'),
  ]);

  const winners = [first, second].filter(Boolean);
  assert.equal(winners.length, 1, 'exactamente um dos dois pedidos devia ganhar a sessão');
  assert.equal(rows.length, 0, 'a sessão devia ter sido removida (uso único)');
});

test('claimByJti: token_hash divergente não reclama a sessão de outro token', async () => {
  const rows = [{ jti: 'jti-2', actor_type: 'firm_user', actor_id: 'user-2', token_hash: 'hash-real', expires_at: null }];
  const repo = setup(rows);

  const result = await repo.claimByJti('jti-2', 'hash-forjado');

  assert.equal(result, null);
  assert.equal(rows.length, 1, 'sessão legítima não devia ser apagada por um hash divergente');
});

test('claimByJti: jti inexistente devolve null sem lançar', async () => {
  const repo = setup([]);
  const result = await repo.claimByJti('jti-fantasma', 'hash-x');
  assert.equal(result, null);
});
