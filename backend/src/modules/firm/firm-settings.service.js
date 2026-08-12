const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const departmentsRepository = require('../../db/supabase/repositories/departments.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const firmBrandingService = require('./firm-branding.service');
const securityAudit = require('../../services/audit/security-audit.service');
const { hasPermissionForUser, PERMISSIONS } = require('../../utils/permissions');
const { normalizeSessionRole } = require('../../utils/session-user');
const { hashPassword, verifyPassword } = require('../../utils/password-crypto');
const { assertStrongPassword } = require('../../utils/password-policy');

function actorPermissionUser(actor) {
  const role = firmUsersRepository.jwtRoleFromFirmRole(actor.role);
  const override = Array.isArray(actor.permissions_override) ? actor.permissions_override : null;
  return {
    role: normalizeSessionRole(role),
    permissions: override && override.length > 0 ? override : undefined,
    masterAccess: actor.role === 'FIRM_OWNER',
  };
}

const FIRM_ROLE_LABELS = {
  FIRM_OWNER: 'Dono do escritório',
  FIRM_STAFF: 'Equipa',
  FIRM_CONSULTANT: 'Consultor',
};

function mapTeamMember(row, currentUserId, departmentName = null) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName || row.full_name || '',
    role: row.role,
    roleLabel: FIRM_ROLE_LABELS[row.role] || row.role,
    jobTitle: row.jobTitle || null,
    departmentId: row.departmentId || null,
    departmentName,
    isActive: row.isActive !== false && row.is_active !== false,
    isCurrentUser: String(row.id) === String(currentUserId),
    isOwner: row.role === 'FIRM_OWNER',
  };
}

async function getSettingsBundle(firmId, actorUserId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);

  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId)) {
    throw new AppError('Utilizador não pertence a este escritório', 403);
  }

  const profile = await firmBrandingService.getFirmProfile(firmId);
  const [team, departments] = await Promise.all([
    firmUsersRepository.listFirmUsers(firmId, { activeOnly: true }),
    departmentsRepository.listDepartments(firmId, { activeOnly: false }),
  ]);
  const settings = firm.settings || {};
  const contact = settings.contact || {};
  const departmentMap = new Map(departments.map((d) => [String(d.id), d.name]));
  const actorDepartmentName = actor.department_id ? departmentMap.get(String(actor.department_id)) || null : null;

  return {
    firm: {
      ...profile.firm,
      slug: firm.slug,
      trialEndsAt: firm.trialEndsAt,
      billingPlan: firm.billingPlan || null,
    },
    logoUrl: profile.logoUrl,
    contact: {
      email: contact.email || null,
      phone: contact.phone || null,
      taxId: contact.taxId || null,
      address: contact.address || null,
    },
    branding: {
      primaryColor: settings.branding?.primaryColor || null,
      secondaryColor: settings.branding?.secondaryColor || null,
    },
    publicProfile: {
      tagline: settings.publicProfile?.tagline || null,
      bio: settings.publicProfile?.bio || null,
      socialLinks: settings.publicProfile?.socialLinks || {},
      faqs: settings.publicProfile?.faqs || [],
    },
    actor: {
      id: actor.id,
      email: actor.email,
      fullName: actor.full_name,
      firmRole: actor.role,
      firmRoleLabel: FIRM_ROLE_LABELS[actor.role] || actor.role,
      jobTitle: actor.job_title || null,
      departmentId: actor.department_id || null,
      departmentName: actorDepartmentName,
      isOwner: actor.role === 'FIRM_OWNER',
      hasPassword: Boolean(actor.password_hash),
      ssoProvider: actor.sso_provider || null,
    },
    team: team.map((m) => mapTeamMember(m, actorUserId, m.departmentId ? departmentMap.get(String(m.departmentId)) || null : null)),
    capabilities: {
      canEditFirm: actor.role === 'FIRM_OWNER',
      // Alinha com RBAC real (USERS_CREATE / FIRM_INVITES_MANAGE), não só FIRM_OWNER.
      canManageTeam:
        hasPermissionForUser(actorPermissionUser(actor), PERMISSIONS.USERS_CREATE) ||
        hasPermissionForUser(actorPermissionUser(actor), PERMISSIONS.FIRM_INVITES_MANAGE) ||
        hasPermissionForUser(actorPermissionUser(actor), PERMISSIONS.FIRM_TEAM_MANAGE),
      canCloseAccount: actor.role === 'FIRM_OWNER',
      canEditOwnProfile: true,
    },
  };
}

