const contabilStorage = require('../../services/storage/contabil-storage.service');
const firmBrandingService = require('./firm-branding.service');

const LOGO_SOURCES = new Set(['firm', 'custom', 'none']);
const LOGO_ZONES = new Set(['header', 'hero']);
const PUBLIC_SITE_IMAGE_SIGNED_TTL = 60 * 60 * 24 * 7;

function normalizeLogoSource(value) {
  return LOGO_SOURCES.has(value) ? value : 'firm';
}

function normalizeThemeLogos(rawTheme) {
  const theme = rawTheme && typeof rawTheme === 'object' ? rawTheme : {};
  let headerLogoSource = theme.headerLogoSource ? normalizeLogoSource(theme.headerLogoSource) : null;
  let heroLogoSource = theme.heroLogoSource ? normalizeLogoSource(theme.heroLogoSource) : null;
  const logoStorageKey = theme.logoStorageKey ? String(theme.logoStorageKey).trim().slice(0, 300) : null;
  const headerLogoStorageKey = theme.headerLogoStorageKey
    ? String(theme.headerLogoStorageKey).trim().slice(0, 300)
    : null;
  const heroLogoStorageKey = theme.heroLogoStorageKey ? String(theme.heroLogoStorageKey).trim().slice(0, 300) : null;

  if (!headerLogoSource || !heroLogoSource) {
    if (logoStorageKey || headerLogoStorageKey || heroLogoStorageKey) {
      headerLogoSource = headerLogoSource || (headerLogoStorageKey || logoStorageKey ? 'custom' : 'firm');
      heroLogoSource = heroLogoSource || (heroLogoStorageKey || logoStorageKey ? 'custom' : 'firm');
    } else {
      headerLogoSource = headerLogoSource || 'firm';
      heroLogoSource = heroLogoSource || 'firm';
    }
  }

  return {
    headerLogoSource,
    heroLogoSource,
    logoStorageKey,
    headerLogoStorageKey,
    heroLogoStorageKey,
  };
}

async function signLogoKey(key) {
  if (!key) return null;
  try {
    return await contabilStorage.createSignedDownloadUrl(key, PUBLIC_SITE_IMAGE_SIGNED_TTL);
  } catch {
    return null;
  }
}

async function resolveFirmLogoUrl(firm) {
  try {
    return await firmBrandingService.resolveLogoUrl(firm);
  } catch {
    return firm?.settings?.branding?.logoUrl || null;
  }
}

/** Resolve logótipo por zona (barra vs destaque). */
async function resolvePublicSiteZoneLogoUrl(zone, config, firm) {
  const safeZone = LOGO_ZONES.has(zone) ? zone : 'header';
  const logos = normalizeThemeLogos(config?.theme);
  const source = safeZone === 'header' ? logos.headerLogoSource : logos.heroLogoSource;
  const zoneKey = safeZone === 'header' ? logos.headerLogoStorageKey : logos.heroLogoStorageKey;
  const sharedKey = logos.logoStorageKey;

  if (source === 'none') return null;
  if (source === 'custom') {
    const key = zoneKey || sharedKey;
    const signed = await signLogoKey(key);
    if (signed) return signed;
    return null;
  }
  return resolveFirmLogoUrl(firm);
}

/** Compat: uma URL — preferência barra. */
async function resolvePublicSiteLogoUrl(config, firm) {
  return resolvePublicSiteZoneLogoUrl('header', config, firm);
}

async function resolveThemeLogoPreviewUrls(theme) {
  const logos = normalizeThemeLogos(theme);
  const headerUrl = logos.headerLogoSource === 'custom'
    ? await signLogoKey(logos.headerLogoStorageKey || logos.logoStorageKey)
    : null;
  const heroUrl = logos.heroLogoSource === 'custom'
    ? await signLogoKey(logos.heroLogoStorageKey || logos.logoStorageKey)
    : null;
  return {
    headerLogoUrl: headerUrl,
    heroLogoUrl: heroUrl,
    logoUrl: headerUrl || heroUrl,
  };
}

module.exports = {
  LOGO_SOURCES,
  LOGO_ZONES,
  normalizeLogoSource,
  normalizeThemeLogos,
  resolvePublicSiteZoneLogoUrl,
  resolvePublicSiteLogoUrl,
  resolveThemeLogoPreviewUrls,
  resolveFirmLogoUrl,
  signLogoKey,
  PUBLIC_SITE_IMAGE_SIGNED_TTL,
};
