const test = require('node:test');
const assert = require('node:assert/strict');

require('../../../test/ensure-test-env');

// Regressão do ROADMAP Fase 1 (tarefas multi-cliente): client_tasks.client_id era uma FK
// singular; client_task_client_links passa a ser a fonte de verdade para "quais clientes
// esta tarefa tem", com client_id mantido como ponteiro legado (primeiro cliente do
// conjunto, ou NULL). Este arquivo testa isso no nível do repositório, com um Supabase
// falso em memória (sem rede, sem staging real).

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

/**
 * Fake mínimo do Supabase, com tabelas em memória. Suporta o subconjunto de operações que
 * tasks.repository.js realmente usa: select/eq/in/order + insert/update/delete, sempre
 * "thenable" (para os pontos onde o código faz `await sb.from(...).delete().eq().eq()`
 * sem `.select()`/`.single()` no fim).
 */
function createFakeSupabase(tables) {
  let autoId = 1;
  return {
    from(tableName) {
      const rows = tables[tableName] || (tables[tableName] = []);
      const filters = [];
      let pendingInsert = null;
      let pendingUpdate = null;
      let pendingDelete = false;
      let orderField = null;

      const matches = () => rows.filter((r) => filters.every(([f, op, v]) => {
        if (op === 'eq') return r[f] === v;
        if (op === 'in') return v.includes(r[f]);
        if (op === 'neq') return r[f] !== v;
        return true;
      }));

      const builder = {
        select() {
          return builder;
        },
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
        update(patch) {
          pendingUpdate = patch;
          return builder;
        },
        delete() {
          pendingDelete = true;
          return builder;
        },
        eq(field, value) {
          filters.push([field, 'eq', value]);
          return builder;
        },
        in(field, values) {
          filters.push([field, 'in', values]);
          return builder;
        },
        neq(field, value) {
          filters.push([field, 'neq', value]);
          return builder;
        },
        order(field) {
          orderField = field;
          return builder;
        },
        range() {
          return builder;
        },
        applyPending() {
          if (pendingDelete) {
            const toDelete = new Set(matches());
            const remaining = rows.filter((r) => !toDelete.has(r));
            rows.length = 0;
            rows.push(...remaining);
            return [];
          }
          if (pendingUpdate) {
            const affected = matches();
            affected.forEach((r) => Object.assign(r, pendingUpdate));
            return affected;
          }
          return matches();
        },
        async single() {
          if (pendingInsert && !Array.isArray(pendingInsert)) return { data: pendingInsert, error: null };
          const result = builder.applyPending();
          return { data: result[0] || null, error: null };
        },
        async maybeSingle() {
          if (pendingInsert && !Array.isArray(pendingInsert)) return { data: pendingInsert, error: null };
          const result = builder.applyPending();
          return { data: result[0] || null, error: null };
        },
        then(resolve) {
          let result = builder.applyPending();
          if (orderField) result = [...result].sort((a, b) => (a[orderField] > b[orderField] ? 1 : -1));
          resolve({ data: result, error: null, count: result.length });
        },
      };
      return builder;
    },
  };
}

function setup(tables) {
  const fakeSb = createFakeSupabase(tables);
  stubModule('../client', { getSupabaseAdmin: () => fakeSb, isSupabaseConfigured: () => true });
  delete require.cache[require.resolve('./tasks.repository')];
  return require('./tasks.repository');
}

test('insertTask com clientIds explícito grava client_id legado (primeiro da lista) + todos os vínculos M2M', async () => {
  const tables = { client_tasks: [], client_task_client_links: [] };
  const { insertTask } = setup(tables);

  const task = await insertTask(
    { firm_id: 'firm-a', title: 'Solicitar documentos IRS', status: 'TODO', client_id: null },
    { clientIds: ['client-a', 'client-b', 'client-c'] },
  );

  assert.equal(tables.client_tasks[0].client_id, 'client-a', 'client_id legado deve ser o primeiro da lista');
  const links = tables.client_task_client_links.filter((l) => l.client_task_id === task.id);
  assert.deepEqual(
    links.map((l) => l.client_id).sort(),
    ['client-a', 'client-b', 'client-c'],
    'os 3 clientes devem ter vínculo M2M',
  );
  assert.deepEqual(task.clientIds.sort(), ['client-a', 'client-b', 'client-c']);
});

test('insertTask sem clientIds (chamador legado, ex.: scheduler/automação) sincroniza M2M a partir de row.client_id', async () => {
  const tables = { client_tasks: [], client_task_client_links: [] };
  const { insertTask } = setup(tables);

  const task = await insertTask({ firm_id: 'firm-a', title: 'Lembrete automático', status: 'TODO', client_id: 'client-x' });

  assert.equal(tables.client_tasks[0].client_id, 'client-x');
  const links = tables.client_task_client_links.filter((l) => l.client_task_id === task.id);
  assert.deepEqual(links.map((l) => l.client_id), ['client-x']);
});

