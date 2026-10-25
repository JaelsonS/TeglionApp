/**
 * Leitura segura de XML SAF-T PT — sem DOM/XXE.
 * Não resolve entidades externas; rejeita DOCTYPE/ENTITY.
 */

const { inflateRawSync } = require('zlib');

const MAX_XML_CHARS = 40 * 1024 * 1024; // 40 MB texto
const MAX_ZIP_ENTRIES = 40;
const MAX_UNCOMPRESSED_ENTRY = 40 * 1024 * 1024;

function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

function bufferToXmlText(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw Object.assign(new Error('Ficheiro vazio'), { code: 'EMPTY_FILE' });
  }
  if (buffer.length > MAX_XML_CHARS) {
    throw Object.assign(new Error('Ficheiro demasiado grande'), { code: 'FILE_TOO_LARGE' });
  }
  const text = stripBom(buffer.toString('utf8'));
  assertSafeXml(text);
  return text;
}

function assertSafeXml(text) {
  const head = text.slice(0, 4000);
  if (/<!DOCTYPE/i.test(head) || /<!ENTITY/i.test(head)) {
    throw Object.assign(new Error('XML com DOCTYPE/ENTITY não é aceite (protecção XXE)'), {
      code: 'UNSAFE_XML',
    });
  }
  if (!/<AuditFile[\s>]/i.test(text) && !/<AuditFile\b/i.test(text)) {
    // namespaces: <ns:AuditFile
    if (!/<(?:\w+:)?AuditFile\b/i.test(text)) {
      throw Object.assign(new Error('Não parece um ficheiro SAF-T (falta AuditFile)'), {
        code: 'NOT_SAFT',
      });
    }
  }
}

