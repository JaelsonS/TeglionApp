require('../../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');

const tasksRepo = require('../../db/supabase/repositories/tasks.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const activityService = require('../../services/activity/activity.service');

// Regression tests para o bug: tarefas criadas/duplicadas pelo escritório desapareciam
// da listagem de "Tarefas Manuais" porque ficavam gravadas com task_type != 'internal_task'
// (o frontend só mostra task_type === 'internal_task', ver FirmTasksWorkspacePage.tsx).
const workspace = require('./tasks-workspace.service');

function withMock(obj, key, impl, fn) {
  const original = obj[key];
  obj[key] = impl;
  return fn().finally(() => {
    obj[key] = original;
  });
}

test('duplicateTask preserva task_type e period_month da tarefa de origem', async () => {
  const insertedRows = [];
  await withMock(tasksRepo, 'findTaskById', async () => ({
    id: 'task-1',
    clientId: 'client-1',
    obligationId: null,
    title: 'Conciliação bancária',
    description: null,
    status: 'TODO',
    priority: 'NORMAL',
    dueDate: '2026-07-20',
    assigneeId: null,
    tags: [],
    taskType: 'internal_task',
  }), () =>
    withMock(tasksRepo, 'insertTask', async (row) => {
      insertedRows.push(row);
      return { id: 'task-2', ...row };
    }, async () => {
      const { task } = await workspace.duplicateTask({ firmId: 'firm-1', taskId: 'task-1', actor: { id: 'user-1' } });
      assert.equal(insertedRows.length, 1);
      assert.equal(insertedRows[0].task_type, 'internal_task');
      assert.equal(insertedRows[0].period_month, '2026-07');
      assert.equal(task.id, 'task-2');
    }),
  );
});

test('duplicateTask cai para internal_task quando a origem não tem taskType definido', async () => {
  const insertedRows = [];
  await withMock(tasksRepo, 'findTaskById', async () => ({
    id: 'task-1',
    clientId: 'client-1',
    title: 'Tarefa antiga',
    status: 'TODO',
    priority: 'NORMAL',
    dueDate: null,
    taskType: undefined,
  }), () =>
    withMock(tasksRepo, 'insertTask', async (row) => {
      insertedRows.push(row);
      return { id: 'task-2', ...row };
    }, async () => {
      await workspace.duplicateTask({ firmId: 'firm-1', taskId: 'task-1', actor: { id: 'user-1' } });
      assert.equal(insertedRows[0].task_type, 'internal_task');
      assert.equal(insertedRows[0].period_month, null);
    }),
  );
});

test('createTask nunca rebaixa task_type mesmo quando o fallback de schema legado é accionado', async () => {
  const insertedRows = [];
  let call = 0;

  await withMock(clientsRepository, 'findClientById', async () => ({ id: 'client-1', displayName: 'Cliente Teste' }), () =>
    withMock(activityService, 'recordActivity', async () => {}, () =>
      withMock(tasksRepo, 'insertTask', async (row) => {
        call += 1;
        insertedRows.push(row);
        if (call === 1) {
          throw new Error('column "client_tasks.period_month" does not exist');
        }
        return { id: 'task-1', ...row };
      }, async () => {
        const { task } = await workspace.createTask({
          firmId: 'firm-1',
          actor: { id: 'user-1', name: 'Escritório' },
          payload: {
            clientId: 'client-1',
            title: 'Nova tarefa manual',
            taskType: 'internal_task',
            status: 'TODO',
          },
        });

        assert.equal(insertedRows.length, 2, 'deve tentar o insert normal e depois o fallback');
        assert.equal(insertedRows[0].task_type, 'internal_task');
        assert.equal(insertedRows[1].task_type, 'internal_task', 'fallback não pode rebaixar para manual_task');
        assert.equal(task.task_type, 'internal_task');
      }),
    ),
  );
});

test('createTask propaga erros não relacionados a colunas legadas (falha alto, não esconde a tarefa)', async () => {
  await withMock(clientsRepository, 'findClientById', async () => ({ id: 'client-1', displayName: 'Cliente Teste' }), () =>
    withMock(tasksRepo, 'insertTask', async () => {
      throw new Error('permission denied for table client_tasks');
    }, async () => {
      await assert.rejects(
        () =>
          workspace.createTask({
            firmId: 'firm-1',
            actor: { id: 'user-1', name: 'Escritório' },
            payload: { clientId: 'client-1', title: 'Nova tarefa manual', taskType: 'internal_task', status: 'TODO' },
          }),
        /permission denied/,
      );
    }),
  );
});

test('createTask com clientIds (multi-cliente) valida todos os clientes e repassa o conjunto pro insertTask', async () => {
  const insertedRows = [];
  const insertedOpts = [];
  const knownClients = new Set(['client-a', 'client-b']);

  await withMock(
    clientsRepository,
    'findClientById',
    async (_firmId, clientId) => (knownClients.has(clientId) ? { id: clientId, displayName: 'Cliente' } : null),
    () =>
      withMock(activityService, 'recordActivity', async () => {}, () =>
        withMock(
          tasksRepo,
          'insertTask',
          async (row, opts) => {
            insertedRows.push(row);
            insertedOpts.push(opts);
            return { id: 'task-multi', clientIds: opts?.clientIds || [], ...row };
          },
          async () => {
            const { task } = await workspace.createTask({
              firmId: 'firm-1',
              actor: { id: 'user-1', name: 'Escritório' },
              payload: {
                clientIds: ['client-a', 'client-b'],
                title: 'Solicitar documentos IRS',
                taskType: 'internal_task',
                status: 'TODO',
              },
            });

            assert.equal(insertedRows[0].client_id, 'client-a', 'ponteiro legado = primeiro cliente do conjunto');
            assert.deepEqual(insertedOpts[0].clientIds, ['client-a', 'client-b']);
            assert.deepEqual(task.clientIds.sort(), ['client-a', 'client-b']);
          },
        ),
      ),
  );
});

test('createTask com clientIds rejeita quando algum cliente não existe (não cria a tarefa parcialmente)', async () => {
  const insertedRows = [];
  await withMock(clientsRepository, 'findClientById', async (_firmId, clientId) => (clientId === 'client-a' ? { id: 'client-a' } : null), () =>
    withMock(tasksRepo, 'insertTask', async (row) => {
      insertedRows.push(row);
      return { id: 'task-x', ...row };
    }, async () => {
      await assert.rejects(
        () =>
          workspace.createTask({
            firmId: 'firm-1',
            actor: { id: 'user-1' },
            payload: { clientIds: ['client-a', 'client-inexistente'], title: 'Tarefa', taskType: 'internal_task' },
          }),
        /Cliente não encontrado/,
      );
      assert.equal(insertedRows.length, 0, 'não deve inserir nada se algum cliente do conjunto não existir');
    }),
  );
});

test('createTask rejeita recorrência quando há mais de um cliente vinculado', async () => {
  await withMock(clientsRepository, 'findClientById', async (_firmId, clientId) => ({ id: clientId }), () =>
    withMock(tasksRepo, 'insertTask', async () => {
      throw new Error('insertTask não deveria ser chamado');
    }, async () => {
      await assert.rejects(
        () =>
          workspace.createTask({
            firmId: 'firm-1',
            actor: { id: 'user-1' },
            payload: {
              clientIds: ['client-a', 'client-b'],
              title: 'Tarefa recorrente',
              taskType: 'internal_task',
              recurrenceRule: { frequency: 'MONTHLY' },
            },
          }),
        /exatamente um cliente/,
      );
    }),
  );
});

test('createTask aceita tarefa interna sem cliente da carteira', async () => {
  const insertedRows = [];
  await withMock(activityService, 'recordActivity', async () => {}, () =>
    withMock(tasksRepo, 'insertTask', async (row) => {
      insertedRows.push(row);
      return { id: 'task-office', clientId: row.client_id, ...row };
    }, async () => {
      const { task } = await workspace.createTask({
        firmId: 'firm-1',
        actor: { id: 'user-1', name: 'Escritório' },
        payload: { title: 'Tarefa interna', taskType: 'internal_task', status: 'TODO' },
      });
      assert.equal(insertedRows.length, 1);
      assert.equal(insertedRows[0].client_id, null);
      assert.equal(task.id, 'task-office');
    }),
  );
});
