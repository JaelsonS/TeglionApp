/**
 * Leitura segura de .xlsx (OOXML) para consulta interna — NÃO é SAF-T oficial AT.
 *
 * Garantias:
 * — Rejeita .xls OLE e macros VBA
 * — Só lê células em memória (sem executar fórmulas, sem ActiveX, sem URLs remotas)
 * — Não grava o ficheiro em disco
 */
const {
  isZipBuffer,
  isOleCompoundBuffer,
  listSafeZipEntries,
} = require('./saft-zip-safe');

const MAX_CELLS = 50_000;
const MAX_SHEETS = 8;

function decodeXmlEntities(s) {
  return String(s || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseSharedStrings(xml) {
  const out = [];
  // <si>…<t>text</t>…</si> (simplificado; ignora rich text parcial)
  const siRe = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/gi;
  let m;
  while ((m = siRe.exec(xml)) && out.length < MAX_CELLS) {
    const inner = m[1];
    const texts = [];
    const tRe = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi;
    let tm;
    while ((tm = tRe.exec(inner))) {
      texts.push(decodeXmlEntities(tm[1]));
    }
    out.push(texts.join(''));
  }
  return out;
}

function parseSheetCells(xml, sharedStrings) {
  const cells = [];
  const cRe =
    /<(?:\w+:)?c\b([^>]*)>(?:[\s\S]*?<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>)?/gi;
  let m;
  while ((m = cRe.exec(xml)) && cells.length < MAX_CELLS) {
    const attrs = m[1] || '';
    const rawV = m[2] != null ? decodeXmlEntities(m[2]).trim() : '';
    const typeM = /\bt\s*=\s*"([^"]*)"/i.exec(attrs);
    const refM = /\br\s*=\s*"([^"]*)"/i.exec(attrs);
    const t = typeM ? typeM[1] : '';
    let value = rawV;
    if (t === 's') {
      const idx = Number(rawV);
      value = Number.isInteger(idx) && sharedStrings[idx] != null ? sharedStrings[idx] : '';
    } else if (t === 'inlineStr') {
      const isM = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/i.exec(m[0]);
      value = isM ? decodeXmlEntities(isM[1]) : '';
    } else if (t === 'b') {
      value = rawV === '1' ? 'true' : 'false';
    }
    // Fórmulas: o Excel guarda o valor calculado em <v>; nunca avaliamos a fórmula.
    if (refM || value !== '') {
      cells.push({ ref: refM ? refM[1] : null, value: String(value).slice(0, 500) });
    }
  }
  return cells;
}

function lookLikeNif(s) {
  const d = String(s || '').replace(/\s/g, '');
  return /^\d{9}$/.test(d) ? d : null;
}

function lookLikeYear(s) {
  const n = Number(String(s || '').trim());
  if (Number.isInteger(n) && n >= 1990 && n <= 2100) return n;
  return null;
}

/**
 * Resume um .xlsx para consulta. Sempre validationStatus=warning (não é SAF-T AT).
 */
