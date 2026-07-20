const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const { AppError } = require('../../middlewares/error.middleware');

const SETTINGS_KEY = 'caeHistory';
const MAX_ITEMS = 40;
const MAX_LENGTH = 120;

function normalizeCae(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_LENGTH);
}

function dedupePreserveOrder(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values) {
    const value = normalizeCae(raw);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function readStoredHistory(firm) {
  const raw = firm?.settings?.[SETTINGS_KEY];
  if (!Array.isArray(raw)) return [];
  return dedupePreserveOrder(raw).slice(0, MAX_ITEMS);
}

function collectFromClients(clients) {
  const values = [];
  for (const client of clients || []) {
    const meta = client?.metadata || {};
    if (meta.caePrimary) values.push(meta.caePrimary);
    if (Array.isArray(meta.caeSecondary)) {
      for (const item of meta.caeSecondary) values.push(item);
    }
  }
  return values;
}

async function listCaeHistory({ firmId }) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);

  const stored = readStoredHistory(firm);
  const clients = await clientsRepository.listClients(firmId, { limit: 500, includeInactive: true });
  const fromClients = collectFromClients(clients);
  const items = dedupePreserveOrder([...stored, ...fromClients]).slice(0, MAX_ITEMS);

  return { items };
}

async function rememberCae({ firmId, cae }) {
  const value = normalizeCae(cae);
  if (!value) throw new AppError('CAE obrigatório', 400);

  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);

  const current = readStoredHistory(firm);
  const next = dedupePreserveOrder([value, ...current]).slice(0, MAX_ITEMS);
  await firmsRepository.mergeSettingsKey(firmId, SETTINGS_KEY, next);
  return { items: next };
}

module.exports = {
  listCaeHistory,
  rememberCae,
  _test: {
    normalizeCae,
    dedupePreserveOrder,
    SETTINGS_KEY,
    MAX_ITEMS,
  },
};
