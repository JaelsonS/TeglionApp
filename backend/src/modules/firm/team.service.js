const { AppError } = require('../../middlewares/error.middleware');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const departmentsRepository = require('../../db/supabase/repositories/departments.repository');
const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
const securityAudit = require('../../services/audit/security-audit.service');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const { hashPassword } = require('../../utils/password-crypto');
const { assertStrongPassword } = require('../../utils/password-policy');
const { notifyFirmStaffWelcome } = require('../../services/notifications/contabil-notifications.service');
const { PERMISSIONS, hasPermissionForUser } = require('../../utils/permissions');

const ALLOWED_ROLES = new Set(['FIRM_OWNER', 'FIRM_STAFF', 'FIRM_CONSULTANT']);

function normalizeRole(role) {
    const value = String(role || '').trim().toUpperCase();
    if (!ALLOWED_ROLES.has(value)) {
        throw new AppError('Role inválida para membro da equipa.', 400);
    }
    return value;
}

function actorIsFirmOwner(actor) {
    return String(actor?.role || '').toUpperCase() === 'FIRM_OWNER';
}

/**
 * SEC-H1: staff nunca atribui/remove FIRM_OWNER; alterações de role exigem
 * FIRM_MEMBER_ROLE_MANAGE (só owner por defeito). Criar/convidar STAFF/CONSULTANT
 * continua permitido a quem já passou USERS_CREATE / FIRM_INVITES_MANAGE.
 */
function assertActorCanAssignRole(actor, targetRole, { previousRole = null } = {}) {
    const nextRole = normalizeRole(targetRole);
    const prev = previousRole != null ? String(previousRole).trim().toUpperCase() : null;
    if (prev && prev === nextRole) return nextRole;

    const touchesOwner = nextRole === 'FIRM_OWNER' || prev === 'FIRM_OWNER';
    if (touchesOwner && !actorIsFirmOwner(actor)) {
        throw new AppError('Apenas o dono do escritório pode gerir o papel FIRM_OWNER.', 403, {
            code: 'OWNER_ROLE_FORBIDDEN',
        });
    }

    // Alteração de role num membro existente (não é create/invite com role inicial).
    if (prev != null && prev !== nextRole) {
        const canManageRoles =
            actorIsFirmOwner(actor) || hasPermissionForUser(actor, PERMISSIONS.FIRM_MEMBER_ROLE_MANAGE);
        if (!canManageRoles) {
            throw new AppError('Não tem permissão para alterar o nível de acesso.', 403, {
                code: 'ROLE_CHANGE_FORBIDDEN',
            });
        }
    }

    return nextRole;
}

function normalizeJobTitle(value) {
    if (value === undefined) return undefined;
    const clean = String(value || '').trim();
    if (!clean) return null;
    if (clean.length < 2) {
        throw new AppError('Cargo/função inválido.', 400);
    }
    if (clean.length > 80) {
        throw new AppError('Cargo/função excede o limite de 80 caracteres.', 400);
    }
    return clean;
}

async function assertDepartmentBelongsToFirm(firmId, departmentId) {
    if (!departmentId) return null;
    const dep = await departmentsRepository.findDepartmentById(firmId, departmentId);
    if (!dep) throw new AppError('Departamento não encontrado.', 404);
    return dep;
}

async function attachTagsToMembers(firmId, members) {
    if (!members?.length) return members || [];
    const ids = members.map((m) => m.id);
    const linkRows = await firmInquiryTagsRepository.listLinksForFirmUsers(firmId, ids);
    const tagsByUser = firmInquiryTagsRepository.mapLinkRowsToTagsByKey(linkRows, 'firm_user_id');
    return members.map((m) => ({
        ...m,
        tags: tagsByUser.get(m.id) || [],
    }));
}