function summarizeXlsxBuffer(buffer) {
  if (isOleCompoundBuffer(buffer)) {
    throw Object.assign(
      new Error(
        'Excel .xls antigo (OLE) não é aceite — pode conter macros. Guarde como .xlsx sem macros ou exporte SAF-T em .xml.',
      ),
      { code: 'XLS_OLE_REJECTED' },
    );
  }
  if (!isZipBuffer(buffer)) {
    throw Object.assign(new Error('Ficheiro .xlsx inválido'), { code: 'INVALID_XLSX' });
  }

  const entries = listSafeZipEntries(buffer, { allowXml: true, allowXlsxParts: true });
  const byName = new Map(entries.map((e) => [e.name.replace(/\\/g, '/').toLowerCase(), e]));

  // Preferência: se o pacote trouxer um AuditFile XML, tratar como SAF-T embutido.
  for (const e of entries) {
    if (!e.name.toLowerCase().endsWith('.xml')) continue;
    const text = e.buffer.toString('utf8');
    if (/<(?:\w+:)?AuditFile\b/i.test(text)) {
      return { embeddedSaftXml: e.buffer, entryName: e.name };
    }
  }

  const sharedEntry =
    byName.get('xl/sharedstrings.xml') ||
    [...byName.entries()].find(([n]) => n.endsWith('/sharedstrings.xml'))?.[1];
  const sharedStrings = sharedEntry ? parseSharedStrings(sharedEntry.buffer.toString('utf8')) : [];

  const sheetEntries = [...byName.entries()]
    .filter(([n]) => /xl\/worksheets\/sheet\d+\.xml$/i.test(n))
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, MAX_SHEETS)
    .map(([, e]) => e);

  if (!sheetEntries.length) {
    throw Object.assign(new Error('Excel sem folhas legíveis'), { code: 'XLSX_NO_SHEETS' });
  }

  const allCells = [];
  const sheetSummaries = [];
  for (const sheet of sheetEntries) {
    const cells = parseSheetCells(sheet.buffer.toString('utf8'), sharedStrings);
    allCells.push(...cells);
    sheetSummaries.push({ name: sheet.name, cellCount: cells.length });
    if (allCells.length >= MAX_CELLS) break;
  }

  const notes = [
    'Folha Excel (.xlsx) — leitura tabular interna. Não é o SAF-T oficial da AT (esse é XML).',
    'Fórmulas não são executadas; macros VBA são rejeitadas; o ficheiro não é guardado no servidor.',
  ];

  let taxRegistrationNumber = null;
  let fiscalYear = null;
  let companyName = null;
  const sampleTexts = [];

  for (const cell of allCells) {
    const v = cell.value;
    if (!v) continue;
    if (!taxRegistrationNumber) {
      const nif = lookLikeNif(v);
      if (nif) taxRegistrationNumber = nif;
    }
    if (!fiscalYear) {
      const y = lookLikeYear(v);
      if (y) fiscalYear = y;
    }
    if (typeof v === 'string' && /[A-Za-zÀ-ÿ]{3,}/.test(v) && sampleTexts.length < 12) {
      sampleTexts.push(v.slice(0, 120));
    }
  }
  if (sampleTexts.length) {
    companyName = sampleTexts[0].slice(0, 200);
  }

  if (!allCells.length) {
    throw Object.assign(new Error('Excel sem células com dados'), { code: 'XLSX_EMPTY' });
  }

  if (!taxRegistrationNumber) notes.push('NIF não encontrado automaticamente na folha');
  if (!fiscalYear) notes.push('Ano fiscal não encontrado automaticamente na folha');

  return {
    embeddedSaftXml: null,
    auditFileVersion: null,
    companyId: null,
    taxRegistrationNumber,
    companyName,
    fiscalYear,
    startDate: null,
    endDate: null,
    currencyCode: 'EUR',
    productId: 'xlsx-upload',
    productVersion: null,
    validationStatus: 'warning',
    validationNotes: notes,
    summary: {
      sourceFormat: 'xlsx',
      sheets: sheetSummaries,
      cellCount: allCells.length,
      sampleTexts: sampleTexts.slice(0, 8),
      customers: null,
      suppliers: null,
      products: null,
      taxTableEntries: null,
      journals: null,
      salesInvoices: {
        declaredEntries: null,
        invoiceCount: null,
        totalDebitCents: null,
        totalCreditCents: null,
        totalDebit: null,
        totalCredit: null,
      },
      purchaseInvoices: { declaredEntries: null, invoiceCount: null },
      payments: null,
      stockMovements: null,
      workDocuments: null,
      structuralChecks: {
        hasHeader: false,
        hasMasterFiles: false,
        hasSourceDocuments: false,
        hasGeneralLedger: false,
        xlsxReadOnly: true,
      },
      disclaimer:
        'Leitura tabular de Excel no Teglion. Não substitui SAF-T XML certificado nem envio à AT. Sem macros, sem execução de fórmulas, sem armazenamento do ficheiro.',
    },
  };
}

module.exports = {
  summarizeXlsxBuffer,
  parseSharedStrings,
  parseSheetCells,
};
