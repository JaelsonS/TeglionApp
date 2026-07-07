const { env } = require('./env');

const PRODUCT_MODES = ['contabil'];

function normalizeProductMode(raw) {
  const value = String(raw || 'contabil').trim().toLowerCase();
  return PRODUCT_MODES.includes(value) ? value : 'contabil';
}

function isContabilMode() {
  return normalizeProductMode(env.PRODUCT_MODE) === 'contabil';
}

module.exports = {
  PRODUCT_MODES,
  normalizeProductMode,
  isContabilMode,
};
