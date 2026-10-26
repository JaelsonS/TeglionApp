/**
 * Leitura segura de XML SAF-T PT — sem DOM/XXE.
 * Não resolve entidades externas; rejeita DOCTYPE/ENTITY.
 * ZIP: ver saft-zip-safe (path traversal, bombas, macros).
 */

const { listSafeZipEntries, isZipBuffer, isOleCompoundBuffer } = require('./saft-zip-safe');

const MAX_XML_CHARS = 40 * 1024 * 1024; // 40 MB texto

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
  // Varre o documento inteiro (não só o cabeçalho) — XXE / XInclude / DTD.
  if (/<!DOCTYPE/i.test(text) || /<!ENTITY/i.test(text)) {
    throw Object.assign(new Error('XML com DOCTYPE/ENTITY não é aceite (protecção XXE)'), {
      code: 'UNSAFE_XML',
    });
  }
  if (/SYSTEM\s+["']/i.test(text) || /PUBLIC\s+["']/i.test(text)) {
    throw Object.assign(new Error('XML com referências externas SYSTEM/PUBLIC rejeitado'), {
      code: 'UNSAFE_XML',
    });
  }
  if (/<\s*(?:\w+:)?include\b/i.test(text) || /xi:include/i.test(text)) {
    throw Object.assign(new Error('XML com XInclude rejeitado'), { code: 'UNSAFE_XML' });
  }
  // Não há fetch HTTP a partir deste parser — bloqueamos também URLs embutidas suspeitas em DTD-like.
  if (/https?:\/\//i.test(text.slice(0, 8000)) && /<!DOCTYPE|ENTITY|SYSTEM/i.test(text.slice(0, 8000))) {
    throw Object.assign(new Error('XML com URL externa rejeitado'), { code: 'UNSAFE_XML' });
  }

  if (!/<(?:\w+:)?AuditFile\b/i.test(text)) {
    throw Object.assign(new Error('Não parece um ficheiro SAF-T (falta AuditFile)'), {
      code: 'NOT_SAFT',
    });
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
        'Leitura interna Teglion. Não valida XSD oficial AT nem substitui software certificado. Sem envio à AT. Ficheiro não é armazenado.',
    },
  };
}

/**
 * Extrai o primeiro .xml SAF-T de um ZIP (deflate/stored) com hardening.
 */
function extractXmlFromZip(buffer) {
  if (isOleCompoundBuffer(buffer)) {
    throw Object.assign(new Error('Ficheiro OLE/.xls não é um ZIP SAF-T'), {
      code: 'XLS_OLE_REJECTED',
    });
  }
  const entries = listSafeZipEntries(buffer, { allowXml: true, allowXlsxParts: false });
  const xmlCandidates = entries.filter((e) => e.name.toLowerCase().endsWith('.xml'));
  if (!xmlCandidates.length) {
    throw Object.assign(new Error('ZIP sem ficheiro .xml SAF-T'), { code: 'ZIP_NO_XML' });
  }
  xmlCandidates.sort((a, b) => {
    const score = (n) => (/saft/i.test(n) ? 0 : 1);
    return score(a.name) - score(b.name);
  });
  return {
    xmlBuffer: xmlCandidates[0].buffer,
    entryName: xmlCandidates[0].name,
    entryCountScanned: entries.length,
  };
}

module.exports = {
  bufferToXmlText,
  assertSafeXml,
  summarizeSaftXml,
  extractXmlFromZip,
  isZipBuffer,
  isOleCompoundBuffer,
  firstTagText,
  MAX_XML_CHARS,
};
