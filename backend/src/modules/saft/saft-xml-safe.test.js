const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { deflateRawSync } = require('zlib');

const {
  bufferToXmlText,
  summarizeSaftXml,
  extractXmlFromZip,
  assertSafeXml,
} = require('./saft-xml-safe');
const { assertSafeZipEntryName, isOleCompoundBuffer } = require('./saft-zip-safe');
const { summarizeXlsxBuffer, parseSharedStrings, parseSheetCells } = require('./saft-xlsx-safe');
const { detectSourceKind, previewSaftBuffer } = require('./saft.service');

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

function buildLocalZipEntry(nameStr, rawBuf, compression = 8) {
  const name = Buffer.from(nameStr, 'utf8');
  const compressed = compression === 8 ? deflateRawSync(rawBuf) : rawBuf;
  const local = Buffer.alloc(30 + name.length + compressed.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6); // flags — sem data descriptor
  local.writeUInt16LE(compression, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(0, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(rawBuf.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  name.copy(local, 30);
  compressed.copy(local, 30 + name.length);
  return local;
}

describe('saft-xml-safe', () => {
  it('rejeita DOCTYPE / ENTITY (XXE)', () => {
    assert.throws(
      () => assertSafeXml('<!DOCTYPE foo [<!ENTITY x SYSTEM "file:///etc/passwd">]><AuditFile/>'),
      /DOCTYPE|ENTITY|XXE/i,
    );
  });

  it('rejeita SYSTEM/PUBLIC mesmo sem DOCTYPE no head curto', () => {
    const pad = '<!-- ' + 'x'.repeat(5000) + ' -->';
    assert.throws(
      () => assertSafeXml(`<AuditFile>${pad}<!ENTITY y SYSTEM "http://evil.test/x">`),
      /SYSTEM|UNSAFE|ENTITY/i,
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
    const local = buildLocalZipEntry('demo-saft.xml', Buffer.from(MINIMAL_SAFT, 'utf8'));
    const { xmlBuffer, entryName } = extractXmlFromZip(local);
    assert.equal(entryName, 'demo-saft.xml');
    const s = summarizeSaftXml(xmlBuffer.toString('utf8'));
    assert.equal(s.fiscalYear, 2026);
  });

  it('rejeita path traversal no ZIP', () => {
    const local = buildLocalZipEntry('../etc/passwd.xml', Buffer.from(MINIMAL_SAFT, 'utf8'));
    assert.throws(() => extractXmlFromZip(local), /traversal|caminho/i);
  });

  it('rejeita entry .exe no ZIP', () => {
    const local = buildLocalZipEntry('malware.exe', Buffer.from('MZ'));
    assert.throws(() => extractXmlFromZip(local), /não permitido|\.exe/i);
  });

  it('rejeita VBA project no nome', () => {
    assert.throws(() => assertSafeZipEntryName('xl/vbaProject.bin'), /macro|VBA/i);
  });
});

describe('saft OLE / excel gates', () => {
  it('detecta OLE compound', () => {
    const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    assert.equal(isOleCompoundBuffer(ole), true);
    assert.throws(() => detectSourceKind('saft.xls', ole), /xls|macro/i);
  });

  it('rejeita .xlsm pela extensão', () => {
    assert.throws(() => detectSourceKind('a.xlsm', Buffer.from('PK')), /macro/i);
  });
});

describe('saft-xlsx-safe', () => {
  it('parse shared strings e células sem executar fórmulas', () => {
    const ss = parseSharedStrings(
      `<sst><si><t>Empresa X</t></si><si><t>500000000</t></si></sst>`,
    );
    assert.deepEqual(ss, ['Empresa X', '500000000']);
    const cells = parseSheetCells(
      `<sheetData>
        <c r="A1" t="s"><v>0</v></c>
        <c r="B1" t="s"><v>1</v></c>
        <c r="C1"><f>A1+B1</f><v>2026</v></c>
      </sheetData>`,
      ss,
    );
    assert.equal(cells.find((c) => c.ref === 'A1').value, 'Empresa X');
    assert.equal(cells.find((c) => c.ref === 'B1').value, '500000000');
    assert.equal(cells.find((c) => c.ref === 'C1').value, '2026');
  });

  it('resume xlsx mínimo (OOXML) com warning — não é SAF-T AT', () => {
    const shared = Buffer.from(
      `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Cliente Demo Lda</t></si><si><t>123456789</t></si></sst>`,
      'utf8',
    );
    const sheet = Buffer.from(
      `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
        <c r="A1" t="s"><v>0</v></c>
        <c r="B1" t="s"><v>1</v></c>
        <c r="C1"><v>2026</v></c>
      </sheetData></worksheet>`,
      'utf8',
    );
    const zip = Buffer.concat([
      buildLocalZipEntry('xl/sharedStrings.xml', shared),
      buildLocalZipEntry('xl/worksheets/sheet1.xml', sheet),
    ]);
    const s = summarizeXlsxBuffer(zip);
    assert.equal(s.validationStatus, 'warning');
    assert.equal(s.taxRegistrationNumber, '123456789');
    assert.equal(s.fiscalYear, 2026);
    assert.match(s.summary.disclaimer, /Excel|macros|AT/i);
    assert.equal(s.summary.structuralChecks.xlsxReadOnly, true);
  });

  it('xlsx com AuditFile embutido devolve XML para o pipeline SAF-T', () => {
    const zip = buildLocalZipEntry('embedded-saft.xml', Buffer.from(MINIMAL_SAFT, 'utf8'));
    // Forçar caminho via summarizeXlsxBuffer: precisa parecer xlsx scan — listSafeZipEntries com allowXlsxParts
    // Aqui usamos preview com filename .xlsx sobre zip que só tem xml → detectSourceKind → xlsx
    // Mas summarizeXlsxBuffer exige sheets OU AuditFile no xml entry
    const s = summarizeXlsxBuffer(zip);
    assert.ok(s.embeddedSaftXml);
    const preview = previewSaftBuffer(zip, 'mapa.xlsx');
    assert.equal(preview.fiscalYear, 2026);
    assert.equal(preview.taxRegistrationNumber, '123456789');
  });
});
