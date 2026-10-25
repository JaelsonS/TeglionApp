const test = require('node:test');
const assert = require('node:assert/strict');

require('../../../test/ensure-test-env');

// O repositório faz `const { getSupabaseAdmin } = require('../client')` no topo,
// por isso o stub tem de entrar no require.cache ANTES de o módulo ser carregado.
let activeFake = null;
const clientPath = require.resolve('../client', { paths: [__dirname] });
require.cache[clientPath] = {
  id: clientPath,
  filename: clientPath,
  loaded: true,
  exports: { getSupabaseAdmin: () => activeFake },
};
const repo = require('./accounting-services.repository');
delete require.cache[clientPath];

/**
 * Fake mínimo do query builder Supabase para `accounting_services`, com uma
 * tabela em memória. Regista os filtros aplicados para podermos afirmar que
 * TODA a escrita/leitura por id é também restringida por `firm_id` (o backend
 * usa service_role, logo o RLS não protege — a aplicação tem de o fazer).
 */
function createFakeSupabase(rows) {
  const calls = [];
  return {
    calls,
    from(table) {
      assert.equal(table, 'accounting_services');
      const filters = [];
      let mode = 'select';
      let payload = null;
      const matches = () => rows.filter((r) => filters.every(([f, v]) => r[f] === v));
      const builder = {
        select() {
          return builder;
        },
        update(p) {
          mode = 'update';
          payload = p;
          return builder;
        },
        delete() {
          mode = 'delete';
          return builder;
        },
        eq(field, value) {
          filters.push([field, value]);
          return builder;
        },
        in() {
          return builder;
        },
        order() {
          return builder;
        },
        not() {
          return builder;
        },
        async maybeSingle() {
          calls.push({ mode, filters: [...filters], payload });
          if (mode === 'update') {
            const affected = matches();
            affected.forEach((r) => Object.assign(r, payload));
            return { data: affected[0] || null, error: null };
          }
          return { data: matches()[0] || null, error: null };
        },
        then(resolve) {
          calls.push({ mode, filters: [...filters], payload });
          if (mode === 'delete') {
            const affected = matches();
            affected.forEach((r) => rows.splice(rows.indexOf(r), 1));
            return resolve({ data: null, error: null });
          }
          return resolve({ data: matches(), error: null });
        },
      };
      return builder;
    },
  };
}

function seedRows() {
  return [
    { id: 'svc-a', firm_id: 'firm-a', name: 'IRS', description: '<p>Firm A</p>', image_url: null },
    { id: 'svc-b', firm_id: 'firm-b', name: 'IVA', description: '<p>Firm B</p>', image_url: null },
  ];
}

test('updateRow: grava description (trim) na coluna `description` e filtra por id E firm_id', async () => {
  const rows = seedRows();
  const fake = createFakeSupabase(rows);
  activeFake = fake;

  const updated = await repo.updateRow('svc-a', 'firm-a', { description: '  <p>Nova descrição</p>  ' });

  const call = fake.calls.find((c) => c.mode === 'update');
  assert.ok(call, 'houve um UPDATE');
  assert.deepEqual(
    call.filters.sort(),
    [
      ['firm_id', 'firm-a'],
      ['id', 'svc-a'],
    ].sort(),
  );
  assert.equal(call.payload.description, '<p>Nova descrição</p>');
  assert.ok(call.payload.updated_at, 'updated_at é tocado');
  assert.equal(Object.prototype.hasOwnProperty.call(call.payload, 'name'), false, 'não reescreve campos não enviados');
  assert.equal(updated.description, '<p>Nova descrição</p>');
  assert.equal(rows[0].description, '<p>Nova descrição</p>');
  activeFake = null;
});

test('updateRow: Firm B não consegue alterar a linha da Firm A pelo id (0 linhas afectadas, devolve null)', async () => {
  const rows = seedRows();
  const fake = createFakeSupabase(rows);
  activeFake = fake;

  const result = await repo.updateRow('svc-a', 'firm-b', { description: '<p>intrusão</p>' });

  assert.equal(result, null);
  assert.equal(rows[0].description, '<p>Firm A</p>', 'linha da Firm A intacta');
  activeFake = null;
});

test('findByIdForFirm / deleteRow: sempre restringidos por firm_id', async () => {
  const rows = seedRows();
  const fake = createFakeSupabase(rows);
  activeFake = fake;

  assert.equal(await repo.findByIdForFirm('svc-a', 'firm-b'), null);
  assert.equal((await repo.findByIdForFirm('svc-a', 'firm-a')).description, '<p>Firm A</p>');

  await repo.deleteRow('svc-a', 'firm-b');
  assert.equal(rows.length, 2, 'delete cross-tenant não apaga nada');

  for (const call of fake.calls) {
    assert.ok(
      call.filters.some(([f]) => f === 'firm_id'),
      `operação ${call.mode} sem filtro firm_id: ${JSON.stringify(call.filters)}`,
    );
  }
  activeFake = null;
});

test('map: description devolvida tal como está na coluna (sem defaults que a substituam)', () => {
  const mapped = repo.map({ id: 'x', firm_id: 'f', name: 'N', description: '<p>ok</p>' });
  assert.equal(mapped.description, '<p>ok</p>');
  const mappedNull = repo.map({ id: 'x', firm_id: 'f', name: 'N', description: null });
  assert.equal(mappedNull.description, null);
});
