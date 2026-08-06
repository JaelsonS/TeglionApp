const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const contabilStorage = require('../../services/storage/contabil-storage.service');

const LOGO_SIGNED_TTL = 86400;

/**
 * URLs assinadas do Supabase Storage expiram (LOGO_SIGNED_TTL = 24h) — nunca
 * devolver a `logoUrl` guardada como se fosse permanente. Sempre que existir
 * `logoStorageKey`, gera uma URL assinada nova nesta chamada; só cai para a
 * `logoUrl` guardada se não houver storage key (não deveria acontecer no fluxo
 * actual — só upload gera logo — mas mantém-se como fallback defensivo).
 */
async function resolveLogoUrl(firm) {
  const branding = firm?.settings?.branding || {};
  const key = branding.logoStorageKey;
  if (key) {
    try {
      return await contabilStorage.createSignedDownloadUrl(key, LOGO_SIGNED_TTL);
    } catch {
      // cai para o fallback abaixo se a geração falhar (ex.: ficheiro removido do storage)
    }
  }
  if (branding.logoUrl && /^https?:\/\//i.test(String(branding.logoUrl))) {
    return String(branding.logoUrl);
  }
  return null;
}

async function getFirmProfile(firmId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  const logoUrl = await resolveLogoUrl(firm);
  const branding = { ...(firm.settings?.branding || {}), logoUrl };
  return {
    firm: {
      id: firm.id,
      _id: firm.id,
      name: firm.name,
      status: firm.status,
      countryCode: firm.countryCode,
      settings: firm.settings,
      branding,
    },
    logoUrl,
  };
}

async function uploadFirmLogo({ firmId, file }) {
  if (!file?.buffer?.length) throw new AppError('Selecione uma imagem (JPG, PNG ou WebP).', 400);
  const uploaded = await contabilStorage.uploadFirmLogo({ firmId, file });
  const logoUrl = await contabilStorage.createSignedDownloadUrl(uploaded.path, LOGO_SIGNED_TTL);
  const firm = await firmsRepository.updateFirmBranding(firmId, {
    logoStorageKey: uploaded.path,
    logoUrl,
    logoUpdatedAt: new Date().toISOString(),
  });
  return {
    firm: {
      id: firm.id,
      name: firm.name,
      branding: { ...(firm.settings?.branding || {}), logoUrl },
    },
    logoUrl,
  };
}

async function removeFirmLogo({ firmId }) {
  const existing = await firmsRepository.findFirmById(firmId);
  if (!existing) throw new AppError('Escritório não encontrado', 404);
  const storageKey = existing.settings?.branding?.logoStorageKey;
  if (storageKey) {
    try {
      await contabilStorage.deleteObject(storageKey);
    } catch {
      /* mantém remoção na BD mesmo se o ficheiro já não existir */
    }
  }
  const firm = await firmsRepository.clearFirmLogoBranding(firmId);
  return {
    firm: {
      id: firm.id,
      name: firm.name,
      branding: { ...(firm.settings?.branding || {}), logoUrl: null },
    },
    logoUrl: null,
  };
}

module.exports = {
  getFirmProfile,
  uploadFirmLogo,
  removeFirmLogo,
  resolveLogoUrl,
};
