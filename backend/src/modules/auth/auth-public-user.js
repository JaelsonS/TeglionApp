const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmBrandingService = require('../firm/firm-branding.service');

async function resolvePublicTenant(firmId) {
  if (!firmId) {
    return { slug: 'escritorio', name: 'Escritório', logoUrl: null };
  }
  const firm = await firmsRepository.findFirmById(String(firmId));
  if (!firm) {
    return { slug: 'escritorio', name: 'Escritório', logoUrl: null };
  }
  let logoUrl = null;
  try {
    logoUrl = await firmBrandingService.resolveLogoUrl(firm);
  } catch {
    logoUrl = firm.settings?.branding?.logoUrl || null;
  }
  return {
    slug: String(firm.slug || '').trim() || 'escritorio',
    name: String(firm.name || 'Escritório').trim(),
    logoUrl,
  };
}

async function toPublicAuthUser(user) {
  if (!user || typeof user !== 'object') return user;
  const tenant = await resolvePublicTenant(user.firmId);
  const out = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    permissions: user.permissions || [],
    isActive: user.isActive !== false,
    tenant,
  };
  if (user.role === 'CLIENT') {
    out.clientId = user.clientId || user.id;
  }
  if (user.masterAccess) out.masterAccess = true;
  if (user.firmRole) out.firmRole = user.firmRole;
  if (user.consultantId) out.consultantId = user.consultantId;
  if (user.avatarUrl) out.avatarUrl = user.avatarUrl;
  if (user.onboardingCompleted != null) out.onboardingCompleted = Boolean(user.onboardingCompleted);
  return out;
}

module.exports = {
  resolvePublicTenant,
  toPublicAuthUser,
};
