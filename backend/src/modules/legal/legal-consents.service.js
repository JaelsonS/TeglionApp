const { AppError } = require('../../middlewares/error.middleware');
const { LEGAL_VERSIONS, REQUIRED_FIRM_CONSENTS } = require('../../constants/legal-versions');
const legalConsentsRepository = require('../../db/supabase/repositories/legal-consents.repository');

function buildConsentBundle(versions) {
  return REQUIRED_FIRM_CONSENTS.map((k) => `${k}:${versions[k]}`).join('|');
}

function validateFirmLegalPayload(payload) {
  const consents = payload?.legalConsents || payload;
  if (!consents || typeof consents !== 'object') {
    throw new AppError('Consentimentos legais obrigatórios', 400, { code: 'LEGAL_CONSENT_REQUIRED' });
  }

  const accepted = {
    terms: consents.terms === true || consents.acceptedTerms === true,
    privacy: consents.privacy === true || consents.acceptedPrivacy === true,
    dpa: consents.dpa === true || consents.acceptedDpa === true,
    cookies: consents.cookies === true || consents.acceptedCookies === true,
  };

  for (const key of REQUIRED_FIRM_CONSENTS) {
    if (!accepted[key]) {
      throw new AppError(`É obrigatório aceitar o documento: ${key}`, 400, { code: 'LEGAL_CONSENT_INCOMPLETE' });
    }
  }

  const versions = consents.versions || {};
  for (const key of REQUIRED_FIRM_CONSENTS) {
    const v = versions[key] || LEGAL_VERSIONS[key];
    if (v !== LEGAL_VERSIONS[key]) {
      throw new AppError(
        'Versão dos documentos legais desactualizada. Actualize a página e aceite novamente.',
        409,
        { code: 'LEGAL_VERSION_MISMATCH', expected: LEGAL_VERSIONS, received: versions },
      );
    }
  }

  return {
    termsVersion: LEGAL_VERSIONS.terms,
    privacyVersion: LEGAL_VERSIONS.privacy,
    dpaVersion: LEGAL_VERSIONS.dpa,
    cookiesVersion: LEGAL_VERSIONS.cookies,
    acceptedTerms: true,
    acceptedPrivacy: true,
    acceptedDpa: true,
    acceptedCookies: true,
  };
}

async function recordFirmOwnerConsent({ firmId, firmUserId, payload, ipAddress, userAgent }) {
  const consentPayload =
    payload && typeof payload === 'object'
      ? (({ ipAddress: _i, userAgent: _u, ...rest }) => rest)(payload)
      : payload;
  const validated = validateFirmLegalPayload(consentPayload);
  const row = await legalConsentsRepository.insertConsent({
    firm_id: firmId,
    firm_user_id: firmUserId,
    account_type: 'FIRM',
    terms_version: validated.termsVersion,
    privacy_version: validated.privacyVersion,
    dpa_version: validated.dpaVersion,
    cookies_version: validated.cookiesVersion,
    accepted_terms: validated.acceptedTerms,
    accepted_privacy: validated.acceptedPrivacy,
    accepted_dpa: validated.acceptedDpa,
    accepted_cookies: validated.acceptedCookies,
    accepted_at: new Date().toISOString(),
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  const bundle = buildConsentBundle(LEGAL_VERSIONS);
  await legalConsentsRepository.updateFirmUserConsentBundle(firmUserId, bundle);

  return { consent: row, versions: LEGAL_VERSIONS };
}

function getPublicVersions() {
  const { env } = require('../../config/env');
  const { BRAND } = require('../../config/brand');
  return {
    versions: LEGAL_VERSIONS,
    operator: {
      name: env.LEGAL_OPERATOR_NAME || BRAND.name,
      nif: env.LEGAL_OPERATOR_NIF || null,
      email: env.LEGAL_OPERATOR_EMAIL || env.FROM_EMAIL || BRAND.emails.hello,
      phone: env.LEGAL_OPERATOR_PHONE || null,
      location: env.LEGAL_OPERATOR_LOCATION || null,
      cae: env.LEGAL_OPERATOR_CAE || null,
    },
    required: REQUIRED_FIRM_CONSENTS,
  };
}

function firmUserNeedsReconsent(legalConsentBundle) {
  if (!legalConsentBundle) return true;
  const expected = buildConsentBundle(LEGAL_VERSIONS);
  return legalConsentBundle !== expected;
}

module.exports = {
  recordFirmOwnerConsent,
  validateFirmLegalPayload,
  getPublicVersions,
  firmUserNeedsReconsent,
  LEGAL_VERSIONS,
};
