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
  return {
    from(tableName) {
      const rows = tables[tableName] || (tables[tableName] = []);
      const filters = [];
      const matches = () => rows.filter((r) => filters.every(([f, op, v]) => {
        if (op === 'eq') return r[f] === v;
        if (op === 'in') return v.includes(r[f]);
        if (op === 'neq') return r[f] !== v;
        return true;
      }));
      const builder = {
        select() { return builder; },
        eq(f, v) { filters.push([f, 'eq', v]); return builder; },
        in(f, v) { filters.push([f, 'in', v]); return builder; },
        neq(f, v) { filters.push([f, 'neq', v]); return builder; },
        order() { return builder; },
        async maybeSingle() {
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