test('setTaskClients substitui o conjunto (delete-then-insert) e sincroniza client_id legado', async () => {
  const tables = {
    client_tasks: [{ id: 'task-1', firm_id: 'firm-a', client_id: 'client-a', title: 'Tarefa', status: 'TODO' }],
    client_task_client_links: [
      { client_task_id: 'task-1', client_id: 'client-a', firm_id: 'firm-a' },
      { client_task_id: 'task-1', client_id: 'client-b', firm_id: 'firm-a' },
    ],
  };
  const { setTaskClients } = setup(tables);

  const result = await setTaskClients('task-1', 'firm-a', ['client-c']);

  assert.deepEqual(result.clientIds, ['client-c']);
  assert.equal(tables.client_tasks[0].client_id, 'client-c');
  const remainingLinks = tables.client_task_client_links.filter((l) => l.client_task_id === 'task-1');
  assert.deepEqual(remainingLinks.map((l) => l.client_id), ['client-c']);
});

test('setTaskClients com lista vazia limpa o vínculo e deixa client_id legado NULL (tarefa vira "sem cliente")', async () => {
  const tables = {
    client_tasks: [{ id: 'task-1', firm_id: 'firm-a', client_id: 'client-a', title: 'Tarefa', status: 'TODO' }],
    client_task_client_links: [{ client_task_id: 'task-1', client_id: 'client-a', firm_id: 'firm-a' }],
  };
  const { setTaskClients } = setup(tables);

  const result = await setTaskClients('task-1', 'firm-a', []);

  assert.deepEqual(result.clientIds, []);
  assert.equal(tables.client_tasks[0].client_id, null);
  assert.equal(tables.client_task_client_links.filter((l) => l.client_task_id === 'task-1').length, 0);
});

test('listTasks({clientId}) encontra a tarefa mesmo quando esse cliente NÃO é o client_id legado (M2M é fonte de verdade)', async () => {
  const tables = {
    client_tasks: [
      { id: 'task-1', firm_id: 'firm-a', client_id: 'client-a', title: 'Tarefa multi-cliente', status: 'TODO', updated_at: '2026-01-01' },
    ],
    client_task_client_links: [
      { client_task_id: 'task-1', client_id: 'client-a', firm_id: 'firm-a' },
      { client_task_id: 'task-1', client_id: 'client-b', firm_id: 'firm-a' },
    ],
  };
  const { listTasks } = setup(tables);

  // client-b é o SEGUNDO cliente do vínculo, não o client_id legado (client-a). Antes desta
  // mudança, filtrar listTasks({clientId: 'client-b'}) não encontrava nada, porque o filtro
  // batia só contra a coluna client_id.
  const result = await listTasks('firm-a', { clientId: 'client-b' });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, 'task-1');
  assert.deepEqual(result.items[0].clientIds.sort(), ['client-a', 'client-b']);
});

test('listTasks({clientId}) de um cliente de OUTRO escritório não vaza tarefa (isolamento multi-tenant)', async () => {
  const tables = {
    client_tasks: [{ id: 'task-1', firm_id: 'firm-a', client_id: 'client-a', title: 'Tarefa do firm A', status: 'TODO', updated_at: '2026-01-01' }],
    client_task_client_links: [{ client_task_id: 'task-1', client_id: 'client-a', firm_id: 'firm-a' }],
  };
  const { listTasks } = setup(tables);

  // Mesmo client_id, mas consultado sob o firm_id errado (firm-b) -- listTaskIdsForClient já
  // filtra por firm_id, então isso não deve retornar a tarefa do firm-a.
  const result = await listTasks('firm-b', { clientId: 'client-a' });

  assert.equal(result.items.length, 0);
});

test('findTaskById retorna clientIds com todos os clientes vinculados', async () => {
  const tables = {
    client_tasks: [{ id: 'task-1', firm_id: 'firm-a', client_id: 'client-a', title: 'Tarefa', status: 'TODO' }],
    client_task_client_links: [
      { client_task_id: 'task-1', client_id: 'client-a', firm_id: 'firm-a' },
      { client_task_id: 'task-1', client_id: 'client-b', firm_id: 'firm-a' },
    ],
  };
  const { findTaskById } = setup(tables);

  const task = await findTaskById('firm-a', 'task-1');

  assert.deepEqual(task.clientIds.sort(), ['client-a', 'client-b']);
});
