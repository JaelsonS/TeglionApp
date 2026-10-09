const entitlementsService = require('../entitlements/entitlements.service');
const { isDemoOfficeEnabled, parseDemoFirmAllowlist } = require('./demo-office.service');

const SUPPORTED_COUNTRIES = ['PT', 'BR'];

async function getMayaSetupCapabilities(firmId) {
  let aiSetup = false;
  try {
    const allow = parseDemoFirmAllowlist();
    if (allow.length && allow.includes(String(firmId))) {
      aiSetup = true;
    } else {
      const r = await entitlementsService.can(firmId, 'ai');
      aiSetup = Boolean(r.allowed);
    }
  } catch {
    aiSetup = false;
  }

  const demoAllow = parseDemoFirmAllowlist();
  const demoOffice =
    isDemoOfficeEnabled() && (!demoAllow.length || demoAllow.includes(String(firmId)));

  return {
    aiSetup,
    /** Maya guia (estática) — sempre disponível na app; não consome OpenAI. */
    mayaGuideIncluded: true,
    /** Respostas generativas / Setup IA — add-on ou piloto. */
    mayaGenerativeRequiresEntitlement: true,
    demoOffice,
    supportedCountries: SUPPORTED_COUNTRIES,
    phases: {
      mediaUploads: true,
      serviceImages: true,
      firmContactSync: true,
      richPreview: true,
      activationAssistant: true,
      clientsCsvImport: true,
      demoOfficeClients: demoOffice,
    },
  };
}

module.exports = { getMayaSetupCapabilities, SUPPORTED_COUNTRIES };
