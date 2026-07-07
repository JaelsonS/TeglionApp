/**
 * Autenticação TegLion — Supabase (firm_users + clients).
 */
const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const { mapDbError } = require('../../utils/db-error');
const { resolveCountryConfig, normalizeCountryCode } = require('../../config/country-config.registry');
const { signAccessToken, signRefreshToken } = require('../../config/jwt');
const { env } = require('../../config/env');
const { hashPassword, verifyPassword, needsPasswordRehash } = require('../../utils/password-crypto');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const passwordResetRepository = require('../../db/supabase/repositories/password-reset.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const { defaultBookingSeed } = require('../booking/booking.service');
const accountingServicesService = require('../firm/accounting-services.service');
const legalConsentsService = require('../legal/legal-consents.service');
const { notifyPasswordReset } = require('../../services/notifications/contabil-notifications.service');
const { toPublicAuthUser } = require('./auth-public-user');
const { assertFirmLoginAllowed } = require('../../utils/firm-access');
const { assertStrongPassword } = require('../../utils/password-policy');
const loginSecurity = require('./login-security.service');
const securityAudit = require('../../services/audit/security-audit.service');
const { normalizeSessionRole, isClientRole } = require('../../utils/session-user');
const { ROLE_PERMISSIONS } = require('../../utils/permissions');

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function slugify(name) {
  return String(name || 'escritorio')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'escritorio';
}

async function uniqueSlug(base) {
  let slug = base;
  let n = 0;
  while (await firmsRepository.slugExists(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function sanitizeFirmUser(row) {
  const role = firmUsersRepository.jwtRoleFromFirmRole(row.role);
  const firmId = row.firm_id;
  const rolePermissions = ROLE_PERMISSIONS[normalizeSessionRole(role)] || [];
  const overridePermissions = Array.isArray(row.permissions_override) ? row.permissions_override : null;
  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role,
    firmRole: row.role,
    firmId,
    permissions: overridePermissions || rolePermissions,
    masterAccess: row.role === 'FIRM_OWNER',
    isActive: row.is_active !== false,
    onboardingCompleted: row.onboarding_completed === true,
  };
}

function sanitizeClient(row) {
  const firmId = row.firm_id;
  const clientId = row.id;
  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    fullName: row.display_name,
    role: 'CLIENT',
    firmId,
    clientId,
    isActive: row.status === 'ACTIVE',
  };
}

async function persistRefreshSession(actorType, actorId, refresh) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await authRefreshSessionsRepository.createSession({
    jti: refresh.jti,
    actorType,
    actorId,
    tokenHash: hashToken(refresh.token),
    expiresAt,
  });
  await authRefreshSessionsRepository.pruneOldSessions(actorType, actorId, 35);
}

async function issueTokensForFirmUser(row) {
  const user = sanitizeFirmUser(row);
  const accessToken = signAccessToken({
    id: user.id,
    role: user.role,
    firmId: user.firmId,
    permissions: user.permissions,
    masterAccess: user.masterAccess,
  });
  const refresh = signRefreshToken({
    id: user.id,
    role: user.role,
    firmId: user.firmId,
    masterAccess: user.masterAccess,
    actorType: 'firm',
  });
  await persistRefreshSession('firm_user', row.id, refresh);
  await firmUsersRepository.updateFirmUserAuth(row.id, {
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
  });
  const publicUser = await toPublicAuthUser(user);
  return { user: publicUser, tokens: { accessToken, refreshToken: refresh.token } };
}

async function issueTokensForClient(row) {
  const user = sanitizeClient(row);
  const accessToken = signAccessToken({
    id: user.id,
    role: user.role,
    firmId: user.firmId,
    clientId: user.clientId,
  });
  const refresh = signRefreshToken({
    id: user.id,
    role: user.role,
    firmId: user.firmId,
    clientId: user.clientId,
    actorType: 'client',
  });
  await persistRefreshSession('client', row.id, refresh);
  await clientsRepository.updateClientAuth(row.id, {
    refreshTokenHash: null,
    refreshTokenExpiresAt: null,
  });
  await clientsRepository.touchClientLogin(row.id).catch(() => { });
  const publicUser = await toPublicAuthUser(user);
  return { user: publicUser, tokens: { accessToken, refreshToken: refresh.token } };
}

async function registerFirm({ firmName, ownerName, email, password, countryCode = 'PT', legalConsents }) {
  try {
    legalConsentsService.validateFirmLegalPayload(legalConsents);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new AppError('E-mail inválido', 400);
    assertStrongPassword(password);
    const name = String(firmName || '').trim();
    if (!name) throw new AppError('Nome do escritório é obrigatório', 400);
    const owner = String(ownerName || '').trim();
    if (!owner) throw new AppError('Nome do responsável é obrigatório', 400);

    const existing = await firmUsersRepository.findFirmUserByEmail(normalizedEmail);
    if (existing) throw new AppError('E-mail já registado', 409);

    const country = resolveCountryConfig(countryCode);
    const slug = await uniqueSlug(slugify(name));
    const firm = await firmsRepository.createFirm({ name, slug, countryCode: country.code });

    try {
      await firmsRepository.mergeSettingsKey(firm.id, 'booking', defaultBookingSeed());
      await accountingServicesService.seedCatalog({ firmId: firm.id });
    } catch {
      /* disponibilidade e catálogo — não bloquear registo */
    }

    const passwordHash = await hashPassword(String(password));
    const firmUser = await firmUsersRepository.createFirmOwner({
      firmId: firm.id,
      email: normalizedEmail,
      fullName: owner,
      passwordHash,
    });

    await legalConsentsService.recordFirmOwnerConsent({
      firmId: firm.id,
      firmUserId: firmUser.id,
      payload: legalConsents,
      ipAddress: legalConsents?.ipAddress,
      userAgent: legalConsents?.userAgent,
    });

    return issueTokensForFirmUser(firmUser);
  } catch (err) {
    throw mapDbError(err, 'Não foi possível criar a conta do escritório');
  }
}

async function registerFirmWithGoogle({
  firmName,
  ownerName,
  email,
  googleSub,
  countryCode = 'PT',
  legalConsents,
  req,
}) {
  try {
    legalConsentsService.validateFirmLegalPayload(legalConsents);
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new AppError('E-mail inválido', 400);
    if (!googleSub) throw new AppError('Sessão Google inválida', 401, { code: 'SSO_SESSION_INVALID' });

    const existing = await firmUsersRepository.findFirmUserByEmail(normalizedEmail);
    if (existing) throw new AppError('E-mail já registado', 409);

    const name = String(firmName || '').trim();
    if (!name) throw new AppError('Nome do escritório é obrigatório', 400);
    const owner = String(ownerName || '').trim();
    if (!owner) throw new AppError('Nome do responsável é obrigatório', 400);

    const country = resolveCountryConfig(countryCode);
    const slug = await uniqueSlug(slugify(name));
    const firm = await firmsRepository.createFirm({ name, slug, countryCode: country.code });

    try {
      await firmsRepository.mergeSettingsKey(firm.id, 'booking', defaultBookingSeed());
      await accountingServicesService.seedCatalog({ firmId: firm.id });
    } catch {
      /* não bloquear registo */
    }

    const firmUser = await firmUsersRepository.createFirmOwner({
      firmId: firm.id,
      email: normalizedEmail,
      fullName: owner,
      passwordHash: null,
      ssoProvider: 'google',
      ssoSubject: googleSub,
    });

    await legalConsentsService.recordFirmOwnerConsent({
      firmId: firm.id,
      firmUserId: firmUser.id,
      payload: legalConsents,
      ipAddress: legalConsents?.ipAddress,
      userAgent: legalConsents?.userAgent,
    });

    const issued = await issueTokensForFirmUser(firmUser);
    void securityAudit.recordAuthLoginSuccess({
      user: issued.user,
      req,
      scope: 'firm',
    });
    return issued;
  } catch (err) {
    throw mapDbError(err, 'Não foi possível criar a conta com Google');
  }
}

async function upgradePasswordHashIfNeeded({ actorType, actorId, password, currentHash }) {
  if (!needsPasswordRehash(currentHash)) return;
  const passwordHash = await hashPassword(String(password));
  if (actorType === 'client') {
    await clientsRepository.updateClientAuth(actorId, { passwordHash });
    return;
  }
  await firmUsersRepository.updateFirmUserAuth(actorId, { passwordHash });
}

async function loginFirm({ email, password, req }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const accountKey = loginSecurity.buildAccountKey('firm', normalizedEmail);
  await loginSecurity.assertLoginAllowed(accountKey, req);

  const row = await firmUsersRepository.findFirmUserByEmail(normalizedEmail);
  if (!row) {
    void securityAudit.recordAuthLoginFailed({ scope: 'firm', req, reason: 'invalid_credentials' });
    await loginSecurity.recordFailedLogin(accountKey, req, { scope: 'firm' });
  }
  if (!row.password_hash) {
    if (row.sso_provider) {
      throw new AppError(
        'Esta conta foi criada com Google. Use «Entrar com Google».',
        401,
        { code: 'SSO_REQUIRED' },
      );
    }
    void securityAudit.recordAuthLoginFailed({ scope: 'firm', req, reason: 'invalid_credentials' });
    await loginSecurity.recordFailedLogin(accountKey, req, { scope: 'firm' });
  }
  if (row.is_active === false) {
    throw new AppError('Conta inactiva. Contacte o administrador do escritório.', 403, { code: 'ACCOUNT_INACTIVE' });
  }
  if (!row.email_confirmed_at) {
    const inviteStatus = String(row.invite_status || 'ACCEPTED').toUpperCase();
    const isAcceptedOwner = row.role === 'FIRM_OWNER' && inviteStatus === 'ACCEPTED';
    if (isAcceptedOwner) {
      const healed = await firmUsersRepository.markFirmUserEmailConfirmed(row.id, row.firm_id);
      row.email_confirmed_at = healed?.emailConfirmedAt || new Date().toISOString();
    }
  }
  if (!row.email_confirmed_at) {
    throw new AppError('Confirmação de e-mail pendente. Verifique a sua caixa de entrada.', 403, {
      code: 'EMAIL_NOT_CONFIRMED',
    });
  }
  const ok = await verifyPassword(String(password || '').trim(), row.password_hash);
  if (!ok) {
    void securityAudit.recordAuthLoginFailed({
      firmId: row.firm_id,
      actorId: row.id,
      actorRole: 'FIRM',
      scope: 'firm',
      req,
      reason: 'invalid_credentials',
    });
    await loginSecurity.recordFailedLogin(accountKey, req, { firmId: row.firm_id, scope: 'firm' });
  }
  const firm = await firmsRepository.findFirmById(row.firm_id);
  const firmAccess = assertFirmLoginAllowed(firm);
  await upgradePasswordHashIfNeeded({
    actorType: 'firm_user',
    actorId: row.id,
    password,
    currentHash: row.password_hash,
  });
  await loginSecurity.recordSuccessfulLogin(accountKey);
  const issued = await issueTokensForFirmUser(row);
  void securityAudit.recordAuthLoginSuccess({ user: issued.user, req, scope: 'firm' });
  return { ...issued, firmAccess: { hasAccess: firmAccess.hasAccess, reason: firmAccess.reason } };
}

/** Login escritório via SSO (Google) — utilizador já verificado pelo IdP. */
async function loginFirmBySso({ email, req, provider = 'google', googleSub }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const row = await firmUsersRepository.findFirmUserByEmail(normalizedEmail);
  if (!row) return { ok: false, reason: 'account_not_found' };
  if (row.is_active === false) {
    return { ok: false, reason: 'account_inactive' };
  }
  if (row.sso_subject && googleSub && row.sso_subject !== googleSub) {
    return { ok: false, reason: 'sso_mismatch' };
  }
  if (googleSub && !row.sso_subject) {
    await firmUsersRepository.updateFirmUserSso(row.id, {
      ssoProvider: provider,
      ssoSubject: googleSub,
    });
  }
  const firm = await firmsRepository.findFirmById(row.firm_id);
  const firmAccess = assertFirmLoginAllowed(firm);
  const issued = await issueTokensForFirmUser(row);
  void securityAudit.recordAuthLoginSuccess({
    user: issued.user,
    req,
    scope: 'firm',
  });
  return {
    ok: true,
    ...issued,
    firmAccess: { hasAccess: firmAccess.hasAccess, reason: firmAccess.reason },
    ssoProvider: provider,
  };
}

async function resolveFirmIdForClientLogin({ firmSlug }) {
  if (firmSlug) {
    const firm = await firmsRepository.findFirmBySlugOrLabel(firmSlug);
    if (!firm) throw new AppError('Escritório não encontrado', 404, { code: 'FIRM_NOT_FOUND' });
    return firm.id;
  }
  return null;
}

async function loginClient({ email, password, firmSlug, req }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const accountKey = loginSecurity.buildAccountKey('client', normalizedEmail);
  await loginSecurity.assertLoginAllowed(accountKey, req);

  const scopedFirmId = await resolveFirmIdForClientLogin({ firmSlug });

  let mapped = null;
  if (scopedFirmId) {
    mapped = await clientsRepository.findClientByEmailForFirm(normalizedEmail, scopedFirmId);
  } else {
    const matches = await clientsRepository.findClientsByEmail(normalizedEmail);
    const withPortal = matches.filter((c) => c.hasPortalAccess);
    if (withPortal.length > 1) {
      throw new AppError(
        'Este e-mail está associado a mais do que um escritório. Utilize o link de acesso do seu contabilista.',
        409,
        { code: 'MULTIPLE_FIRMS' }
      );
    }
    mapped = withPortal[0] || matches[0] || null;
  }

  if (!mapped) {
    void securityAudit.recordAuthLoginFailed({ scope: 'client', req, reason: 'invalid_credentials' });
    await loginSecurity.recordFailedLogin(accountKey, req, { scope: 'client' });
  }
  const row = await clientsRepository.getClientRowById(mapped.id);
  if (!row) {
    void securityAudit.recordAuthLoginFailed({ scope: 'client', req, reason: 'invalid_credentials' });
    await loginSecurity.recordFailedLogin(accountKey, req, { scope: 'client' });
  }
  if (row.status && row.status !== 'ACTIVE') {
    throw new AppError('Conta de cliente inactiva. Contacte o seu escritório.', 403, { code: 'ACCOUNT_INACTIVE' });
  }
  if (!row.password_hash) {
    throw new AppError(
      'Ainda não tem palavra-passe no portal. Use o link de convite enviado pelo escritório (Primeiro acesso).',
      401,
      { code: 'PASSWORD_NOT_SET' },
    );
  }
  const ok = await verifyPassword(String(password || '').trim(), row.password_hash);
  if (!ok) {
    void securityAudit.recordAuthLoginFailed({
      firmId: row.firm_id,
      actorId: row.id,
      actorRole: 'CLIENT',
      scope: 'client',
      req,
      reason: 'invalid_credentials',
    });
    await loginSecurity.recordFailedLogin(accountKey, req, { firmId: row.firm_id, scope: 'client' });
  }
  await upgradePasswordHashIfNeeded({
    actorType: 'client',
    actorId: row.id,
    password,
    currentHash: row.password_hash,
  });
  await loginSecurity.recordSuccessfulLogin(accountKey);
  const issued = await issueTokensForClient(row);
  void securityAudit.recordAuthLoginSuccess({ user: issued.user, req, scope: 'client' });
  return issued;
}

async function refreshSession({ refreshToken }) {
  const { verifyRefreshToken } = require('../../config/jwt');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Sessão inválida', 401, { code: 'INVALID_REFRESH' });
  }
  const tokenHash = hashToken(refreshToken);
  const jti = payload.jti ? String(payload.jti) : null;

  if (jti) {
    const session = await authRefreshSessionsRepository.findByJti(jti);
    if (session && session.token_hash === tokenHash) {
      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        await authRefreshSessionsRepository.deleteByJti(jti);
        throw new AppError('Sessão expirada', 401, { code: 'SESSION_EXPIRED' });
      }
      await authRefreshSessionsRepository.deleteByJti(jti);
      if (payload.actorType === 'client' || isClientRole(payload.role)) {
        const row = await clientsRepository.getClientRowById(payload.id);
        if (!row) throw new AppError('Sessão inválida', 401);
        return issueTokensForClient(row);
      }
      const row = await firmUsersRepository.findFirmUserById(payload.id);
      if (!row) throw new AppError('Sessão inválida', 401);
      const firm = await firmsRepository.findFirmById(row.firm_id);
      assertFirmLoginAllowed(firm);
      return issueTokensForFirmUser(row);
    }
  }

  if (payload.actorType === 'client' || isClientRole(payload.role)) {
    const row = await clientsRepository.getClientRowById(payload.id);
    if (!row || row.refresh_token_hash !== tokenHash) {
      throw new AppError('Sessão inválida', 401);
    }
    await clientsRepository.updateClientAuth(row.id, { refreshTokenHash: null, refreshTokenExpiresAt: null });
    return issueTokensForClient(row);
  }

  const row = await firmUsersRepository.findFirmUserById(payload.id);
  if (!row || row.refresh_token_hash !== tokenHash) {
    throw new AppError('Sessão inválida', 401);
  }
  const firm = await firmsRepository.findFirmById(row.firm_id);
  assertFirmLoginAllowed(firm);
  await firmUsersRepository.updateFirmUserAuth(row.id, { refreshTokenHash: null, refreshTokenExpiresAt: null });
  return issueTokensForFirmUser(row);
}