function firstTagText(xml, tagName) {
  const re = new RegExp(
    `<(?:\\w+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tagName}>`,
    'i',
  );
  const m = xml.match(re);
  if (!m) return null;
  return String(m[1]).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function sectionInner(xml, tagName) {
  const re = new RegExp(
    `<(?:\\w+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tagName}>`,
    'i',
  );
  const m = xml.match(re);
  return m ? m[1] : null;
}

function countOpenTags(xml, tagName) {
  const re = new RegExp(`<(?:\\w+:)?${tagName}\\b`, 'gi');
  const matches = xml.match(re);
  return matches ? matches.length : 0;
}

function parseMoney(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function eurosFromCents(cents) {
  if (cents == null) return null;
  return Number((cents / 100).toFixed(2));
}

/**
 * Extrai resumo de um SAF-T PT (leitura). Validação estrutural leve — não é XSD AT.
 */
function summarizeSaftXml(xmlText) {
  const notes = [];
  const header = sectionInner(xmlText, 'Header') || '';
  if (!header) notes.push('Header em falta ou ilegível');

  const auditFileVersion = firstTagText(header, 'AuditFileVersion') || firstTagText(xmlText, 'AuditFileVersion');
  const companyId = firstTagText(header, 'CompanyID');
  const taxRegistrationNumber = firstTagText(header, 'TaxRegistrationNumber');
  const companyName = firstTagText(header, 'CompanyName');
  const fiscalYearRaw = firstTagText(header, 'FiscalYear');
  const startDate = firstTagText(header, 'StartDate');
  const endDate = firstTagText(header, 'EndDate');
  const currencyCode = firstTagText(header, 'CurrencyCode') || 'EUR';
  const productId = firstTagText(header, 'ProductID');
  const productVersion = firstTagText(header, 'ProductVersion');

  if (!taxRegistrationNumber) notes.push('NIF (TaxRegistrationNumber) em falta no Header');
  if (!fiscalYearRaw) notes.push('FiscalYear em falta no Header');

  const fiscalYear = fiscalYearRaw ? Number(fiscalYearRaw) : null;
  if (fiscalYearRaw && (!Number.isInteger(fiscalYear) || fiscalYear < 1990 || fiscalYear > 2100)) {
    notes.push('FiscalYear inválido');
  }

  const master = sectionInner(xmlText, 'MasterFiles') || '';
  const source = sectionInner(xmlText, 'SourceDocuments') || '';
  const sales = sectionInner(source, 'SalesInvoices') || '';
  const purchases = sectionInner(source, 'PurchaseInvoices') || '';
  const payments = sectionInner(source, 'Payments') || '';
  const movements = sectionInner(source, 'MovementOfGoods') || '';
  const working = sectionInner(source, 'WorkingDocuments') || '';
  const ledger = sectionInner(xmlText, 'GeneralLedgerEntries') || '';

  const salesDeclared = firstTagText(sales, 'NumberOfEntries');
  const salesTotalDebit = parseMoney(firstTagText(sales, 'TotalDebit'));
  const salesTotalCredit = parseMoney(firstTagText(sales, 'TotalCredit'));
  const invoiceCount = countOpenTags(sales, 'Invoice');

  const purchaseDeclared = firstTagText(purchases, 'NumberOfEntries');
  const purchaseInvoiceCount = countOpenTags(purchases, 'Invoice');

  const customerCount = countOpenTags(master, 'Customer');
  const supplierCount = countOpenTags(master, 'Supplier');
  const productCount = countOpenTags(master, 'Product');
  const taxTableCount = countOpenTags(master, 'TaxTableEntry');
  const journalCount = countOpenTags(ledger, 'Journal');
  const paymentCount = countOpenTags(payments, 'Payment');
  const stockMovementCount = countOpenTags(movements, 'StockMovement');
  const workDocumentCount = countOpenTags(working, 'WorkDocument');

  if (salesDeclared != null && Number(salesDeclared) !== invoiceCount) {
    notes.push(
      `NumberOfEntries de vendas (${salesDeclared}) ≠ facturas encontradas (${invoiceCount})`,
    );
  }

  let validationStatus = 'ok';
  if (!header || !taxRegistrationNumber) validationStatus = 'invalid';
  else if (notes.length) validationStatus = 'warning';

  return {
    auditFileVersion: auditFileVersion || null,
    companyId: companyId || null,
    taxRegistrationNumber: taxRegistrationNumber || null,
    companyName: companyName || null,
    fiscalYear: Number.isInteger(fiscalYear) ? fiscalYear : null,
    startDate: startDate || null,
    endDate: endDate || null,
    currencyCode,
    productId: productId || null,
    productVersion: productVersion || null,
    validationStatus,
    validationNotes: notes,
    summary: {
      customers: customerCount,
      suppliers: supplierCount,
      products: productCount,
      taxTableEntries: taxTableCount,
      journals: journalCount,
      salesInvoices: {
        declaredEntries: salesDeclared != null ? Number(salesDeclared) : null,
        invoiceCount,
        totalDebitCents: salesTotalDebit,
        totalCreditCents: salesTotalCredit,
        totalDebit: eurosFromCents(salesTotalDebit),
        totalCredit: eurosFromCents(salesTotalCredit),
      },
      purchaseInvoices: {
        declaredEntries: purchaseDeclared != null ? Number(purchaseDeclared) : null,
        invoiceCount: purchaseInvoiceCount,
      },
      payments: paymentCount,
      stockMovements: stockMovementCount,
      workDocuments: workDocumentCount,
      structuralChecks: {
        hasHeader: Boolean(header),
        hasMasterFiles: Boolean(master),
        hasSourceDocuments: Boolean(source),
        hasGeneralLedger: Boolean(ledger),
      },
      disclaimer:
        'Leitura interna Teglion. Não valida XSD oficial AT nem substitui software certificado. Sem envio à AT.',
    },
  };
}

function isZipBuffer(buf) {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07);
}

/**
 * Extrai o primeiro .xml de um ZIP (deflate/stored). Protecção zip-bomb básica.
 */
function extractXmlFromZip(buffer) {
  if (!isZipBuffer(buffer)) {
    throw Object.assign(new Error('ZIP inválido'), { code: 'INVALID_ZIP' });
  }

  let offset = 0;
  let entries = 0;
  const xmlCandidates = [];

  while (offset + 30 <= buffer.length && entries < MAX_ZIP_ENTRIES) {
    if (buffer[offset] !== 0x50 || buffer[offset + 1] !== 0x4b) break;
    // Local file header
    if (buffer[offset + 2] !== 0x03 || buffer[offset + 3] !== 0x04) break;

    const compression = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const uncompSize = buffer.readUInt32LE(offset + 22);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLen;
    if (nameEnd + extraLen > buffer.length) break;

    const name = buffer.slice(nameStart, nameEnd).toString('utf8');
    const dataStart = nameEnd + extraLen;
    const dataEnd = dataStart + compSize;
    if (dataEnd > buffer.length) break;

    entries += 1;
    const lower = name.toLowerCase();
    const isDir = name.endsWith('/');
    const isMac = lower.includes('__macosx') || lower.startsWith('.');
    if (!isDir && !isMac && lower.endsWith('.xml')) {
      if (uncompSize > MAX_UNCOMPRESSED_ENTRY) {
        throw Object.assign(new Error('XML dentro do ZIP demasiado grande'), {
          code: 'ZIP_ENTRY_TOO_LARGE',
        });
      }
      const compressed = buffer.slice(dataStart, dataEnd);
      let xmlBuf;
      if (compression === 0) {
        xmlBuf = compressed;
      } else if (compression === 8) {
        try {
          xmlBuf = inflateRawSync(compressed, { maxOutputLength: MAX_UNCOMPRESSED_ENTRY });
        } catch {
          throw Object.assign(new Error('Falha ao descomprimir XML no ZIP'), {
            code: 'ZIP_INFLATE_FAILED',
          });
        }
      } else {
        throw Object.assign(new Error('Compressão ZIP não suportada (só stored/deflate)'), {
          code: 'ZIP_COMPRESSION',
        });
      }
      xmlCandidates.push({ name, buffer: xmlBuf });
    }

    offset = dataEnd;
  }

  if (!xmlCandidates.length) {
    throw Object.assign(new Error('ZIP sem ficheiro .xml SAF-T'), { code: 'ZIP_NO_XML' });
  }

  // Preferir nome com saft / AuditFile
  xmlCandidates.sort((a, b) => {
    const score = (n) => (/saft/i.test(n) ? 0 : 1);
    return score(a.name) - score(b.name);
  });

  return {
    xmlBuffer: xmlCandidates[0].buffer,
    entryName: xmlCandidates[0].name,
    entryCountScanned: entries,
  };
}

module.exports = {
  bufferToXmlText,
  assertSafeXml,
  summarizeSaftXml,
  extractXmlFromZip,
  isZipBuffer,
  firstTagText,
  MAX_XML_CHARS,
};
