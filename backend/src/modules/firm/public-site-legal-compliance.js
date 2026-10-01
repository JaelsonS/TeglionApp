const { normalizeHttpsUrlOrNull } = require('../../utils/safe-url');
const {
  DEFAULT_TERMS_TEMPLATE,
  DEFAULT_PRIVACY_TEMPLATE,
} = require('./public-site-legal-templates');

function norm(text) {
  return String(text ?? '').trim();
}

function isPolicyConfigured(text) {
  const t = norm(text);
  if (!t) return false;
  if (t === norm(DEFAULT_TERMS_TEMPLATE)) return false;
  if (t === norm(DEFAULT_PRIVACY_TEMPLATE)) return false;
  return true;
}

function evaluatePublicSiteLegalGaps(config) {
  const gaps = [];
  const c = config && typeof config === 'object' ? config : {};

  if (!normalizeHttpsUrlOrNull(c.complaintsBookUrl)) {
    gaps.push('complaintsBook');
  }
  if (!isPolicyConfigured(c.termsText)) {
    gaps.push('terms');
  }
  if (!isPolicyConfigured(c.privacyText)) {
    gaps.push('privacy');
  }
  return gaps;
}

function parseLegalPublishAcknowledgement(body) {
  const raw = body?.legalPublishAcknowledgement;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.accepted !== true) return null;
  const missingItems = Array.isArray(raw.missingItems)
    ? raw.missingItems.map((id) => String(id)).filter(Boolean)
    : [];
  return { accepted: true, missingItems };
}

module.exports = {
  evaluatePublicSiteLegalGaps,
  parseLegalPublishAcknowledgement,
};