async function getMe(userId, role) {
  if (isClientRole(role) || normalizeSessionRole(role) === 'CLIENT') {
    const row = await clientsRepository.getClientRowById(userId);
    if (!row) throw new AppError('Utilizador não encontrado', 404);
    return toPublicAuthUser(sanitizeClient(row));
  }
  const row = await firmUsersRepository.findFirmUserById(userId);
  if (!row) throw new AppError('Utilizador não encontrado', 404);
  return toPublicAuthUser(sanitizeFirmUser(row));
}

async function completeOnboarding(userId) {
  const row = await firmUsersRepository.findFirmUserById(userId);
  if (!row) throw new AppError('Utilizador não encontrado', 404);
  await firmUsersRepository.updateOnboardingCompleted(row.id, row.firm_id, true);
  return getMe(userId, sanitizeFirmUser(row).role);
}

function buildInviteUrl(token) {
  const base = String(env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/auth/client/convite/${token}`;
}

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function buildPasswordResetUrl(rawToken, userType) {
  const base = String(env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const role = userType === 'client' ? 'client' : 'firm';
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}&role=${role}`;
}

async function resolveAccountForRecovery(email, roleHint) {
  const normalized = String(email || '').trim().toLowerCase();
  const legacyClientHint = ['p', 'a', 't', 'i', 'e', 'n', 't'].join('');
  const legacyClinic = ['c', 'l', 'i', 'n', 'i', 'c'].join('');
  let hint = String(roleHint || '').toLowerCase();
  if (hint === legacyClientHint) hint = 'client';
  if (hint === legacyClinic) hint = 'firm';

  if (hint === 'client') {
    const matches = await clientsRepository.findClientsByEmail(normalized);
    const withPortal = matches.filter((c) => c.hasPortalAccess);
    if (withPortal.length > 1) return null;
    const client = withPortal[0] || null;
    if (client?.hasPortalAccess) return { userType: 'client', userId: client.id, email: normalized };
    return null;
  }

  if (hint === 'firm') {
    const firmUser = await firmUsersRepository.findFirmUserByEmail(normalized);
    if (firmUser?.is_active && firmUser.password_hash) {
      return { userType: 'firm_user', userId: firmUser.id, email: normalized };
    }
    return null;
  }

  const firmUser = await firmUsersRepository.findFirmUserByEmail(normalized);
  if (firmUser?.is_active && firmUser.password_hash) {
    return { userType: 'firm_user', userId: firmUser.id, email: normalized };
  }

  const clientMatches = await clientsRepository.findClientsByEmail(normalized);
  const portalClients = clientMatches.filter((c) => c.hasPortalAccess);
  if (portalClients.length > 1) return null;
  const client = portalClients[0] || null;
  if (client?.hasPortalAccess) return { userType: 'client', userId: client.id, email: normalized };

  return null;
}

async function requestPasswordRecovery({ email, role }) {
  const account = await resolveAccountForRecovery(email, role);
  if (!account) {
    return { success: true, message: 'Se o e-mail existir, enviaremos um link de recuperação.' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  await passwordResetRepository.invalidateUserTokens(account.userType, account.userId);
  await passwordResetRepository.createToken({
    userType: account.userType,
    userId: account.userId,
    tokenHash,
    expiresAt,
  });

  const resetUrl = buildPasswordResetUrl(rawToken, account.userType);
  await notifyPasswordReset({ email: account.email, resetUrl, userType: account.userType });

  return { success: true, message: 'Se o e-mail existir, enviaremos um link de recuperação.' };
}

async function validateResetToken({ token }) {
  const tokenHash = hashToken(String(token || '').trim());
  const row = await passwordResetRepository.findValidToken(tokenHash);
  if (!row) {
    throw new AppError('Token inválido ou expirado', 401, { code: 'INVALID_RESET_TOKEN' });
  }
  return { valid: true };
}

async function resetPasswordWithToken({ token, newPassword, req }) {
  const raw = String(token || '').trim();
  if (!raw) throw new AppError('Token inválido', 400);
  assertStrongPassword(newPassword);

  const tokenHash = hashToken(raw);
  const row = await passwordResetRepository.findValidToken(tokenHash);
  if (!row) {
    throw new AppError('Token inválido ou expirado', 401, { code: 'INVALID_RESET_TOKEN' });
  }

  const passwordHash = await hashPassword(String(newPassword));

  if (row.user_type === 'client') {
    await authRefreshSessionsRepository.deleteAllForActor('client', row.user_id);
    await clientsRepository.updateClientAuth(row.user_id, {
      passwordHash,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
    const clientRow = await clientsRepository.getClientRowById(row.user_id);
    void securityAudit.recordAuthPasswordReset({
      userType: 'client',
      userId: row.user_id,
      firmId: clientRow?.firm_id || null,
      req,
    });
  } else {
    await authRefreshSessionsRepository.deleteAllForActor('firm_user', row.user_id);
    await firmUsersRepository.updateFirmUserAuth(row.user_id, {
      passwordHash,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
    const firmUser = await firmUsersRepository.findFirmUserById(row.user_id);
    void securityAudit.recordAuthPasswordReset({
      userType: 'firm_user',
      userId: row.user_id,
      firmId: firmUser?.firm_id || null,
      req,
    });
  }

  await passwordResetRepository.markTokenUsed(row.id);
  return { success: true };
}

module.exports = {
  registerFirm,
  registerFirmWithGoogle,
  loginFirm,
  loginFirmBySso,
  loginClient,
  refreshSession,
  getMe,
  completeOnboarding,
  buildInviteUrl,
  requestPasswordRecovery,
  validateResetToken,
  resetPasswordWithToken,
  sanitizeFirmUser,
  sanitizeClient,
};
