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
          if (pendingUpdate) {
            const affected = matches();
            affected.forEach((r) => Object.assign(r, pendingUpdate));
            return { data: affected[0] || null, error: null };
          }
          const found = pendingInsert || matches()[0] || null;
          return { data: found, error: null };
        },
        async single() {
          return builder.maybeSingle();
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
  // contabil/shared.js desestrutura getSupabaseAdmin no carregamento do módulo —
  // preciso invalidar a cadeia inteira para cada teste apanhar o stub actual.
  delete require.cache[require.resolve('../../db/supabase/repositories/contabil/shared')];
  delete require.cache[require.resolve('../../db/supabase/repositories/contabil/documents.repository')];
  delete require.cache[require.resolve('../../db/supabase/repositories/contabil/obligations.repository')];
  delete require.cache[require.resolve('./view-tracking.service')];
  return require('./view-tracking.service');
}

test('recordView NÃO vaza view_count de outro escritório quando firmId não corresponde ao dono real do documento', async () => {
  const tables = {
    documents: [
      {
        id: 'doc-1',
        firm_id: 'firm-A',
        client_id: 'client-A-1',
        is_active: true,
        view_count: 47,
        first_viewed_at: '2026-01-01T00:00:00.000Z',
      },
    ],
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
  // Depois da correção, a entidade não é encontrada sob o firm_id do chamador — nem
  // sequer chega a registar uma visualização (result é null), muito menos expor o
  // contador real de outro tenant.
  assert.equal(result, null, 'não deve registar nem retornar nada para uma entidade de outro escritório');

  // E a escrita continua protegida: o documento do escritório A não foi alterado por um
  // request autenticado como escritório B.
  assert.equal(tables.documents[0].view_count, 47, 'contador do escritório A não deve mudar por request de outro escritório');
  assert.equal(tables.content_views.length, 0, 'nenhuma linha de content_views deve ser criada para entidade de outro escritório');
});

test('recordView continua funcionando normalmente quando firmId corresponde ao dono real do documento', async () => {
  const tables = {
    documents: [
      {
        id: 'doc-1',
        firm_id: 'firm-A',
        client_id: 'client-A-1',
        is_active: true,
        view_count: 3,
        first_viewed_at: '2026-01-01T00:00:00.000Z',
      },
    ],
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

// Regressão: recordView() gravava entityId directamente do req.params sem confirmar que
// pertence ao firmId/clientId do ator. Um cliente conseguia apontar entityId para um
// documento de OUTRO cliente da mesma firm, poluindo a trilha de actividade/analytics.
test('recordView rejeita entityId de um documento pertencente a outro cliente da mesma firm', async () => {
  const tables = {
    documents: [{ id: 'doc-1', firm_id: 'firm-A', client_id: 'client-A-OUTRO', is_active: true, view_count: 0 }],
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

  assert.equal(result, null, 'não deve registar visualização de um documento que não é do cliente autenticado');
  assert.equal(tables.content_views.length, 0);
});

// Regressão: endView() actualizava content_views só por `id`, sem confirmar que a
// visualização pertence ao firmId/viewerId de quem chama — permitia a um utilizador
// autenticado (de qualquer firm) alterar duration_seconds/view_ended_at de qualquer
// registo cujo UUID conseguisse obter.
test('endView não altera uma visualização que não pertence ao firmId/viewerId do chamador', async () => {
  const tables = {
    content_views: [{ id: 'view-1', firm_id: 'firm-A', viewer_id: 'client-A-1', duration_seconds: 0 }],
  };
  const { endView } = setup(tables);

  const result = await endView({
    viewId: 'view-1',
    durationSeconds: 999,
    firmId: 'firm-B',
    viewerId: 'client-B-attacker',
  });

  assert.equal(result, null, 'não deve conseguir reclamar/alterar uma visualização de outro tenant');
  assert.equal(tables.content_views[0].duration_seconds, 0, 'a visualização real não deve ter sido alterada');
});

test('endView actualiza normalmente quando firmId/viewerId correspondem ao dono da visualização', async () => {
  const tables = {
    content_views: [{ id: 'view-1', firm_id: 'firm-A', viewer_id: 'client-A-1', duration_seconds: 0 }],
  };
  const { endView } = setup(tables);

  const result = await endView({
    viewId: 'view-1',
    durationSeconds: 42,
    firmId: 'firm-A',
    viewerId: 'client-A-1',
  });

  assert.ok(result);
  assert.equal(tables.content_views[0].duration_seconds, 42);
});
