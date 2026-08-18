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

  test('Excel PT: exportar CSV, editar como o Excel, importar de volta', async () => {
    mock.restoreAll();
    const existing = {
      id: 'c1',
      taxId: NIF,
      displayName: 'Ana',
      email: 'ana@old.pt',
      phone: null,
      metadata: { legalName: 'Ana Lda', notes: 'manter' },
    };
    mock.method(clientsRepository, 'listClients', async () => [existing]);
    mock.method(clientsRepository, 'countClients', async () => 1);
    mock.method(accessesRepository, 'listUsernamesByFirm', async () => [
      { clientId: 'c1', portalKey: 'AT_FINANCAS', username: '123456789' },
    ]);

    const exported = await service.buildExportCsv({ firmId: 'f' });
    assert.equal(exported.charCodeAt(0) === 0xfeff || exported.startsWith('\uFEFF'), true);
    assert.equal(exported.includes('at_senha'), true);
    assert.equal(/at_senha;.*;portal-secret/i.test(exported), false);
    assert.equal(exported.includes('123456789'), true);

    const header = service.HEADERS.join(';');
    const existingRow = {
      nome: 'Ana Lda',
      razao_social: 'Ana Lda',
      tipo: 'empresa',
      nif: NIF,
      email: 'ana@nova.pt',
      notas: 'notas novas',
      at_utilizador: '123456789',
      at_senha: 'SenhaAT1',
    };
    const newRow = {
      nome: 'Maré Azul; Turismo',
      razao_social: 'Maré Azul SA',
      tipo: 'empresa',
      nif: '510398162',
      email: 'mare@azul.pt',
    };
    const toLine = (rec) =>
      service.HEADERS.map((h) => {
        const v = rec[h] || '';
        return v.includes(';') ? `"${v}"` : v;
      }).join(';');
    const excelLike = Buffer.from(`\uFEFF${header}\r\n${toLine(existingRow)}\r\n${toLine(newRow)}\r\n`, 'utf8');

    let stepUpCalled = false;
    mock.method(stepUp, 'verifyStaffPassword', async () => {
      stepUpCalled = true;
      return { actor: { id: 'u' } };
    });
    mock.method(entitlements, 'assertWithinLimit', async () => {});

    const patches = [];
    mock.method(clientsRepository, 'updateClient', async (id, _firm, p) => {
      patches.push({ id, ...p });
      return { id, ...existing, ...p };
    });
    const created = [];
    mock.method(clientsRepository, 'createClient', async (payload) => {
      const row = { id: 'c2', ...payload };
      created.push(row);
      return row;
    });
    mock.method(accessesRepository, 'findByPortalKey', async () => null);
    const secrets = [];
    mock.method(accessesRepository, 'insertRow', async (row) => {
      secrets.push(row);
      return { id: 'a1', ...row };
    });

    const report = await service.importCsv({
      firmId: 'f',
      actorId: 'u',
      currentPassword: 'cofre-123',
      buffer: excelLike,
    });

    assert.equal(stepUpCalled, true);
    assert.equal(report.updated, 1);
    assert.equal(report.created, 1);
    assert.equal(patches[0].email, 'ana@nova.pt');
    assert.equal(created[0].displayName, 'Maré Azul; Turismo');
    assert.equal(secrets.length, 1);
    assert.equal(secrets[0].portalKey, 'AT_FINANCAS');
    assert.equal(secrets[0].password, 'SenhaAT1');
    assert.equal(JSON.stringify(report).includes('SenhaAT1'), false);
  });

  test('importCsv recusa .xlsx (ZIP) e .xls (OLE)', async () => {
    await assert.rejects(
      () =>
        service.importCsv({
          firmId: 'f',
          actorId: 'u',
          buffer: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]),
        }),
      (err) => err.details?.code === 'FILE_REJECTED',
    );
  });
});
