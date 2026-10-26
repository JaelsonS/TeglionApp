const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { deflateRawSync } = require('zlib');

const {
  bufferToXmlText,
  summarizeSaftXml,
  extractXmlFromZip,
  assertSafeXml,
} = require('./saft-xml-safe');

const MINIMAL_SAFT = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">
  <Header>
    <AuditFileVersion>1.04_01</AuditFileVersion>
    <CompanyID>123456789</CompanyID>
    <TaxRegistrationNumber>123456789</TaxRegistrationNumber>
    <CompanyName>Empresa Demo Lda</CompanyName>
    <FiscalYear>2026</FiscalYear>
    <StartDate>2026-01-01</StartDate>
    <EndDate>2026-12-31</EndDate>
    <CurrencyCode>EUR</CurrencyCode>
    <DateCreated>2026-10-01</DateCreated>
    <ProductID>ERP Demo</ProductID>
    <ProductVersion>1.0</ProductVersion>
  </Header>
  <MasterFiles>
    <Customer><CustomerID>C1</CustomerID></Customer>
    <Customer><CustomerID>C2</CustomerID></Customer>
    <Product><ProductCode>P1</ProductCode></Product>
    <TaxTable>
      <TaxTableEntry><TaxType>IVA</TaxType></TaxTableEntry>
    </TaxTable>
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>2</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>1230.00</TotalCredit>
      <Invoice><InvoiceNo>FT 1/1</InvoiceNo></Invoice>
      <Invoice><InvoiceNo>FT 1/2</InvoiceNo></Invoice>
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;

describe('saft-xml-safe', () => {
  it('rejeita DOCTYPE / ENTITY (XXE)', () => {
    assert.throws(
      () => assertSafeXml('<!DOCTYPE foo [<!ENTITY x SYSTEM "file:///etc/passwd">]><AuditFile/>'),
      /DOCTYPE|ENTITY|XXE/i,
    );
  });

  it('rejeita XML sem AuditFile', () => {
    assert.throws(() => bufferToXmlText(Buffer.from('<Root><a>1</a></Root>')), /AuditFile/);
  });

  it('resume cabeçalho e totais de vendas', () => {
    const s = summarizeSaftXml(MINIMAL_SAFT);
    assert.equal(s.taxRegistrationNumber, '123456789');
    assert.equal(s.companyName, 'Empresa Demo Lda');
    assert.equal(s.fiscalYear, 2026);
    assert.equal(s.summary.customers, 2);
    assert.equal(s.summary.products, 1);
    assert.equal(s.summary.salesInvoices.invoiceCount, 2);
    assert.equal(s.summary.salesInvoices.totalCreditCents, 123000);
    assert.equal(s.validationStatus, 'ok');
    assert.match(s.summary.disclaimer, /AT/i);
  });

  it('warning quando NumberOfEntries ≠ facturas', () => {
    const xml = MINIMAL_SAFT.replace(
      '<NumberOfEntries>2</NumberOfEntries>',
      '<NumberOfEntries>9</NumberOfEntries>',
    );
    const s = summarizeSaftXml(xml);
    assert.equal(s.validationStatus, 'warning');
    assert.ok(s.validationNotes.some((n) => /NumberOfEntries/.test(n)));
  });

  it('extrai XML de ZIP deflate', () => {
    const name = Buffer.from('demo-saft.xml', 'utf8');
    const raw = Buffer.from(MINIMAL_SAFT, 'utf8');
    const compressed = deflateRawSync(raw);

    const local = Buffer.alloc(30 + name.length + compressed.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(0, 14); // crc
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    compressed.copy(local, 30 + name.length);

    const { xmlBuffer, entryName } = extractXmlFromZip(local);
    assert.equal(entryName, 'demo-saft.xml');
    const s = summarizeSaftXml(xmlBuffer.toString('utf8'));
    assert.equal(s.fiscalYear, 2026);
  });
});
