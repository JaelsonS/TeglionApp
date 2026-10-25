const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const saftImportsRepository = require('../../db/supabase/repositories/client-saft-imports.repository');
const {
  importSaft,
  getImport,
  previewSaftBuffer,
  INTERNAL_DISCLAIMER,
} = require('./saft.service');

const MINIMAL_SAFT = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile>
  <Header>
    <AuditFileVersion>1.04_01</AuditFileVersion>
    <CompanyID>500000000</CompanyID>
    <TaxRegistrationNumber>500000000</TaxRegistrationNumber>
    <CompanyName>Senhorio Teste</CompanyName>
    <FiscalYear>2026</FiscalYear>
    <StartDate>2026-01-01</StartDate>
    <EndDate>2026-03-31</EndDate>
    <CurrencyCode>EUR</CurrencyCode>
    <ProductID>X</ProductID>
    <ProductVersion>1</ProductVersion>
  </Header>
  <MasterFiles/>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>1</NumberOfEntries>
      <TotalDebit>0</TotalDebit>
      <TotalCredit>100.00</TotalCredit>
      <Invoice><InvoiceNo>1</InvoiceNo></Invoice>
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;

describe('saft.service helpers', () => {
  it('previewSaftBuffer lê XML em memória', () => {
    const p = previewSaftBuffer(Buffer.from(MINIMAL_SAFT), 'a.xml');
    assert.equal(p.fiscalYear, 2026);
    assert.equal(p.summary.salesInvoices.totalCreditCents, 10000);
  });

  it('disclaimer permanente', () => {
    assert.match(INTERNAL_DISCLAIMER, /não envia/i);
    assert.match(INTERNAL_DISCLAIMER, /AT/i);
  });
});

describe('saft.service isolation', () => {
  it('importSaft recusa cliente de outro firm', async () => {
    mock.method(clientsRepository, 'findClientById', async () => null);
    await assert.rejects(
      () =>
        importSaft({
          firmId: 'firm-a',
          clientId: 'c-x',
          actorId: 'u1',
          file: { buffer: Buffer.from(MINIMAL_SAFT), originalname: 's.xml' },
        }),
      (err) => err.statusCode === 404,
    );
  });

  it('getImport 404 cross-tenant', async () => {
    mock.method(saftImportsRepository, 'findById', async (firmId) => {
      assert.equal(firmId, 'firm-b');
      return null;
    });
    await assert.rejects(
      () => getImport({ firmId: 'firm-b', importId: 'i1' }),
      (err) => err.statusCode === 404,
    );
  });

  it('importSaft grava sempre firmId do actor e devolve duplicate se hash existir', async () => {
    mock.method(saftImportsRepository, 'findByHash', async (firmId) => {
      assert.equal(firmId, 'firm-a');
      return null;
    });
    mock.method(saftImportsRepository, 'insertImport', async (data) => {
      assert.equal(data.firmId, 'firm-a');
      assert.equal(data.taxRegistrationNumber, '500000000');
      assert.ok(data.contentSha256);
      assert.equal(data.sourceKind, 'xml');
      return { id: 'new-1', ...data };
    });

    const created = await importSaft({
      firmId: 'firm-a',
      actorId: 'u1',
      file: { buffer: Buffer.from(MINIMAL_SAFT), originalname: 'saft.xml' },
    });
    assert.equal(created.duplicate, false);
    assert.equal(created.item.id, 'new-1');
    assert.match(created.disclaimer, /AT/i);

    mock.method(saftImportsRepository, 'findByHash', async () => ({ id: 'existing' }));
    const dup = await importSaft({
      firmId: 'firm-a',
      actorId: 'u1',
      file: { buffer: Buffer.from(MINIMAL_SAFT), originalname: 'saft.xml' },
    });
    assert.equal(dup.duplicate, true);
    assert.equal(dup.item.id, 'existing');
  });

  it('rejeita XML sem NIF no header', async () => {
    mock.method(saftImportsRepository, 'findByHash', async () => null);
    const bad = MINIMAL_SAFT.replace(
      '<TaxRegistrationNumber>500000000</TaxRegistrationNumber>',
      '',
    );
    await assert.rejects(
      () =>
        importSaft({
          firmId: 'firm-a',
          file: { buffer: Buffer.from(bad), originalname: 'bad.xml' },
        }),
      (err) => err.code === 'SAFT_INVALID' || err.statusCode === 400,
    );
  });
});
