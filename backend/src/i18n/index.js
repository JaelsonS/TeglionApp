const ptPT = require('./locales/pt-PT');

/** TegLion — pt-PT only (multilíngue = fase futura). */
const DEFAULT_LOCALE = 'pt-PT';
const SUPPORTED_LOCALES = ['pt-PT'];

const dictionaries = {
  'pt-PT': ptPT,
};

function normalizeLocale(_raw) {
  return DEFAULT_LOCALE;
}

function parseAcceptLanguage(_headerValue) {
  return DEFAULT_LOCALE;
}

function resolveRequestLocale(_req) {
  return DEFAULT_LOCALE;
}

function getByPath(object, keyPath) {
  return String(keyPath || '')
    .split('.')
    .reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), object);
}

function formatTemplate(template, vars = {}) {
  return String(template).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function hasTranslation(_locale, key) {
  return getByPath(dictionaries[DEFAULT_LOCALE], key) !== undefined;
}

function t(_locale, key, vars = {}) {
  const message = getByPath(dictionaries[DEFAULT_LOCALE], key) ?? key;
  return formatTemplate(message, vars);
}

module.exports = {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  resolveRequestLocale,
  parseAcceptLanguage,
  hasTranslation,
  t,
};
