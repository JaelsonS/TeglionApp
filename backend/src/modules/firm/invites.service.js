/**
 * Convites cliente ↔ escritório (Supabase).
 *
 * Ciclo de vida do acesso ao portal: NO_ACCESS -> PENDING_INVITE -> ACTIVE,
 * com REVOKED como estado explícito para quando o escritório revoga o acesso
 * (o cliente e todo o seu histórico continuam intactos — só a credencial de
 * acesso é reposta). Espelha o padrão já validado em produção para convites
 * de equipa interna (`team-invites.service.js` / `firm_member_invites`).
 */
const { AppError } = require('../../middlewares/error.middleware');
const { normalizeEmail } = require('../../utils/normalize');
const { hashPassword } = require('../../utils/password-crypto');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const invitesRepository = require('../../db/supabase/repositories/invites.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const contabilAuth = require('../auth/contabil-auth.service');
const firmBrandingService = require('./firm-branding.service');
const { assertStrongPassword } = require('../../utils/password-policy');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const { generateToken, hashToken } = require('../../services/email/email-confirmation.service');
const securityAudit = require('../../services/audit/security-audit.service');

const INVITE_TTL_DAYS = 14;
const BULK_INVITE_CHUNK = 15;
const BULK_INVITE_DELAY_MS = 200; // pausa entre envios individuais — a Brevo não tem batch nativo

function buildInviteUrl(token) {
  return contabilAuth.buildInviteUrl(token);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Dados de marca do escritório para personalizar o email — nunca lança, cai para o default da Teglion. */
async function resolveInviteBranding(firmId) {
  try {
    const profile = await firmBrandingService.getFirmProfile(firmId);
    const contact = profile.firm?.settings?.contact || {};
    return {
      firmName: profile.firm?.name || null,
      logoUrl: profile.logoUrl || null,
      brandColor: profile.firm?.branding?.primaryColor || null,
      contactEmail: contact.email || null,
      contactPhone: contact.phone || null,
      website: contact.website || profile.firm?.settings?.publicProfile?.website || null,
    };
  } catch {
    return {
      firmName: null,
      logoUrl: null,
      brandColor: null,
      contactEmail: null,
      contactPhone: null,
      website: null,
    };
  }
}

async function sendInviteEmail({ firmId, email, displayName, inviteUrl, expiresAt, emailOverride }) {
  if (!email) return { emailSent: false, emailError: 'no_email' };
  const branding = await resolveInviteBranding(firmId);
  try {
    const delivery = await contabilNotifications.notifyClientInvite({
      clientEmail: email,
      clientName: displayName || null,
      firmName: branding.firmName,
      inviteUrl,
      expiresAt,
      firmLogoUrl: branding.logoUrl,
      firmBrandColor: branding.brandColor,
      firmContactEmail: branding.contactEmail,
      firmContactPhone: branding.contactPhone,
      firmWebsite: branding.website,
      subjectOverride: emailOverride?.subject || null,
      bodyTextOverride: emailOverride?.bodyText || null,
    });
    if (delivery?.skipped) {
      return {
        emailSent: false,
        emailError:
          delivery.reason === 'email_disabled'
            ? 'email_disabled'
            : delivery.reason || 'email_skipped',
      };
    }
    return { emailSent: true, emailError: null };
  } catch (err) {
    const message = err?.message || err?.response?.data?.message || 'email_delivery_failed';
    return { emailSent: false, emailError: String(message) };
  }
}

async function createClientInvite({
  firmId: firmIdRaw,
  clientId,
  email,
  initialPassword,
  createdByUserId,
  actor,
  req,
  emailOverride,
}) {
  const firmId = String(firmIdRaw);

  let clientName = null;
  let clientEmail = email ? normalizeEmail(email) : null;
  if (clientId) {
    const client = await clientsRepository.findClientById(firmId, clientId);
    if (!client) throw new AppError('Cliente não encontrado', 404);
    if (client.hasPortalAccess) {
      throw new AppError('Este cliente já tem acesso ao portal. Use recuperação de palavra-passe.', 409);
    }
    clientName = client.displayName || null;
    if (!clientEmail && client.email) clientEmail = normalizeEmail(client.email);
    await invitesRepository.revokePendingInvitesForClient(firmId, clientId);
  }

  // Caminho A: escritório define palavra-passe → acesso ACTIVE imediato (login normal).
  if (initialPassword) {
    if (!clientId) {
      throw new AppError('Indique o cliente para definir a palavra-passe inicial.', 400);
    }
    assertStrongPassword(initialPassword);
    const passwordHash = await hashPassword(String(initialPassword));
    await clientsRepository.updateClientAuth(clientId, { passwordHash });
    await clientsRepository.updatePortalAccessStatus(clientId, 'ACTIVE');

    const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
    const base = String(require('../../config/env').env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const loginQs = new URLSearchParams();
    if (firm?.slug) loginQs.set('firmSlug', String(firm.slug));
    if (clientEmail) loginQs.set('email', clientEmail);
    const loginUrl = `${base}/auth/client/login${loginQs.toString() ? `?${loginQs}` : ''}`;

    if (clientEmail) {
      void contabilNotifications
        .notifyClientWelcome({
          clientEmail,
          clientName,
          firmName: firm?.name || null,
        })
        .catch((err) => console.warn('[Teglion] welcome email:', err.message));
    }

    await securityAudit.recordClientMutation({
      action: 'client.invite.sent',
      actor: actor || null,
      firmId,
      clientId,
      metadata: {
        inviteId: null,
        hasEmail: Boolean(clientEmail),
        activatedWithPassword: true,
      },
      req: req || null,
    });

    return {
      invite: null,
      inviteUrl: loginUrl,
      expiresAt: null,
      activatedWithPassword: true,
    };
  }

  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const invite = await invitesRepository.createInvite({
    firmId,
    clientId: clientId || null,
    email: clientEmail || null,
    token: hashToken(rawToken),
    expiresAt,
    createdBy: createdByUserId || null,
  });

  if (clientId) {
    await clientsRepository.updatePortalAccessStatus(clientId, 'PENDING_INVITE');
  }

  const inviteUrl = buildInviteUrl(rawToken);
  if (clientEmail) {
    void sendInviteEmail({
      firmId,
      email: clientEmail,
      displayName: clientName,
      inviteUrl,
      expiresAt,
      emailOverride,
    }).catch((err) => console.warn('[Teglion] invite email:', err.message));
  }

  await securityAudit.recordClientMutation({
    action: 'client.invite.sent',
    actor: actor || null,
    firmId,
    clientId: clientId || null,
    metadata: { inviteId: invite.id, hasEmail: Boolean(clientEmail) },
    req: req || null,
  });

  return {
    invite,
    inviteUrl,
    expiresAt,
    activatedWithPassword: false,
  };
}

/**
 * Revoga o acesso de um cliente ao portal — corta sessões activas e invalida
 * convites pendentes, mas nunca apaga o cliente nem qualquer dado associado
 * (documentos, mensagens, agendamentos, obrigações continuam intactos).
 */
async function revokeClientAccess({ firmId: firmIdRaw, clientId, actor, req }) {
  const firmId = String(firmIdRaw);
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  await invitesRepository.revokePendingInvitesForClient(firmId, clientId);
  await clientsRepository.updatePortalAccessStatus(clientId, 'REVOKED');
  // Força nova senha no próximo acesso: remove credencial sem apagar dados.
  await clientsRepository.updateClientAuth(clientId, { passwordHash: null });
  await authRefreshSessionsRepository.deleteAllForActor('client', clientId);

  await securityAudit.recordClientMutation({
    action: 'client.access.revoked',
    actor: actor || null,
    firmId,
    clientId,
    metadata: { reason: 'manual_revoke', passwordCleared: true, sessionsRevoked: true },
    req: req || null,
  });

  return { revoked: true };
}

/**
 * Reemite um convite — revoga qualquer convite pendente anterior e gera um
 * token novo, independentemente do estado actual (ao contrário de
 * `createClientInvite`, que bloqueia se o cliente já tiver acesso). É o
 * caminho usado depois de `revokeClientAccess`, ou para reenviar um convite
 * que o cliente ainda não activou.
 */
async function resendClientInvite({ firmId: firmIdRaw, clientId, actor, req }) {
  const firmId = String(firmIdRaw);
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  await invitesRepository.revokePendingInvitesForClient(firmId, clientId);

  const rawToken = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const invite = await invitesRepository.createInvite({
    firmId,
    clientId,
    email: client.email || null,
    token: hashToken(rawToken),
    expiresAt,
    createdBy: actor?.id || null,
  });
  await clientsRepository.updatePortalAccessStatus(clientId, 'PENDING_INVITE');

  const inviteUrl = buildInviteUrl(rawToken);
  const delivery = await sendInviteEmail({
    firmId,
    email: client.email,
    displayName: client.displayName,
    inviteUrl,
    expiresAt,
  });

  await securityAudit.recordClientMutation({
    action: 'client.invite.resent',
    actor: actor || null,
    firmId,
    clientId,
    metadata: { inviteId: invite.id, emailSent: delivery.emailSent, emailError: delivery.emailError },
    req: req || null,
  });

  return { invite, inviteUrl, expiresAt, emailSent: delivery.emailSent };
}

/**
 * Convite em massa — gera e envia convites para vários clientes de uma vez.
 * Processa em lotes pequenos com pequena pausa entre envios (a Brevo é
 * chamada 1 a 1, sem batch nativo — números a validar contra o plano
 * contratado). Clientes já com acesso activo são apenas contados, não
 * recebem novo convite.
 */
async function createBulkClientInvites({ firmId: firmIdRaw, clientIds, actor, req, emailOverride }) {
  const firmId = String(firmIdRaw);
  const ids = [...new Set((clientIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (!ids.length) throw new AppError('Selecione pelo menos um cliente', 400);

  const clients = await clientsRepository.findClientsByIds(firmId, ids);

  const results = { requested: ids.length, sent: 0, alreadyActive: 0, skippedNoEmail: 0, failed: 0, pending: 0 };

  for (let i = 0; i < clients.length; i += BULK_INVITE_CHUNK) {
    const chunk = clients.slice(i, i + BULK_INVITE_CHUNK);
    for (const client of chunk) {
      try {
        if (client.portalAccessStatus === 'ACTIVE') {
          results.alreadyActive += 1;
          continue;
        }
        if (!client.email) {
          results.skippedNoEmail += 1;
          continue;
        }

        await invitesRepository.revokePendingInvitesForClient(firmId, client.id);
        const rawToken = generateToken();
        const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
        await invitesRepository.createInvite({
          firmId,
          clientId: client.id,
          email: client.email,
          token: hashToken(rawToken),
          expiresAt,
          createdBy: actor?.id || null,
        });
        await clientsRepository.updatePortalAccessStatus(client.id, 'PENDING_INVITE');
        results.pending += 1;

        const inviteUrl = buildInviteUrl(rawToken);
        const delivery = await sendInviteEmail({
          firmId,
          email: client.email,
          displayName: client.displayName,
          inviteUrl,
          expiresAt,
          emailOverride,
        });
        if (delivery.emailSent) results.sent += 1;
        else results.failed += 1;
      } catch (err) {
        console.warn('[Teglion] bulk invite failed for client', client.id, err?.message || err);
        results.failed += 1;
      }
      await delay(BULK_INVITE_DELAY_MS);
    }
  }

  await securityAudit.recordClientMutation({
    action: 'client.invite.bulk_sent',
    actor: actor || null,
    firmId,
    clientId: null,
    metadata: results,
    req: req || null,
  });

  return results;
}

async function getInvitePublicPreview(token) {
  const invite = await invitesRepository.findInviteByToken(hashToken(String(token).trim()));
  if (!invite) throw new AppError('Convite inválido ou expirado', 404);

  if (invite.status === 'REVOKED') {
    throw new AppError('Este convite não é mais válido. Peça um novo ao seu escritório.', 410);
  }
  if (invite.status !== 'PENDING') {
    throw new AppError('Este convite já foi utilizado', 410);
  }
  if (new Date(invite.expires_at) < new Date()) {
    await invitesRepository.markInviteExpired(invite.id);
    throw new AppError('Convite expirado. Peça um novo link ao escritório.', 410);
  }

  const firm = await firmsRepository.findFirmById(invite.firm_id);
  let clientName = null;
  if (invite.client_id) {
    const client = await clientsRepository.findClientById(invite.firm_id, invite.client_id);
    clientName = client?.displayName || null;
  }

  return {
    firmName: firm?.name || 'Escritório de contabilidade',
    clientName,
    emailHint: invite.email || null,
    expiresAt: invite.expires_at,
  };
}

async function registerClientWithInvite({ token, email, password, fullName, req }) {
  const invite = await invitesRepository.findInviteByToken(hashToken(String(token).trim()));
  if (!invite) throw new AppError('Convite inválido', 404);
  if (invite.status === 'REVOKED') {
    throw new AppError('Este convite não é mais válido. Peça um novo ao seu escritório.', 410);
  }
  if (invite.status !== 'PENDING') throw new AppError('Convite já utilizado', 410);
  if (new Date(invite.expires_at) < new Date()) {
    await invitesRepository.markInviteExpired(invite.id);
    throw new AppError('Convite expirado', 410);
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new AppError('E-mail inválido', 400);
  if (invite.email && invite.email !== normalizedEmail) {
    throw new AppError('Utilize o e-mail indicado no convite', 400);
  }
  assertStrongPassword(password);
  const name = String(fullName || '').trim();
  if (!name) throw new AppError('Nome é obrigatório', 400);

  const otherFirm = (await clientsRepository.findClientsByEmail(normalizedEmail)).find(
    (c) => c.hasPortalAccess && c.firmId !== invite.firm_id
  );
  if (otherFirm?.hasPortalAccess) {
    throw new AppError('E-mail já registado noutro escritório', 409);
  }

  const passwordHash = await hashPassword(String(password));
  let clientId = invite.client_id;

  if (clientId) {
    await clientsRepository.updateClientAuth(clientId, { passwordHash });
    const row = await clientsRepository.getClientRowById(clientId);
    if (row) {
      const sb = require('../../db/supabase/client').getSupabaseAdmin();
      await sb
        .from('clients')
        .update({ display_name: name, email: normalizedEmail, link_status: 'APPROVED' })
        .eq('id', clientId);
    }
  } else {
    const created = await clientsRepository.createClient({
      firmId: invite.firm_id,
      displayName: name,
      email: normalizedEmail,
    });
    clientId = created.id;
    await clientsRepository.updateClientAuth(clientId, { passwordHash });
  }

  await clientsRepository.updatePortalAccessStatus(clientId, 'ACTIVE');
  await invitesRepository.markInviteAccepted(invite.id, clientId);

  const firm = await firmsRepository.findFirmById(invite.firm_id).catch(() => null);
  void contabilNotifications
    .notifyClientWelcome({
      clientEmail: normalizedEmail,
      clientName: name,
      firmName: firm?.name || null,
    })
    .catch(() => {
      /* soft-fail */
    });

  await securityAudit.recordClientMutation({
    action: 'client.invite.accepted',
    actor: { id: clientId, role: 'CLIENT' },
    firmId: invite.firm_id,
    clientId,
    metadata: { inviteId: invite.id },
    req: req || null,
  });

  return {
    userId: String(clientId),
    firmId: String(invite.firm_id),
    clientId: String(clientId),
  };
}

const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');

const ACCESS_HISTORY_LABELS = {
  'client.invite.sent': 'Convite criado / enviado',
  'client.invite.resent': 'Novo convite emitido',
  'client.invite.bulk_sent': 'Convite em massa',
  'client.invite.accepted': 'Convite utilizado / acesso activado',
  'client.access.revoked': 'Acesso revogado pelo administrador',
};

async function getClientAccessHistory({ firmId, clientId }) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  const rows = await auditRepository.listByEntity({
    firmId,
    entityType: 'client',
    entityId: clientId,
    limit: 100,
  });

  const items = (rows || [])
    .filter((row) => String(row.action || '').startsWith('client.invite.') || row.action === 'client.access.revoked')
    .map((row) => ({
      id: row.id,
      action: row.action,
      label: ACCESS_HISTORY_LABELS[row.action] || row.action,
      createdAt: row.createdAt,
      metadata: row.metadata || {},
    }));

  return {
    portalAccessStatus: client.portalAccessStatus || 'NO_ACCESS',
    items,
  };
}

async function buildInviteEmailPreview({ firmId, clientName }) {
  const branding = await resolveInviteBranding(firmId);
  return contabilNotifications.buildClientInviteEmailContent({
    clientName: clientName || 'Cliente',
    firmName: branding.firmName || 'o seu escritório',
    inviteUrl: 'https://teglion.com/convite/exemplo',
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    firmContactEmail: branding.contactEmail,
    firmContactPhone: branding.contactPhone,
    firmWebsite: branding.website,
  });
}

async function sendTestInviteEmail({ firmId, toEmail, subject, bodyText }) {
  const email = normalizeEmail(toEmail);
  if (!email) throw new AppError('Indique o e-mail de teste', 400);
  const branding = await resolveInviteBranding(firmId);
  const delivery = await contabilNotifications.notifyClientInvite({
    clientEmail: email,
    clientName: 'Cliente (teste)',
    firmName: branding.firmName,
    inviteUrl: 'https://teglion.com/convite/exemplo',
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    firmLogoUrl: branding.logoUrl,
    firmBrandColor: branding.brandColor,
    firmContactEmail: branding.contactEmail,
    firmContactPhone: branding.contactPhone,
    firmWebsite: branding.website,
    subjectOverride: subject || null,
    bodyTextOverride: bodyText || null,
  });
  if (delivery?.skipped) {
    const hint =
      delivery.reason === 'email_disabled'
        ? 'O envio de e-mail está desactivado (BREVO_API_KEY em falta no servidor).'
        : delivery.reason === 'missing_from_email'
          ? 'Falta FROM_EMAIL no servidor.'
          : 'O e-mail de teste não foi enviado.';
    throw new AppError(hint, 503, { code: 'EMAIL_NOT_SENT' });
  }
  return { sent: true, messageId: delivery?.messageId || null };
}

module.exports = {
  createClientInvite,
  revokeClientAccess,
  resendClientInvite,
  createBulkClientInvites,
  getInvitePublicPreview,
  registerClientWithInvite,
  getClientAccessHistory,
  buildInviteEmailPreview,
  sendTestInviteEmail,
  buildInviteUrl,
};
