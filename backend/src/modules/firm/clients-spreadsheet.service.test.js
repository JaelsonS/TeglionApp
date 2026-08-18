require('../../test/ensure-test-env');

const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const accessesRepository = require('../../db/supabase/repositories/client-official-accesses.repository');
const entitlements = require('../entitlements/entitlements.service');
const stepUp = require('./step-up.service');
const service = require('./clients-spreadsheet.service');

const NIF = '123456789';

describe('clients-spreadsheet.service', () => {
  test('sanitizeCell bloqueia fórmulas de Excel', () => {
    assert.equal(service.sanitizeCell('=cmd|calc'), "'=cmd|calc");
    assert.equal(service.sanitizeCell('+1+1'), "'+1+1");
    assert.equal(service.sanitizeCell('@SUM(A1)'), "'@SUM(A1)");
    assert.equal(service.sanitizeCell('Ana Lda'), 'Ana Lda');
  });

  test('parseCsv usa ponto e vírgula e ignora linhas vazias', () => {
    const rows = service.parseCsv('nome;nif\nAna;123\n\n');
    assert.deepEqual(rows[0], ['nome', 'nif']);
    assert.deepEqual(rows[1], ['Ana', '123']);
    assert.equal(rows.length, 2);
  });

  test('parseCsv também lê vírgula quando o cabeçalho não tem ponto e vírgula', () => {
    const rows = service.parseCsv('nome,nif\nAna,123');
    assert.deepEqual(rows[0], ['nome', 'nif']);
    assert.deepEqual(rows[1], ['Ana', '123']);
  });

  test('buildTemplateCsv só tem cabeçalhos e senhas vazias', () => {
    const csv = service.buildTemplateCsv();
    assert.equal(csv.includes('at_senha'), true);
    assert.equal(csv.split(/\r?\n/).filter(Boolean).length, 1);
  });

  test('importCsv rejeita ZIP/xlsx', async () => {
    await assert.rejects(
      () =>
        service.importCsv({
          firmId: 'f',
          actorId: 'u',
          buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]),
        }),
      (err) => err.statusCode === 400 && err.details?.code === 'FILE_REJECTED',
    );
  });

  test('importCsv ignora células vazias e não pede step-up sem senhas', async () => {
    mock.restoreAll();
    mock.method(clientsRepository, 'listClients', async () => [
      {
        id: 'c1',
        taxId: NIF,
        displayName: 'Ana',
        metadata: { legalName: 'Ana Lda', notes: 'manter' },
      },
    ]);
    mock.method(clientsRepository, 'countClients', async () => 1);
    let patch = null;
    mock.method(clientsRepository, 'updateClient', async (_id, _firm, p) => {
      patch = p;
      return { id: 'c1', metadata: p.metadata };
    });
    mock.method(accessesRepository, 'findByPortalKey', async () => null);
    mock.method(stepUp, 'verifyStaffPassword', async () => {
      throw new Error('step-up não deveria ser chamado');
    });
    mock.method(entitlements, 'assertWithinLimit', async () => {});

    const csv = Buffer.from(`\uFEFFnome;nif;email;notas;at_senha\n;${NIF};;;\n`, 'utf8');
    const report = await service.importCsv({ firmId: 'f', actorId: 'u', buffer: csv });
    assert.equal(report.updated, 0);
    assert.equal(report.created, 0);
    assert.equal(report.skipped, 1);
    assert.equal(patch, null);
  });
});
