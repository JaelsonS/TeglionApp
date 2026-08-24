const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const accountingServiceGroupsRepository = require('../../db/supabase/repositories/accounting-service-groups.repository');
const accountingServiceOptionsRepository = require('../../db/supabase/repositories/accounting-service-options.repository');
const accountingServicesService = require('./accounting-services.service');

const FIRM = 'firm-a';
const PARENT = { id: 'parent-1', firmId: FIRM, name: 'Consultoria Fiscal', isActive: true };
const CHILD_A = {
  id: 'child-a',
  firmId: FIRM,
  name: 'Individual',
  durationMinutes: 60,
  priceCents: 5000,
  isActive: true,
  isPubliclyListed: true,
  slug: 'individual',
  requiresBooking: true,
};
const CHILD_B = {
  id: 'child-b',
  firmId: FIRM,
  name: 'Empresarial',
  durationMinutes: 90,
  priceCents: 8000,
  isActive: true,
  isPubliclyListed: true,
  slug: 'empresarial',
  requiresBooking: true,
};

function resetMocks() {
  mock.restoreAll();
  mock.method(accountingServiceGroupsRepository, 'listByFirm', async () => []);
  mock.method(accountingServiceGroupsRepository, 'findByIdForFirm', async () => null);
  mock.method(accountingServiceOptionsRepository, 'listByFirm', async () => []);
  mock.method(accountingServiceOptionsRepository, 'listByParent', async () => []);
  mock.method(accountingServiceOptionsRepository, 'listParentIdsForChild', async () => []);
  mock.method(accountingServiceOptionsRepository, 'replaceForParent', async (_f, _p, ids) =>
    ids.map((id, i) => ({ parentServiceId: PARENT.id, childServiceId: id, firmId: FIRM, sortOrder: i })),
  );
}

test('setServiceOptions: serviço sem opções (lista vazia) limpa vínculos', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => PARENT);
  let replaced = null;
  mock.method(accountingServiceOptionsRepository, 'replaceForParent', async (_f, _p, ids) => {
    replaced = ids;
    return [];
  });
  const out = await accountingServicesService.setServiceOptions({
    firmId: FIRM,
    parentServiceId: PARENT.id,
    optionServiceIds: [],
  });
  assert.deepEqual(out, []);
  assert.deepEqual(replaced, []);
});

test('setServiceOptions: adiciona opções ordenadas com dados vivos', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => PARENT);
  mock.method(accountingServicesRepository, 'findByIdsForFirm', async (ids) => {
    assert.deepEqual(ids, [CHILD_A.id, CHILD_B.id]);
    return [CHILD_A, CHILD_B];
  });
  const out = await accountingServicesService.setServiceOptions({
    firmId: FIRM,
    parentServiceId: PARENT.id,
    optionServiceIds: [CHILD_A.id, CHILD_B.id, CHILD_A.id],
  });
  assert.deepEqual(out, [CHILD_A.id, CHILD_B.id]);
});

test('setServiceOptions: rejeita auto-referência', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => PARENT);
  await assert.rejects(
    () =>
      accountingServicesService.setServiceOptions({
        firmId: FIRM,
        parentServiceId: PARENT.id,
        optionServiceIds: [PARENT.id],
      }),
    (err) => err.statusCode === 400 && err.details?.code === 'OPTION_SELF_REF',
  );
});

test('setServiceOptions: rejeita serviço inexistente / outra firma', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => PARENT);
  mock.method(accountingServicesRepository, 'findByIdsForFirm', async () => [CHILD_A]);
  await assert.rejects(
    () =>
      accountingServicesService.setServiceOptions({
        firmId: FIRM,
        parentServiceId: PARENT.id,
        optionServiceIds: [CHILD_A.id, 'foreign-id'],
      }),
    (err) => err.statusCode === 400 && err.details?.code === 'OPTION_NOT_FOUND',
  );
});

test('setServiceOptions: rejeita ciclo / profundidade > 1 (child já é parent)', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => PARENT);
  mock.method(accountingServicesRepository, 'findByIdsForFirm', async () => [CHILD_A]);
  mock.method(accountingServiceOptionsRepository, 'listByFirm', async () => [
    { parentServiceId: CHILD_A.id, childServiceId: CHILD_B.id, firmId: FIRM, sortOrder: 0 },
  ]);
  await assert.rejects(
    () =>
      accountingServicesService.setServiceOptions({
        firmId: FIRM,
        parentServiceId: PARENT.id,
        optionServiceIds: [CHILD_A.id],
      }),
    (err) => err.statusCode === 400 && err.details?.code === 'OPTION_CYCLE',
  );
});

test('setServiceOptions: rejeita parent que já é opção de outra oferta', async () => {
  resetMocks();
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => PARENT);
  mock.method(accountingServiceOptionsRepository, 'listParentIdsForChild', async () => ['other-parent']);
  await assert.rejects(
    () =>
      accountingServicesService.setServiceOptions({
        firmId: FIRM,
        parentServiceId: PARENT.id,
        optionServiceIds: [CHILD_A.id],
      }),
    (err) => err.statusCode === 400 && err.details?.code === 'OPTION_DEPTH',
  );
});

test('attachOptionsToServices: devolve dados vivos do filho (sem cópia estática)', async () => {
  resetMocks();
  mock.method(accountingServiceOptionsRepository, 'listByFirm', async () => [
    { parentServiceId: PARENT.id, childServiceId: CHILD_A.id, firmId: FIRM, sortOrder: 0 },
  ]);
  mock.method(accountingServicesRepository, 'findByIdsForFirm', async () => [
    { ...CHILD_A, priceCents: 5500, name: 'Individual actualizado' },
  ]);
  const [item] = await accountingServicesService.attachOptionsToServices(FIRM, [PARENT]);
  assert.deepEqual(item.optionServiceIds, [CHILD_A.id]);
  assert.equal(item.options[0].priceCents, 5500);
  assert.equal(item.options[0].name, 'Individual actualizado');
});
