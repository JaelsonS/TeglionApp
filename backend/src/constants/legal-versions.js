const LEGAL_VERSIONS = Object.freeze({
  terms: '2026.08.18',
  privacy: '2026.08.18',
  dpa: '2026.08.18',
  cookies: '2026.08.18',
  notice: '2026.08.18',
});

const REQUIRED_FIRM_CONSENTS = ['terms', 'privacy', 'dpa', 'cookies'];

module.exports = { LEGAL_VERSIONS, REQUIRED_FIRM_CONSENTS };