async function updateFirmDetails(firmId, actorUserId, payload) {
  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.role !== 'FIRM_OWNER') {
    throw new AppError('Apenas o dono do escritório pode alterar estes dados.', 403);
  }

  const name = payload.name != null ? String(payload.name).trim() : null;
  if (name !== null && name.length < 2) {
    throw new AppError('Indique o nome do escritório (mínimo 2 caracteres).', 400);
  }

  const current = await firmsRepository.findFirmById(firmId);
  const contact = { ...((current?.settings || {}).contact || {}) };
  if (payload.contactEmail != null) contact.email = String(payload.contactEmail).trim() || null;
  if (payload.contactPhone != null) contact.phone = String(payload.contactPhone).trim() || null;
  if (payload.taxId != null) contact.taxId = String(payload.taxId).trim() || null;
  if (payload.address != null) contact.address = String(payload.address).trim() || null;

  let nextSlug;
  if (payload.slug != null) {
    nextSlug = normalizeFirmSlug(payload.slug);
    if (!nextSlug) {
      throw new AppError('Link inválido. Use letras minúsculas, números e hífens (3–60 caracteres).', 400);
    }
    if (nextSlug !== current.slug) {
      const taken = await firmsRepository.slugExists(nextSlug);
      if (taken) {
        throw new AppError('Este link já está em uso. Escolha outro.', 409, { code: 'SLUG_TAKEN' });
      }
    }
  }

  const updated = await firmsRepository.updateFirm(firmId, {
    name: name ?? undefined,
    slug: nextSlug,
    settingsMerge: { contact },
  });

  return firmBrandingService.getFirmProfile(firmId).then((p) => ({
    firm: { ...p.firm, slug: updated.slug },
    logoUrl: p.logoUrl,
  }));
}

function normalizeFirmSlug(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  if (s.length < 3) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

async function updateMyProfile(firmId, userId, { fullName, email }) {
  const actor = await firmUsersRepository.findFirmUserById(userId);
  if (!actor || String(actor.firm_id) !== String(firmId)) {
    throw new AppError('Utilizador não encontrado', 404);
  }

  const nextName = fullName != null ? String(fullName).trim() : null;
  if (nextName !== null && nextName.length < 2) {
    throw new AppError('Indique o seu nome (mínimo 2 caracteres).', 400);
  }

  let nextEmail;
  if (email != null) {
    nextEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      throw new AppError('E-mail inválido.', 400);
    }
    const taken = await firmUsersRepository.findFirmUserByEmailExcluding(nextEmail, userId);
    if (taken) {
      throw new AppError('Este e-mail já está associado a outra conta.', 409);
    }
  }

  const row = await firmUsersRepository.updateFirmUserProfile(userId, firmId, {
    fullName: nextName ?? undefined,
    email: nextEmail,
  });

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    firmRole: row.role,
  };
}

async function changeMyPassword(firmId, userId, { currentPassword, newPassword }, req = null) {
  const actor = await firmUsersRepository.findFirmUserById(userId);
  if (!actor || String(actor.firm_id) !== String(firmId)) {
    throw new AppError('Utilizador não encontrado', 404);
  }
  if (!actor.password_hash) {
    throw new AppError('Esta conta não tem palavra-passe local para alterar.', 400);
  }

  const ok = await verifyPassword(String(currentPassword || ''), actor.password_hash);
  if (!ok) {
    throw new AppError('Palavra-passe actual incorrecta.', 400, { code: 'INVALID_CURRENT_PASSWORD' });
  }

  assertStrongPassword(newPassword);
  if (String(currentPassword) === String(newPassword)) {
    throw new AppError('A nova palavra-passe deve ser diferente da actual.', 400);
  }

  const passwordHash = await hashPassword(String(newPassword));
  await firmUsersRepository.updateFirmMember(firmId, userId, { passwordHash });

  await securityAudit.recordSettingsMutation({
    action: 'firm.profile.password.changed',
    actor: { id: userId, role: actor.role },
    firmId,
    metadata: {},
    req,
  });

  return { updated: true };
}

async function closeFirmAccount(firmId, actorUserId, { confirmName, npsScore, npsReason, npsComment }, req = null) {
  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.role !== 'FIRM_OWNER') {
    throw new AppError('Apenas o dono do escritório pode encerrar a conta.', 403);
  }

  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  if (firm.status === 'CANCELLED') {
    throw new AppError('Esta conta já se encontra encerrada.', 400);
  }

  const expected = String(firm.name || '').trim();
  const got = String(confirmName || '').trim();
  if (!got || got !== expected) {
    throw new AppError(`Escreva exactamente "${expected}" para confirmar o encerramento.`, 400);
  }

  const npsScoreRaw = Number(npsScore);
  if (!Number.isInteger(npsScoreRaw) || npsScoreRaw < 0 || npsScoreRaw > 10) {
    throw new AppError('Indique uma classificação NPS válida (0 a 10).', 400);
  }
  const normalizedNpsReason = String(npsReason || '').trim() || null;
  const normalizedNpsComment = String(npsComment || '').trim() || null;

  await securityAudit.recordSettingsMutation({
    action: 'firm.account.close.feedback.captured',
    actor: { id: actorUserId, role: actor.role },
    firmId,
    metadata: {
      npsScore: npsScoreRaw,
      npsReason: normalizedNpsReason,
      npsComment: normalizedNpsComment,
      source: 'firm_close_dialog',
    },
    req,
  });

  await firmsRepository.setFirmStatus(firmId, 'CANCELLED');
  await firmUsersRepository.deactivateAllFirmUsers(firmId);

  const team = await firmUsersRepository.listFirmUsers(firmId, { activeOnly: false });
  await Promise.all(
    team.map((u) => authRefreshSessionsRepository.deleteAllForActor('firm_user', u.id)),
  );

  return { closed: true, message: 'Conta do escritório encerrada. Todas as sessões foram terminadas.' };
}

