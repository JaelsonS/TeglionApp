const { test } = require('node:test');
const assert = require('node:assert/strict');

// Regressão do achado ROADMAP 0.1 (auditoria de multi-tenancy, 18/08/2026): as leituras de
// view_count/first_viewed_at/last_viewed_at em recordView() filtravam só por `id`, sem
// `firm_id` — um cliente do escritório B, sabendo o UUID de um documento/obrigação do
// escritório A, conseguia ler a metadata de visualização do escritório A na resposta do
// endpoint POST /api/me/contabil/documents/:id/view (e o equivalente de obligations).

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

// Fake mínimo do query builder do supabase-js, reativo o suficiente para o que
// recordView()/recordActivity() realmente chamam: from().select().eq().eq().maybeSingle(),
// from().insert().select().single(), e from().update().eq().eq() (usado sem terminal,
// então precisa ser "thenable" — await direto no builder).
function createFakeSupabase(tables) {
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
          pendingInsert = { id: `generated-${rows.length + 1}`, created_at: new Date().toISOString(), ...payload };
          rows.push(pendingInsert);
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
        order() {
          return builder;
        },
        limit() {
          return builder;
        },
        async maybeSingle() {
          const found = pendingInsert || matches()[0] || null;
          return { data: found, error: null };
        },
        async single() {
          const found = pendingInsert || matches()[0] || null;
          return { data: found, error: null };
        },
        then(resolve) {
          if (pendingUpdate) {
            matches().forEach((r) => Object.assign(r, pendingUpdate));
          }
          resolve({ data: matches(), error: null });
        },
      };
      return builder;
    },
  };
}

function setup(tables) {
  const fakeSb = createFakeSupabase(tables);
  stubModule('../../db/supabase/client', {
    isSupabaseConfigured: () => true,
    getSupabaseAdmin: () => fakeSb,
  });
  delete require.cache[require.resolve('../activity/activity.service')];
  delete require.cache[require.resolve('./view-tracking.service')];
  return require('./view-tracking.service');
}

test('recordView NÃO vaza view_count de outro escritório quando firmId não corresponde ao dono real do documento', async () => {
  const tables = {
    documents: [{ id: 'doc-1', firm_id: 'firm-A', view_count: 47, first_viewed_at: '2026-01-01T00:00:00.000Z' }],
    content_views: [],
  };
  const { recordView } = setup(tables);

  const result = await recordView({
    firmId: 'firm-B',
    clientId: 'client-B-1',
    entityType: 'DOCUMENT',
    entityId: 'doc-1',
    viewerRole: 'CLIENT',
    viewerId: 'client-B-1',
    viewerName: 'Cliente B',
    ipAddress: '1.2.3.4',
    userAgent: 'test-agent',
  });

  // Antes da correção, isso retornava 47 (o contador real do escritório A) — vazamento.
  // Depois da correção, o firm_id não bate, então a leitura não encontra a linha e o
  // contador reportado ao chamador (de outro tenant) é 0, não o valor real de outro tenant.
  assert.equal(result.viewCount, 0, 'não deve retornar o view_count real de outro escritório');

  // E a escrita continua protegida: o documento do escritório A não foi alterado por um
  // request autenticado como escritório B.
  assert.equal(tables.documents[0].view_count, 47, 'contador do escritório A não deve mudar por request de outro escritório');
});

test('recordView continua funcionando normalmente quando firmId corresponde ao dono real do documento', async () => {
  const tables = {
    documents: [{ id: 'doc-1', firm_id: 'firm-A', view_count: 3, first_viewed_at: '2026-01-01T00:00:00.000Z' }],
    content_views: [],
  };
  const { recordView } = setup(tables);

  const result = await recordView({
    firmId: 'firm-A',
    clientId: 'client-A-1',
    entityType: 'DOCUMENT',
    entityId: 'doc-1',
    viewerRole: 'CLIENT',
    viewerId: 'client-A-1',
    viewerName: 'Cliente A',
    ipAddress: '1.2.3.4',
    userAgent: 'test-agent',
  });

  assert.equal(result.viewCount, 4, 'contador do próprio escritório continua incrementando normalmente');
  assert.equal(tables.documents[0].view_count, 4);
});
