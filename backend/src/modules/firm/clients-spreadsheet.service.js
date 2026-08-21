/**
 * Modelo CSV da ficha (abre no Excel PT). Sem macros, sem ZIP, sem fórmulas.
 * Senhas oficiais: colunas vazias na exportação; preenchidas só no import, com step-up.
 */
const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const accessesRepository = require('../../db/supabase/repositories/client-official-accesses.repository');
const { resolveFiscalProfile, normalizeMetadataPatch, mergeMetadata } = require('../../utils/client-metadata');
const { isValidNIF, digitsOnly } = require('../../utils/documents');
const entitlements = require('../entitlements/entitlements.service');
const stepUp = require('./step-up.service');
const { CATALOG_PORTAL_KEYS } = require('./official-accesses.catalog');

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 400;
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OLE_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);

const HEADERS = [
  'nome',
  'razao_social',
  'tipo',
  'nif',
  'email',
  'telefone',
  'rua',
  'codigo_postal',
  'concelho',
  'distrito',
  'freguesia',
  'tipo_contabilidade',
  'cae',
  'iva',
  'irs',
  'notas',
  'at_utilizador',
  'at_senha',
  'ss_utilizador',
  'ss_senha',
  'viactt_utilizador',
  'viactt_senha',
  'iapmei_utilizador',
  'iapmei_senha',
  'ru_utilizador',
  'ru_senha',
];

const PORTAL_COLS = {
  AT_FINANCAS: { user: 'at_utilizador', pass: 'at_senha' },
  SEGURANCA_SOCIAL: { user: 'ss_utilizador', pass: 'ss_senha' },
  VIA_CTT: { user: 'viactt_utilizador', pass: 'viactt_senha' },
  IAPMEI: { user: 'iapmei_utilizador', pass: 'iapmei_senha' },
  RELATORIO_UNICO: { user: 'ru_utilizador', pass: 'ru_senha' },
};

function sanitizeCell(value) {
  if (value == null) return '';
  let s = String(value).replace(/\r?\n/g, ' ').trim();
  if (!s) return '';
  if (/^[=+\-@]/.test(s) || s.startsWith('\t')) s = `'${s}`;
  return s.slice(0, 2000);
}

function csvEscape(value) {
  const s = sanitizeCell(value);
  if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function detectDelimiter(src) {
  const first = String(src).split(/\r?\n/, 1)[0] || '';
  const unquoted = first.replace(/"[^"]*"/g, '');
  const semi = (unquoted.match(/;/g) || []).length;
  const comma = (unquoted.match(/,/g) || []).length;
  return semi >= comma ? ';' : ',';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const src = String(text || '').replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(src);
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (ch !== '\r') cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c || '').trim()));
}

function addressOf(fp) {
  const a = fp?.address;
  if (a && typeof a === 'object') return a;
  return { street: typeof a === 'string' ? a : '', postalCode: '', municipality: '', district: '', parish: '' };
}

function buildTemplateCsv() {
  return `\uFEFF${HEADERS.join(';')}\r\n`;
}

async function listAllClients(firmId) {
  const items = [];
  let offset = 0;
  const pageSize = 200;
  for (;;) {
    const batch = await clientsRepository.listClients(firmId, {
      limit: pageSize,
      offset,
      includeInactive: true,
    });
    if (!batch.length) break;
    items.push(...batch);
    offset += batch.length;
    if (batch.length < pageSize || items.length >= 2000) break;
  }
  return items;
}