async function listMembers(firmId) {
    const [members, departments] = await Promise.all([
        firmUsersRepository.listFirmUsers(firmId, { activeOnly: false }),
        departmentsRepository.listDepartments(firmId, { activeOnly: false }),
    ]);
    const depMap = new Map(departments.map((d) => [String(d.id), d]));
    const withDept = members.map((m) => {
        const department = m.departmentId ? depMap.get(String(m.departmentId)) || null : null;
        return {
            ...m,
            department,
            departmentName: department?.name || null,
        };
    });
    return attachTagsToMembers(firmId, withDept);
}

async function getMember(firmId, memberId) {
    const member = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!member) throw new AppError('Membro não encontrado.', 404);
    let department = null;
    if (member.departmentId) {
        department = await departmentsRepository.findDepartmentById(firmId, member.departmentId);
    }
    const [withTags] = await attachTagsToMembers(firmId, [
        {
            ...member,
            department,
            departmentName: department?.name || null,
        },
    ]);
    return withTags;
}

async function createMember({ firmId, actor, payload, req }) {
    const email = String(payload.email || '').trim().toLowerCase();
    const fullName = String(payload.fullName || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('E-mail inválido.', 400);
    }
    if (!fullName || fullName.length < 2) {
        throw new AppError('Nome inválido.', 400);
    }

    const role = payload.role
        ? assertActorCanAssignRole(actor, payload.role)
        : 'FIRM_STAFF';
    const jobTitle = normalizeJobTitle(payload.jobTitle);
    const departmentId = payload.departmentId || null;
    await assertDepartmentBelongsToFirm(firmId, departmentId);

    const creationMode = String(payload.creationMode || 'DIRECT').trim().toUpperCase();
    if (creationMode !== 'DIRECT') {
        throw new AppError('Para convites, utilize o endpoint dedicado /team/invites.', 400);
    }

    let passwordHash = null;
    assertStrongPassword(payload.password);
    passwordHash = await hashPassword(String(payload.password));

    const duplicate = await firmUsersRepository.findFirmUserByEmail(email);
    if (duplicate && String(duplicate.firm_id) === String(firmId)) {
        throw new AppError('Já existe um membro com este e-mail neste escritório.', 409);
    }

    const created = await firmUsersRepository.createFirmMember({
        firmId,
        email,
        fullName,
        role,
        jobTitle,
        departmentId,
        invitedBy: actor.id,
        invitedAt: null,
        inviteStatus: 'ACCEPTED',
        passwordHash,
        isActive: true,
        emailConfirmedAt: new Date().toISOString(),
    });

    let welcomeEmailSent = false;
    let welcomeEmailError = null;
    if (payload.sendWelcomeEmail === true) {
        try {
            const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
            const delivery = await notifyFirmStaffWelcome({
                staffEmail: created.email,
                staffName: created.fullName,
                firmName: firm?.name || null,
            });
            if (delivery?.skipped) {
                welcomeEmailError = 'email_disabled';
                console.warn('[Teglion][team] welcome email skipped (BREVO desactivado):', created.email);
            } else {
                welcomeEmailSent = true;
            }
        } catch (err) {
            welcomeEmailError = err?.response?.data?.message || err?.message || 'email_delivery_failed';
            console.warn('[Teglion][team] falha no e-mail de boas-vindas:', welcomeEmailError);
        }
    }

    await securityAudit.recordTeamMutation({
        action: 'team.member.created',
        actor,
        firmId,
        targetUserId: created.id,
        metadata: {
            role: created.role,
            jobTitle: created.jobTitle,
            departmentId: created.departmentId,
            creationMode: 'DIRECT',
            welcomeEmailRequested: payload.sendWelcomeEmail === true,
            welcomeEmailSent,
            welcomeEmailError,
        },
        req,
    });

    const member = await getMember(firmId, created.id);
    return { ...member, welcomeEmailSent, welcomeEmailError };
}

