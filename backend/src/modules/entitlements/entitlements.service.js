/**
 * Planos comerciais: features (can) + tectos de recursos (limit).
 * Não espalhar `if (plan === ...)` no resto do código — usar can / limit / assertWithinLimit.
 */

const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');

const OPEN_FEATURES = new Set([
  'payments.online',
  'public_page',
  'ai',
  'custom_domain',
]);

/**
 * Features conhecidas que continuam bloqueadas até add-on.
 * `hide_teglion_branding` — crédito Teglion visível em todos os escritórios.
 */
const OPEN_LOCKED = new Set(['hide_teglion_branding']);

function envPositiveInt(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function limitsForStatus(status) {
  const band = String(status || 'TRIAL').toUpperCase() === 'ACTIVE' ? 'active' : 'trial';
  if (band === 'active') {
    return {
      max_clients: envPositiveInt('FIRM_LIMIT_CLIENTS_ACTIVE', 250),
      max_staff: envPositiveInt('FIRM_LIMIT_STAFF_ACTIVE', 10),
    };
  }
  return {
    max_clients: envPositiveInt('FIRM_LIMIT_CLIENTS_TRIAL', 40),
    max_staff: envPositiveInt('FIRM_LIMIT_STAFF_TRIAL', 4),
  };
}

/**
 * @param {string} _firmId
 * @param {string} featureKey
 * @returns {Promise<{ allowed: boolean, reason: string, source: string }>}
 */
async function can(_firmId, featureKey) {
  const key = String(featureKey || '').trim();
  if (!key) {
    return { allowed: false, reason: 'MISSING_FEATURE', source: 'plan' };
  }
  if (OPEN_LOCKED.has(key)) {
    return { allowed: false, reason: 'FEATURE_LOCKED', source: 'plan' };
  }
  if (OPEN_FEATURES.has(key) || key.length > 0) {
    return { allowed: true, reason: 'PLAN_INCLUDED', source: 'plan' };
  }
  return { allowed: false, reason: 'DENIED', source: 'plan' };
}

/**
 * @param {string} firmId
 * @param {string} resourceKey
 * @returns {Promise<number|null>} null = ilimitado / recurso desconhecido
 */
async function limit(firmId, resourceKey) {
  const key = String(resourceKey || '').trim();
  if (!key) return null;
  const firm = await firmsRepository.findFirmById(firmId);
  const caps = limitsForStatus(firm?.status);
  if (!Object.prototype.hasOwnProperty.call(caps, key)) return null;
  return caps[key];
}

/**
 * @param {string} firmId
 * @param {string} resourceKey
 * @param {number} currentCount
 */
async function assertWithinLimit(firmId, resourceKey, currentCount) {
  const max = await limit(firmId, resourceKey);
  if (max == null) return;
  const n = Number(currentCount) || 0;
  if (n >= max) {
    throw new AppError(
      `Limite do plano atingido (${resourceKey.replace('max_', '')}: ${max}). Actualize a subscrição ou contacte o suporte.`,
      403,
      { code: 'PLAN_LIMIT', resourceKey, max, current: n },
    );
  }
}

/** Crédito «Página criada com Teglion» — visível enquanto hide_teglion_branding estiver bloqueado. */
async function showTeglionBranding(firmId) {
  const r = await can(firmId, 'hide_teglion_branding');
  return !r.allowed;
}

module.exports = {
  can,
  limit,
  limitsForStatus,
  assertWithinLimit,
  showTeglionBranding,
  OPEN_FEATURES,
  OPEN_LOCKED,
};