async function buildExportCsv({ firmId }) {
  const items = await listAllClients(firmId);
  const usernames = await accessesRepository.listUsernamesByFirm(firmId);
  const byClient = new Map();
  for (const row of usernames) {
    if (!byClient.has(row.clientId)) byClient.set(row.clientId, new Map());
    byClient.get(row.clientId).set(row.portalKey, row.username || '');
  }
  const lines = [HEADERS.join(';')];
  for (const c of items) {
    const fp = resolveFiscalProfile(c.metadata);
    const addr = addressOf(fp);
    const byKey = byClient.get(c.id) || new Map();
    const rec = {
      nome: c.displayName || c.name || '',
      razao_social: fp.legalName || '',
      tipo: fp.clientType || '',
      nif: c.taxId || '',
      email: c.email || '',
      telefone: c.phone || '',
      rua: addr.street || '',
      codigo_postal: addr.postalCode || '',
      concelho: addr.municipality || '',
      distrito: addr.district || '',
      freguesia: addr.parish || '',
      tipo_contabilidade: fp.accountingType || '',
      cae: fp.caePrimary || '',
      iva: fp.vatRegime || '',
      irs: fp.irsFramework || '',
      notas: fp.notes || '',
    };
    for (const key of CATALOG_PORTAL_KEYS) {
      const cols = PORTAL_COLS[key];
      rec[cols.user] = byKey.get(key) || '';
      rec[cols.pass] = '';
    }
    lines.push(HEADERS.map((h) => csvEscape(rec[h] || '')).join(';'));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function rowToObject(header, cells) {
  const out = {};
  header.forEach((h, i) => {
    out[String(h || '').trim().toLowerCase()] = sanitizeCell(cells[i]);
  });
  return out;
}

function filled(v) {
  return Boolean(String(v || '').trim());
}

async function upsertPortalSecrets({ firmId, clientId, actorId, row }) {
  let wrote = false;
  for (const key of CATALOG_PORTAL_KEYS) {
    const cols = PORTAL_COLS[key];
    const username = row[cols.user] || null;
    const password = row[cols.pass] || null;
    if (!filled(username) && !filled(password)) continue;
    const existing = await accessesRepository.findByPortalKey(firmId, clientId, key);
    if (!filled(password)) {
      if (existing && filled(username)) {
        await accessesRepository.updateRow(firmId, clientId, existing.id, {
          username,
          updatedBy: actorId,
        });
        wrote = true;
      }
      continue;
    }
    if (existing) {
      await accessesRepository.updateRow(firmId, clientId, existing.id, {
        username: filled(username) ? username : existing.username,
        password,
        updatedBy: actorId,
      });
    } else {
      await accessesRepository.insertRow({
        firmId,
        clientId,
        portalKey: key,
        username: username || null,
        password,
        updatedBy: actorId,
      });
    }
    wrote = true;
  }
  return wrote;
}

function metadataFromRow(row) {
  const patch = {};
  if (filled(row.razao_social)) patch.legalName = row.razao_social;
  if (filled(row.tipo)) patch.clientType = row.tipo;
  if (filled(row.tipo_contabilidade)) patch.accountingType = row.tipo_contabilidade;
  if (filled(row.cae)) patch.caePrimary = row.cae;
  if (filled(row.iva)) patch.vatRegime = row.iva;
  if (filled(row.irs)) patch.irsFramework = row.irs;
  if (filled(row.notas)) patch.notes = row.notas;
  const address = {};
  if (filled(row.rua)) address.street = row.rua;
  if (filled(row.codigo_postal)) address.postalCode = row.codigo_postal;
  if (filled(row.concelho)) address.municipality = row.concelho;
  if (filled(row.distrito)) address.district = row.distrito;
  if (filled(row.freguesia)) address.parish = row.freguesia;
  if (Object.keys(address).length) patch.address = address;
  return normalizeMetadataPatch(patch);
}

async function importCsv({
  firmId,
  actorId,
  currentPassword,
  stepUpToken,
  rememberSession,
  totpCode,
  buffer,
}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new AppError('Ficheiro em falta.', 400, { code: 'FILE_REQUIRED' });
  }
  if (buffer.length > MAX_BYTES) {
    throw new AppError('Ficheiro demasiado grande (máx. 2 MB).', 400, { code: 'FILE_TOO_LARGE' });
  }
  if (buffer.subarray(0, 4).equals(ZIP_MAGIC) || buffer.subarray(0, 4).equals(OLE_MAGIC)) {
    throw new AppError('Só é aceite CSV de texto. Não envie .xlsx, .xls nem ficheiros com macros.', 400, {
      code: 'FILE_REJECTED',
    });
  }
  const text = buffer.toString('utf8');
  if (/vbaProject|macrosheet|javascript:|<\s*script/i.test(text)) {
    throw new AppError('O ficheiro contém conteúdo recusado.', 400, { code: 'FILE_REJECTED' });
  }

  const table = parseCsv(text);
  if (!table.length) throw new AppError('O ficheiro está vazio.', 400, { code: 'EMPTY_FILE' });
  const header = table[0].map((h) => String(h || '').trim().toLowerCase());
  if (!header.includes('nome') && !header.includes('nif')) {
    throw new AppError('Cabeçalho inválido. Use o modelo exportado (colunas nome e nif).', 400, {
      code: 'BAD_HEADER',
    });
  }
  const dataRows = table.slice(1, MAX_ROWS + 1);
  const hasSecrets = dataRows.some((cells) => {
    const row = rowToObject(header, cells);
    return CATALOG_PORTAL_KEYS.some((key) => filled(row[PORTAL_COLS[key].pass]));
  });
  const report = { created: 0, updated: 0, skipped: 0, errors: [] };
  let unlock = null;
  if (hasSecrets) {
    const sensitive = require('../security/sensitive-action.service');
    unlock = await sensitive.assertVaultSensitiveUnlock({
      firmId,
      userId: actorId,
      purpose: sensitive.SENSITIVE_PURPOSES.VAULT_IMPORT,
      totpCode,
      currentPassword,
      stepUpToken,
      rememberSession: Boolean(rememberSession),
    });
  }

  const existing = await listAllClients(firmId);
  const byNif = new Map();
  for (const c of existing) {
    const nif = digitsOnly(c.taxId);
    if (nif) byNif.set(nif, c);
  }

  let activeCount = await clientsRepository.countClients(firmId, { includeInactive: false });

  for (let i = 0; i < dataRows.length; i += 1) {
    const line = i + 2;
    const row = rowToObject(header, dataRows[i]);
    try {
      const displayName = row.nome || row.razao_social;
      const nifRaw = row.nif ? digitsOnly(row.nif) : '';
      if (!filled(displayName) && !nifRaw) {
        report.skipped += 1;
        continue;
      }
      if (nifRaw && !isValidNIF(nifRaw)) {
        report.errors.push({ line, message: 'NIF inválido — linha ignorada.' });
        report.skipped += 1;
        continue;
      }
      const found = nifRaw ? byNif.get(nifRaw) : null;
      const metadataPatch = metadataFromRow(row);

      if (found) {
        const nextMeta = Object.keys(metadataPatch).length
          ? mergeMetadata(found.metadata, metadataPatch)
          : found.metadata;
        if (metadataPatch.address && found.metadata?.address && typeof found.metadata.address === 'object') {
          nextMeta.address = { ...found.metadata.address, ...metadataPatch.address };
        }
        const patch = {};
        if (Object.keys(metadataPatch).length) patch.metadata = nextMeta;
        if (filled(displayName)) patch.displayName = displayName;
        if (filled(row.email)) patch.email = row.email;
        if (filled(row.telefone)) patch.phone = row.telefone;
        let wrote = false;
        if (Object.keys(patch).length) {
          await clientsRepository.updateClient(found.id, firmId, patch);
          found.metadata = patch.metadata || found.metadata;
          wrote = true;
        }
        const secretsWrote = await upsertPortalSecrets({ firmId, clientId: found.id, actorId, row });
        if (wrote || secretsWrote) report.updated += 1;
        else report.skipped += 1;
      } else {
        if (!filled(displayName)) {
          report.skipped += 1;
          continue;
        }
        await entitlements.assertWithinLimit(firmId, 'max_clients', activeCount);
        const created = await clientsRepository.createClient({
          firmId,
          displayName,
          email: filled(row.email) ? row.email : null,
          phone: filled(row.telefone) ? row.telefone : null,
          taxId: nifRaw || null,
          metadata: Object.keys(metadataPatch).length ? metadataPatch : undefined,
        });
        activeCount += 1;
        if (nifRaw) byNif.set(nifRaw, created);
        await upsertPortalSecrets({ firmId, clientId: created.id, actorId, row });
        report.created += 1;
      }
    } catch (err) {
      report.errors.push({ line, message: err?.message || 'Linha recusada.' });
      report.skipped += 1;
    }
  }

  if (unlock?.stepUpToken) {
    report.stepUpToken = unlock.stepUpToken;
    report.stepUpExpiresAt = unlock.stepUpExpiresAt || null;
  }
  return report;
}

module.exports = {
  buildExportCsv,
  buildTemplateCsv,
  importCsv,
  sanitizeCell,
  parseCsv,
  HEADERS,
};
