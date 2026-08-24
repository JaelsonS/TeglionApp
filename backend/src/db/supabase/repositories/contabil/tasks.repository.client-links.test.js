const test = require('node:test');
const assert = require('node:assert/strict');

require('../../../../test/ensure-test-env');

// Regressão do ROADMAP Fase 1: "uma tarefa relacionada a vários clientes deve aparecer
// corretamente no contexto de cada cliente". Antes desta mudança, listClientTasks (usado
// na ficha do cliente) filtrava só por client_tasks.client_id -- uma tarefa com vários
// clientes só aparecia na ficha do primeiro (legado), nunca nos demais.

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
      const matches = () => rows.filter((r) => filters.every(([f, op, v]) => {
        if (op === 'eq') return r[f] === v;
        if (op === 'in') return v.includes(r[f]);
        if (op === 'neq') return r[f] !== v;
        return true;
      }));
      const builder = {
        select() { return builder; },
        insert(payload) {
          const list = Array.isArray(payload) ? payload : [payload];
          const inserted = list.map((p) => {
            const row = { id: p.id || `gen-${autoId++}`, created_at: new Date().toISOString(), ...p };
            rows.push(row);
            return row;
          });
          pendingInsert = Array.isArray(payload) ? inserted : inserted[0];
          return builder;
        },
        eq(f, v) { filters.push([f, 'eq', v]); return builder; },
        in(f, v) { filters.push([f, 'in', v]); return builder; },
        neq(f, v) { filters.push([f, 'neq', v]); return builder; },
        order() { return builder; },
        async single() {
          if (pendingInsert && !Array.isArray(pendingInsert)) return { data: pendingInsert, error: null };
          return { data: matches()[0] || null, error: null };
        },
        async maybeSingle() {
          if (pendingInsert && !Array.isArray(pendingInsert)) return { data: pendingInsert, error: null };
          return { data: matches()[0] || null, error: null };
        },
        then(resolve) {
          resolve({ data: matches(), error: null });
        },
      };
      return builder;
    },
  };
}

function setup(tables) {
  const fakeSb = createFakeSupabase(tables);
  stubModule('../../client', { getSupabaseAdmin: () => fakeSb, isSupabaseConfigured: () => true });
  delete require.cache[require.resolve('./shared')];
  delete require.cache[require.resolve('./tasks.repository')];
  return require('./tasks.repository');
}

test('listClientTasks mostra a tarefa na ficha de CADA cliente vinculado, não só do client_id legado', async () => {
  const tables = {
    client_tasks: [
      {
        id: 'task-1',
        firm_id: 'firm-a',
        client_id: 'client-a',
        task_type: 'manual_task',
        title: 'Solicitar documentos IRS',
        status: 'OPEN',
        due_date: null,
      },
    ],
    client_task_client_links: [
      { client_task_id: 'task-1', client_id: 'client-a', firm_id: 'firm-a' },
      { client_task_id: 'task-1', client_id: 'client-b', firm_id: 'firm-a' },
    ],
  };
  const { listClientTasks } = setup(tables);

  const forClientA = await listClientTasks({ firmId: 'firm-a', clientId: 'client-a' });
  const forClientB = await listClientTasks({ firmId: 'firm-a', clientId: 'client-b' });

  assert.equal(forClientA.length, 1, 'aparece na ficha do cliente A (legado)');
  assert.equal(forClientB.length, 1, 'também aparece na ficha do cliente B (só vinculado via M2M)');
});

test('listClientTasks não mostra tarefa de um cliente sem vínculo nenhum', async () => {
  const tables = {
    client_tasks: [
      { id: 'task-1', firm_id: 'firm-a', client_id: 'client-a', task_type: 'manual_task', title: 'Tarefa', status: 'OPEN', due_date: null },
    ],
    client_task_client_links: [{ client_task_id: 'task-1', client_id: 'client-a', firm_id: 'firm-a' }],
  };
  const { listClientTasks } = setup(tables);

  const forOtherClient = await listClientTasks({ firmId: 'firm-a', clientId: 'client-z' });

  assert.equal(forOtherClient.length, 0);
});

// F-08 (auditoria de release final): createClientTask escrevia client_tasks
// mas não o vínculo M2M — a tarefa ficava invisível em listClientTasks (usado
// na ficha do cliente) mesmo tendo client_id preenchido. Corrigido; estes
// testes cobrem exactamente o gap identificado, que não tinha teste dedicado.
test('createClientTask grava o vínculo M2M além do client_id legado', async () => {
  const tables = { client_tasks: [], client_task_client_links: [] };
  const { createClientTask, listClientTasks } = setup(tables);

  const created = await createClientTask({
    firmId: 'firm-a',
    clientId: 'client-a',
    title: 'Solicitar comprovativo de morada',
  });

  assert.equal(tables.client_tasks[0].client_id, 'client-a', 'ponteiro legado continua preenchido');
  const links = tables.client_task_client_links.filter((l) => l.client_task_id === created.id);
  assert.equal(links.length, 1);
  assert.equal(links[0].client_id, 'client-a');
  assert.equal(links[0].firm_id, 'firm-a');
  assert.deepEqual(created.clientIds, ['client-a']);

  const forClientA = await listClientTasks({ firmId: 'firm-a', clientId: 'client-a' });
  assert.equal(forClientA.length, 1, 'a tarefa criada aparece de imediato na ficha do cliente via M2M');
});

test('createClientTask sem clientId não grava vínculo nenhum (tarefa interna, sem regressão)', async () => {
  const tables = { client_tasks: [], client_task_client_links: [] };
  const { createClientTask } = setup(tables);

  const created = await createClientTask({ firmId: 'firm-a', title: 'Tarefa interna do escritório' });

  assert.equal(tables.client_tasks[0].client_id ?? null, null);
  assert.deepEqual(tables.client_task_client_links, []);
  assert.deepEqual(created.clientIds, []);
});
