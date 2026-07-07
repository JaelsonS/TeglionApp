const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmMemberInvitesRepository = require('../../db/supabase/repositories/firm-member-invites.repository');
const emailConfirmationRepository = require('../../db/supabase/repositories/email-confirmation.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const { hashPassword } = require('../../utils/password-crypto');
const { assertStrongPassword } = require('../../utils/password-policy');
const securityAudit = require('../../services/audit/security-audit.service');
const {
    notifyFirmMemberInvite,
    notifyFirmStaffEmailConfirmation,
} = require('../../services/notifications/contabil-notifications.service');

const INVITE_TTL_DAYS = 14;
const EMAIL_CONFIRM_TTL_HOURS = 48;

function normalizeJobTitle(value) {
    if (value === undefined) return undefined;
    const clean = String(value || '').trim();
    if (!clean) return null;
    if (clean.length < 2) throw new AppError('Cargo/função inválido.', 400);
    if (clean.length > 80) throw new AppError('Cargo/função excede o limite de 80 caracteres.', 400);
    return clean;
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

async function sendEmailConfirmationForMember({ member, firmName }) {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EMAIL_CONFIRM_TTL_HOURS * 60 * 60 * 1000).toISOString();
    await emailConfirmationRepository.invalidateUserTokens('firm_user', member.id);
    await emailConfirmationRepository.createToken({
        userType: 'firm_user',
        userId: member.id,
        tokenHash,
        expiresAt,
    });
    void notifyFirmStaffEmailConfirmation({
        staffEmail: member.email,
        staffName: member.fullName,
        firmName,
        token: rawToken,
    }).catch(() => { });
}

async function createStaffInvite({ firmId, actor, payload, req }) {
    const email = String(payload.email || '').trim().toLowerCase();
    const fullName = String(payload.fullName || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('E-mail inválido.', 400);
    }
    if (!fullName || fullName.length < 2) {
        throw new AppError('Nome inválido.', 400);
    }

    const role = String(payload.role || 'FIRM_STAFF').trim().toUpperCase();
    const allowedRoles = new Set(['FIRM_OWNER', 'FIRM_STAFF', 'FIRM_CONSULTANT']);
    if (!allowedRoles.has(role)) throw new AppError('Role inválida.', 400);
    const jobTitle = normalizeJobTitle(payload.jobTitle);

    const existing = await firmUsersRepository.findFirmUserByEmail(email);
    if (existing && String(existing.firm_id) === String(firmId)) {
        throw new AppError('Já existe utilizador com este e-mail neste escritório.', 409);
    }

    const member = await firmUsersRepository.createFirmMember({
        firmId,
        email,
        fullName,
        role,
        jobTitle,
        departmentId: payload.departmentId || null,
        invitedBy: actor.id,
        invitedAt: new Date().toISOString(),
        inviteStatus: 'PENDING',
        isActive: false,
        emailConfirmedAt: null,
    });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const invite = await firmMemberInvitesRepository.createInvite({
        firmId,
        memberId: member.id,
        email,
        token,
        expiresAt,
        createdBy: actor.id,
    });

    const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
    void notifyFirmMemberInvite({
        staffEmail: email,
        staffName: fullName,
        firmName: firm?.name,
        inviteToken: token,
        expiresAt,
    }).catch(() => { });

    await securityAudit.recordTeamMutation({
        action: 'team.invite.sent',
        actor,
        firmId,
        targetUserId: member.id,
        metadata: {
            inviteId: invite.id,
            role: member.role,
            jobTitle: member.jobTitle,
            departmentId: member.departmentId,
        },
        req,
    });

    return { member, invite, inviteUrlToken: token };
}

async function resendStaffInvite({ firmId, memberId, actor, req }) {
    const member = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!member) throw new AppError('Membro não encontrado.', 404);
    if (member.inviteStatus !== 'PENDING') {
        throw new AppError('Apenas membros com convite pendente podem ser reenviados.', 409);
    }

    await firmMemberInvitesRepository.revokePendingInvitesForMember(memberId);

    const token = generateToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const invite = await firmMemberInvitesRepository.createInvite({
        firmId,
        memberId,
        email: member.email,
        token,
        expiresAt,
        createdBy: actor.id,
    });

    const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
    void notifyFirmMemberInvite({
        staffEmail: member.email,
        staffName: member.fullName,
        firmName: firm?.name,
        inviteToken: token,
        expiresAt,
    }).catch(() => { });

    await securityAudit.recordTeamMutation({
        action: 'team.invite.resent',
        actor,
        firmId,
        targetUserId: memberId,
        metadata: { inviteId: invite.id },
        req,
    });

    return { invite, inviteUrlToken: token };
}

