const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const groupsRepository = require('../../db/supabase/repositories/accounting-service-groups.repository');
const groupsService = require('./accounting-service-groups.service');

function resetMocks() {
  mock.restoreAll();
}

test('create: nome obrigatório', async () => {
  resetMocks();
  await assert.rejects(
    () => groupsService.create({ firmId: 'firm-x', payload: { name: '  ' } }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('create: rejeita nome muito longo', async () => {
  resetMocks();
  await assert.rejects(
    () => groupsService.create({ firmId: 'firm-x', payload: { name: 'x'.repeat(81) } }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('create: caminho feliz — cria ativo, público, sortOrder 0 por omissão', async () => {
  resetMocks();
  let created = null;
  mock.method(groupsRepository, 'createRow', async (args) => {
    created = args;
    return { id: 'group-1', ...args };
  });

  const { item } = await groupsService.create({ firmId: 'firm-x', payload: { name: 'Consultorias' } });

  assert.equal(created.firmId, 'firm-x');
  assert.equal(created.name, 'Consultorias');
  assert.equal(created.isActive, true);
  assert.equal(created.isPubliclyListed, true);
  assert.equal(created.sortOrder, 0);
  assert.equal(item.id, 'group-1');
});

test('create: nome duplicado na mesma firma vira erro 409, não propaga o erro cru do Postgres', async () => {
  resetMocks();
  mock.method(groupsRepository, 'createRow', async () => {
    const err = new Error('duplicate key value violates unique constraint "accounting_service_groups_firm_id_name_key"');
    err.code = '23505';
    throw err;
  });

  await assert.rejects(
    () => groupsService.create({ firmId: 'firm-x', payload: { name: 'Consultorias' } }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    },
  );
});

test('update: grupo inexistente (ou de outra firma) devolve 404, nunca chega a chamar updateRow', async () => {
  resetMocks();
  mock.method(groupsRepository, 'findByIdForFirm', async () => null);
  mock.method(groupsRepository, 'updateRow', async () => {
    throw new Error('não devia chegar a gravar');
  });

  await assert.rejects(
    () => groupsService.update({ firmId: 'firm-x', id: 'group-1', payload: { name: 'Novo nome' } }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('update: renomear, reordenar, ativar/desativar e mudar visibilidade pública, tudo junto', async () => {
  resetMocks();
  mock.method(groupsRepository, 'findByIdForFirm', async () => ({
    id: 'group-1',
    firmId: 'firm-x',
    name: 'Consultorias',
    isActive: true,
    isPubliclyListed: true,
    sortOrder: 0,
  }));
  let patchArg = null;
  mock.method(groupsRepository, 'updateRow', async (_id, _firmId, patch) => {
    patchArg = patch;
    return { id: 'group-1', ...patch };
  });

  await groupsService.update({
    firmId: 'firm-x',
    id: 'group-1',
    payload: { name: 'Consultoria Fiscal', sortOrder: 20, isActive: false, isPubliclyListed: false },
  });

  // updated_at é responsabilidade do repositório (mockado aqui), não do service -- o
  // patch que o service monta só carrega os campos que de fato mudaram.
  assert.deepEqual(patchArg, {
    name: 'Consultoria Fiscal',
    sortOrder: 20,
    isActive: false,
    isPubliclyListed: false,
  });
});

test('remove: grupo inexistente devolve 404, nunca chega a chamar deleteRow', async () => {
  resetMocks();
  mock.method(groupsRepository, 'findByIdForFirm', async () => null);
  mock.method(groupsRepository, 'deleteRow', async () => {
    throw new Error('não devia tentar apagar um grupo que não foi encontrado');
  });

  await assert.rejects(
    () => groupsService.remove({ firmId: 'firm-x', id: 'group-1' }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('remove: caminho feliz — apaga só dentro do escopo da firma (isolamento multi-tenant)', async () => {
  resetMocks();
  mock.method(groupsRepository, 'findByIdForFirm', async (id, firmId) =>
    id === 'group-1' && firmId === 'firm-a' ? { id: 'group-1', firmId: 'firm-a', name: 'Consultorias' } : null,
  );
  let deletedArgs = null;
  mock.method(groupsRepository, 'deleteRow', async (id, firmId) => {
    deletedArgs = { id, firmId };
  });

  const result = await groupsService.remove({ firmId: 'firm-a', id: 'group-1' });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(deletedArgs, { id: 'group-1', firmId: 'firm-a' });
});

test('remove: tentar apagar um grupo de OUTRA firma é bloqueado (cross-tenant)', async () => {
  resetMocks();
  // findByIdForFirm já filtra por firm_id na query real -- aqui simulamos o caso em que o
  // grupo existe (é de firm-b), mas o pedido veio autenticado como firm-a: não é encontrado.
  mock.method(groupsRepository, 'findByIdForFirm', async (id, firmId) =>
    id === 'group-1' && firmId === 'firm-b' ? { id: 'group-1', firmId: 'firm-b', name: 'Consultorias' } : null,
  );
  mock.method(groupsRepository, 'deleteRow', async () => {
    throw new Error('não devia tentar apagar um grupo de outra firma');
  });

  await assert.rejects(
    () => groupsService.remove({ firmId: 'firm-a', id: 'group-1' }),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});