const SOCIAL_LINK_KEYS = ['instagram', 'facebook', 'linkedin', 'whatsapp', 'website'];
const MAX_FAQS = 20;

/** Mesmo padrão de `generateStableId()` do intake_form (Fase B/C): o id nasce
 * no cliente e nunca é re-derivado do texto; isto só cobre o caso de uma
 * chamada directa à API sem passar pelo editor. */
function generateStableFaqId() {
  return `faq_${crypto.randomUUID()}`;
}

function normalizeSocialLinks(input) {
  if (input === undefined) return undefined;
  if (input === null) return {};
  if (typeof input !== 'object') throw new AppError('socialLinks inválido', 400);
  const out = {};
  for (const key of SOCIAL_LINK_KEYS) {
    const raw = input[key];
    if (raw == null) {
      out[key] = null;
      continue;
    }
    const value = String(raw).trim();
    out[key] = value ? value.slice(0, 300) : null;
  }
  return out;
}

function normalizeFaqs(input) {
  if (input === undefined) return undefined;
  if (input === null) return [];
  if (!Array.isArray(input)) throw new AppError('faqs deve ser uma lista', 400);
  return input
    .slice(0, MAX_FAQS)
    .map((item) => ({
      id: String(item?.id || generateStableFaqId()).trim().slice(0, 80),
      question: String(item?.question || '').trim().slice(0, 200),
      answer: String(item?.answer || '').trim().slice(0, 2000),
    }))
    .filter((f) => f.question && f.answer);
}

/**
 * Conteúdo editorial da página pública (`/:firmSlug`) — separado de
 * `branding` (cor/logo) porque é "o que a página diz", não "a cara que tem".
 * Reaproveita `contact` (settings.contact, já preenchido em "Escritório")
 * para o rodapé de contactos — não duplica email/telefone aqui.
 */
async function updatePublicProfile(firmId, actorUserId, payload) {
  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.role !== 'FIRM_OWNER') {
    throw new AppError('Apenas o dono do escritório pode alterar a página pública.', 403);
  }

  const patch = {};
  if (payload.tagline !== undefined) {
    patch.tagline = payload.tagline == null ? null : String(payload.tagline).trim().slice(0, 160) || null;
  }
  if (payload.bio !== undefined) {
    patch.bio = payload.bio == null ? null : String(payload.bio).trim().slice(0, 2000) || null;
  }
  const socialLinks = normalizeSocialLinks(payload.socialLinks);
  if (socialLinks !== undefined) patch.socialLinks = socialLinks;
  const faqs = normalizeFaqs(payload.faqs);
  if (faqs !== undefined) patch.faqs = faqs;

  const updated = await firmsRepository.updateFirmPublicProfile(firmId, patch);
  return { publicProfile: updated.settings?.publicProfile || {} };
}

/** Cor de marca da página pública (logo já tem o seu próprio upload/remove). */
async function updateBranding(firmId, actorUserId, payload) {
  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.role !== 'FIRM_OWNER') {
    throw new AppError('Apenas o dono do escritório pode alterar a identidade visual.', 403);
  }

  const HEX_RE = /^#[0-9a-f]{6}$/i;
  const patch = {};
  if (payload.primaryColor !== undefined) {
    if (payload.primaryColor != null && !HEX_RE.test(String(payload.primaryColor).trim())) {
      throw new AppError('primaryColor deve ser uma cor hex válida (#rrggbb).', 400);
    }
    patch.primaryColor = payload.primaryColor == null ? null : String(payload.primaryColor).trim();
  }
  if (payload.secondaryColor !== undefined) {
    if (payload.secondaryColor != null && !HEX_RE.test(String(payload.secondaryColor).trim())) {
      throw new AppError('secondaryColor deve ser uma cor hex válida (#rrggbb).', 400);
    }
    patch.secondaryColor = payload.secondaryColor == null ? null : String(payload.secondaryColor).trim();
  }

  const updated = await firmsRepository.updateFirmBranding(firmId, patch);
  const branding = { ...(updated.settings?.branding || {}) };
  delete branding.logoStorageKey;
  return { branding };
}

module.exports = {
  getSettingsBundle,
  updateFirmDetails,
  updatePublicProfile,
  updateBranding,
  updateMyProfile,
  changeMyPassword,
  closeFirmAccount,
  normalizeFirmSlug,
  FIRM_ROLE_LABELS,
};
