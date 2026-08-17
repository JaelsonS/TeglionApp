/**
 * Camada comercial futura (planos / add-ons / limites / overrides).
 * Nesta fase: modo open — tudo permitido. NÃO espalhar if (plan === ...) no resto do código.
 * Chamar sempre can(firmId, featureKey) nos pontos sensíveis (ex.: payments.online).
 */

const OPEN_FEATURES = new Set([
  'payments.online',
  'public_page',
  'ai',
  'custom_domain',
]);

/**
 * Features conhecidas que no modo open continuam bloqueadas.
 * `hide_teglion_branding` existe para white-label futuro — hoje o crédito
 * Teglion permanece visível em todos os escritórios.
 */
const OPEN_LOCKED = new Set(['hide_teglion_branding']);

/**
 * @param {string} _firmId
 * @param {string} featureKey
 * @returns {Promise<{ allowed: boolean, reason: string, source: string }>}
 */
async function can(_firmId, featureKey) {
  const key = String(featureKey || '').trim();
  if (!key) {
    return { allowed: false, reason: 'MISSING_FEATURE', source: 'open' };
  }
  if (OPEN_LOCKED.has(key)) {
    return { allowed: false, reason: 'OPEN_MODE_LOCKED', source: 'open' };
  }
  // Modo open: features conhecidas e desconhecidas permitidas para não bloquear o piloto.
  if (OPEN_FEATURES.has(key) || key.length > 0) {
    return { allowed: true, reason: 'OPEN_MODE', source: 'open' };
  }
  return { allowed: false, reason: 'DENIED', source: 'open' };
}

/**
 * @param {string} _firmId
 * @param {string} _resourceKey
 * @returns {Promise<number|null>} null = ilimitado
 */
async function limit(_firmId, _resourceKey) {
  return null;
}

/** Crédito «Página criada com Teglion» — visível enquanto hide_teglion_branding estiver bloqueado. */
async function showTeglionBranding(firmId) {
  const r = await can(firmId, 'hide_teglion_branding');
  return !r.allowed;
}

module.exports = { can, limit, showTeglionBranding, OPEN_FEATURES, OPEN_LOCKED };