async function revokeStaffInvite({ firmId, memberId, actor, req }) {
    const member = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!member) throw new AppError('Membro não encontrado.', 404);

    await firmMemberInvitesRepository.revokePendingInvitesForMember(memberId);
    await firmUsersRepository.updateFirmMember(firmId, memberId, {
        inviteStatus: 'REVOKED',
        isActive: false,
    });

    await securityAudit.recordTeamMutation({
        action: 'team.invite.revoked',
        actor,
        firmId,
        targetUserId: memberId,
        metadata: { reason: 'manual_revoke' },
        req,
    });

    return { revoked: true };
}

async function previewInvite(token) {
    const invite = await firmMemberInvitesRepository.findInviteByToken(String(token || '').trim());
    if (!invite) throw new AppError('Convite inválido.', 404);
    if (invite.status !== 'PENDING') throw new AppError('Convite já utilizado.', 410);
    if (new Date(invite.expires_at) < new Date()) {
        await firmMemberInvitesRepository.markInviteExpired(invite.id);
        throw new AppError('Convite expirado.', 410);
    }

    const member = await firmUsersRepository.findFirmUserById(invite.member_id);
    const firm = await firmsRepository.findFirmById(invite.firm_id);

    return {
        firmName: firm?.name || 'TegLion',
        emailHint: invite.email,
        fullNameHint: member?.full_name || null,
        jobTitleHint: member?.job_title || null,
        expiresAt: invite.expires_at,
    };
}

async function acceptInvite({ token, email, password, fullName, req }) {
    const invite = await firmMemberInvitesRepository.findInviteByToken(String(token || '').trim());
    if (!invite) throw new AppError('Convite inválido.', 404);
    if (invite.status !== 'PENDING') throw new AppError('Convite já utilizado.', 410);
    if (new Date(invite.expires_at) < new Date()) {
        await firmMemberInvitesRepository.markInviteExpired(invite.id);
        throw new AppError('Convite expirado.', 410);
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail !== String(invite.email || '').trim().toLowerCase()) {
        throw new AppError('Utilize o e-mail do convite.', 400);
    }
    assertStrongPassword(password);

    const member = await firmUsersRepository.findFirmUserByIdForFirm(invite.firm_id, invite.member_id);
    if (!member) throw new AppError('Membro não encontrado.', 404);

    const passwordHash = await hashPassword(String(password));
    const nextName = String(fullName || '').trim();

    const updated = await firmUsersRepository.updateFirmMember(invite.firm_id, invite.member_id, {
        fullName: nextName || member.fullName,
        passwordHash,
        inviteStatus: 'ACCEPTED',
        isActive: false,
        emailConfirmedAt: null,
    });

    await firmMemberInvitesRepository.markInviteAccepted(invite.id);

    const firm = await firmsRepository.findFirmById(invite.firm_id).catch(() => null);
    await sendEmailConfirmationForMember({ member: updated, firmName: firm?.name || null });

    await securityAudit.recordTeamMutation({
        action: 'team.invite.accepted',
        actor: { id: updated.id, role: updated.role },
        firmId: invite.firm_id,
        targetUserId: updated.id,
        metadata: { inviteId: invite.id },
        req,
    });

    return { success: true, emailConfirmationRequired: true };
}

async function confirmMemberEmail({ token, req }) {
    const tokenHash = hashToken(String(token || '').trim());
    const row = await emailConfirmationRepository.findValidToken(tokenHash);
    if (!row || row.user_type !== 'firm_user') {
        throw new AppError('Token de confirmação inválido ou expirado.', 410);
    }

    const user = await firmUsersRepository.findFirmUserById(row.user_id);
    if (!user) throw new AppError('Utilizador não encontrado.', 404);

    await firmUsersRepository.markFirmUserEmailConfirmed(user.id, user.firm_id);
    await emailConfirmationRepository.markTokenUsed(row.id);

    await securityAudit.recordTeamMutation({
        action: 'team.member.email_confirmed',
        actor: { id: user.id, role: user.role },
        firmId: user.firm_id,
        targetUserId: user.id,
        metadata: {},
        req,
    });

    return { confirmed: true };
}

module.exports = {
    createStaffInvite,
    resendStaffInvite,
    revokeStaffInvite,
    previewInvite,
    acceptInvite,
    confirmMemberEmail,
};
