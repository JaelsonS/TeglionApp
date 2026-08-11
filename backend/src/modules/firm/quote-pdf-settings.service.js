/**
 * Textos configuráveis do PDF de orçamento (Central de Serviços) — mesmo
 * padrão de firm.settings.booking: JSONB dentro de `firms.settings`, sem
 * tabela própria. Cada escritório configura os seus próprios textos, uma vez
 * só, reaproveitados em todos os orçamentos que gerar — nunca hardcoded para
 * um único escritório (SaaS genérico).
 */
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');

const MAX_LEN = 2000;

function normalizeQuotePdfSettings(value) {
  const src = value && typeof value === 'object' ? value : {};
  const out = {};
  for (const key of ['introText', 'termsText', 'footerText']) {
    if (src[key] == null) continue;
    const text = String(src[key]).trim().slice(0, MAX_LEN);
    if (text) out[key] = text;
  }
  return out;
}

async function getQuotePdfSettings(firmId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  return normalizeQuotePdfSettings(firm.settings?.quotePdf);
}

async function updateQuotePdfSettings(firmId, patch) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  const prev = normalizeQuotePdfSettings(firm.settings?.quotePdf);
  const next = normalizeQuotePdfSettings({ ...prev, ...(patch || {}) });
  await firmsRepository.mergeSettingsKey(firmId, 'quotePdf', next);
  return next;
}

module.exports = { getQuotePdfSettings, updateQuotePdfSettings, normalizeQuotePdfSettings };
