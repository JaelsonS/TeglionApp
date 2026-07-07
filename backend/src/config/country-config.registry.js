const { AppError } = require('../middlewares/error.middleware');
const PT = require('./country-configs/pt.config');
const BR = require('./country-configs/br.config');

const REGISTRY = Object.freeze({ PT, BR });

const SUPPORTED_CODES = Object.freeze(Object.keys(REGISTRY));

function normalizeCountryCode(countryCode, { defaultCode = 'PT' } = {}) {
  const raw = String(countryCode || defaultCode).trim().toUpperCase();
  return raw || defaultCode;
}

function resolveCountryConfig(countryCode, { defaultCode = 'PT' } = {}) {
  const code = normalizeCountryCode(countryCode, { defaultCode });
  const config = REGISTRY[code];
  if (!config) {
    throw new AppError('País não suportado', 400, { code: 'UNSUPPORTED_COUNTRY', supported: SUPPORTED_CODES });
  }
  return config;
}

function listSupportedCountries() {
  return SUPPORTED_CODES.map((code) => {
    const c = REGISTRY[code];
    return {
      code: c.code,
      name: c.name,
      locale: c.locale,
      currency: c.currency,
      taxIdLabel: c.taxId.label,
      features: c.features,
    };
  });
}

function isSupportedCountry(countryCode) {
  const code = normalizeCountryCode(countryCode, { defaultCode: '' });
  return Boolean(code && REGISTRY[code]);
}

module.exports = {
  REGISTRY,
  SUPPORTED_CODES,
  normalizeCountryCode,
  resolveCountryConfig,
  listSupportedCountries,
  isSupportedCountry,
};
