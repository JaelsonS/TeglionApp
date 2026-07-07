const LEGAL_VERSIONS = Object.freeze({
  terms: '2026.05.22',
  privacy: '2026.05.22',
  dpa: '2026.05.22',
  cookies: '2026.05.22',
  notice: '2026.05.22',
});

const REQUIRED_FIRM_CONSENTS = ['terms', 'privacy', 'dpa', 'cookies'];

module.exports = { LEGAL_VERSIONS, REQUIRED_FIRM_CONSENTS };
