/**
 * Convites cliente ↔ escritório (Supabase).
 */
const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const { normalizeEmail } = require('../../utils/normalize');
const { hashPassword } = require('../../utils/password-crypto');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const invitesRepository = require('../../db/supabase/repositories/invites.repository');
const contabilAuth = require('../auth/contabil-auth.service');
const { assertStrongPassword } = require('../../utils/password-policy');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');

const INVITE_TTL_DAYS = 14;

function buildInviteUrl(token) {
  return contabilAuth.buildInviteUrl(token);
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function createClientInvite({ firmId: firmIdRaw, clientId, email, createdByUserId }) {
  const firmId = String(firmIdRaw);

  if (clientId) {
    const client = await clientsRepository.findClientById(firmId, clientId);
    if (!client) throw new AppError('Cliente não encontrado', 404);
    if (client.hasPortalAccess) {
      throw new AppError('Este cliente já tem acesso ao portal. Use recuperação de palavra-passe.', 409);
    }
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const invite = await invitesRepository.createInvite({
    firmId,
    clientId: clientId || null,
    email: email ? normalizeEmail(email) : null,
    token,
    expiresAt,
    createdBy: createdByUserId || null,
  });

  const inviteUrl = buildInviteUrl(token);
  const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
  let clientName = null;
  if (clientId) {
    const client = await clientsRepository.findClientById(firmId, clientId);
    clientName = client?.displayName || null;
  }
  const targetEmail = email ? normalizeEmail(email) : null;
  if (targetEmail) {
    void contabilNotifications
      .notifyClientInvite({
        clientEmail: targetEmail,
        clientName,
        firmName: firm?.name,
        inviteUrl,
        expiresAt,
      })
      .catch((err) => console.warn('[Teglion] invite email:', err.message));
  }

  return {
    invite,
    inviteUrl,
    expiresAt,
  };
}

async function getInvitePublicPreview(token) {
  const invite = await invitesRepository.findInviteByToken(String(token).trim());
  if (!invite) throw new AppError('Convite inválido ou expirado', 404);

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

async function registerClientWithInvite({ token, email, password, fullName }) {
  const invite = await invitesRepository.findInviteByToken(String(token).trim());
  if (!invite) throw new AppError('Convite inválido', 404);
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

  const existing = await clientsRepository.findClientByEmailForFirm(normalizedEmail, invite.firm_id);
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

  return {
    userId: String(clientId),
    firmId: String(invite.firm_id),
    clientId: String(clientId),
  };
}

module.exports = {
  createClientInvite,
  getInvitePublicPreview,
  registerClientWithInvite,
  buildInviteUrl,
};