async function updateMember({ firmId, memberId, actor, payload, req }) {
    const current = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!current) throw new AppError('Membro não encontrado.', 404);

    const patch = {};
    if (payload.fullName !== undefined) {
        const fullName = String(payload.fullName || '').trim();
        if (fullName.length < 2) throw new AppError('Nome inválido.', 400);
        patch.fullName = fullName;
    }
    if (payload.email !== undefined) {
        const email = String(payload.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('E-mail inválido.', 400);
        const taken = await firmUsersRepository.findFirmUserByEmailExcluding(email, memberId);
        if (taken && String(taken.firm_id) === String(firmId)) {
            throw new AppError('Este e-mail já está associado a outra conta.', 409);
        }
        patch.email = email;
    }
    if (payload.role !== undefined) {
        patch.role = assertActorCanAssignRole(actor, payload.role, { previousRole: current.role });
    }
    if (payload.jobTitle !== undefined) {
        patch.jobTitle = normalizeJobTitle(payload.jobTitle);
    }
    if (payload.departmentId !== undefined) {
        const departmentId = payload.departmentId || null;
        await assertDepartmentBelongsToFirm(firmId, departmentId);
        patch.departmentId = departmentId;
    }

    if (Object.keys(patch).length === 0 && !Array.isArray(payload.tagIds)) {
        return getMember(firmId, memberId);
    }

    const updated =
        Object.keys(patch).length > 0
            ? await firmUsersRepository.updateFirmMember(firmId, memberId, patch)
            : current;

    if (Array.isArray(payload.tagIds)) {
        const tagIds = await firmInquiryTagsRepository.resolveAllowedTagIds(firmId, payload.tagIds);
        await firmInquiryTagsRepository.replaceLinksForFirmUser(firmId, memberId, tagIds);
    }

    if (Object.keys(patch).length > 0) {
        await securityAudit.recordTeamMutation({
            action: 'team.member.updated',
            actor,
            firmId,
            targetUserId: updated.id,
            metadata: {
                changedFields: Object.keys(patch),
                role: updated.role,
                jobTitle: updated.jobTitle,
                departmentId: updated.departmentId,
            },
            req,
        });
    }

    return getMember(firmId, updated.id);
}

async function deactivateMember({ firmId, memberId, actor, req }) {
    const current = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!current) throw new AppError('Membro não encontrado.', 404);
    if (String(current.id) === String(actor.id)) {
        throw new AppError('Não é permitido desativar o próprio utilizador.', 400);
    }

    if (current.role === 'FIRM_OWNER' && !actorIsFirmOwner(actor)) {
        throw new AppError('Apenas o dono do escritório pode desativar outro dono.', 403, {
            code: 'OWNER_ROLE_FORBIDDEN',
        });
    }

    const all = await firmUsersRepository.listFirmUsers(firmId, { activeOnly: false });
    const activeOwners = all.filter((u) => u.isActive && u.role === 'FIRM_OWNER');
    if (current.role === 'FIRM_OWNER' && activeOwners.length <= 1) {
        throw new AppError('Não é possível desativar o último owner do escritório.', 400);
    }

    const updated = await firmUsersRepository.setFirmMemberActive(firmId, memberId, false);
    // Sem isto, o refresh token do membro desativado continua válido e a
    // renovar-se indefinidamente — mesma falha que já foi corrigida para
    // clientes em invites.service.js#revokeClientAccess.
    await authRefreshSessionsRepository.deleteAllForActor('firm_user', memberId);
    await securityAudit.recordTeamMutation({
        action: 'team.member.deactivated',
        actor,
        firmId,
        targetUserId: updated.id,
        metadata: { role: updated.role, sessionsRevoked: true },
        req,
    });
    return getMember(firmId, updated.id);
}

async function reactivateMember({ firmId, memberId, actor, req }) {
    const current = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!current) throw new AppError('Membro não encontrado.', 404);

    const updated = await firmUsersRepository.setFirmMemberActive(firmId, memberId, true);
    await securityAudit.recordTeamMutation({
        action: 'team.member.reactivated',
        actor,
        firmId,
        targetUserId: updated.id,
        metadata: { role: updated.role },
        req,
    });
    return getMember(firmId, updated.id);
}

module.exports = {
    listMembers,
    getMember,
    createMember,
    updateMember,
    deactivateMember,
    reactivateMember,
    assertActorCanAssignRole,
};
