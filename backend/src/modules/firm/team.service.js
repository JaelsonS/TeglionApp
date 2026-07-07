const { AppError } = require('../../middlewares/error.middleware');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const departmentsRepository = require('../../db/supabase/repositories/departments.repository');
const securityAudit = require('../../services/audit/security-audit.service');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const { hashPassword } = require('../../utils/password-crypto');
const { assertStrongPassword } = require('../../utils/password-policy');
const { notifyFirmStaffWelcome } = require('../../services/notifications/contabil-notifications.service');

const ALLOWED_ROLES = new Set(['FIRM_OWNER', 'FIRM_STAFF', 'FIRM_CONSULTANT']);

function normalizeRole(role) {
    const value = String(role || '').trim().toUpperCase();
    if (!ALLOWED_ROLES.has(value)) {
        throw new AppError('Role inválida para membro da equipa.', 400);
    }
    return value;
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

async function listMembers(firmId) {
    const [members, departments] = await Promise.all([
        firmUsersRepository.listFirmUsers(firmId, { activeOnly: false }),
        departmentsRepository.listDepartments(firmId, { activeOnly: false }),
    ]);
    const depMap = new Map(departments.map((d) => [String(d.id), d]));
    return members.map((m) => ({
        ...m,
        department: m.departmentId ? depMap.get(String(m.departmentId)) || null : null,
    }));
}

async function getMember(firmId, memberId) {
    const member = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!member) throw new AppError('Membro não encontrado.', 404);
    let department = null;
    if (member.departmentId) {
        department = await departmentsRepository.findDepartmentById(firmId, member.departmentId);
    }
    return { ...member, department };
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

    const role = payload.role ? normalizeRole(payload.role) : 'FIRM_STAFF';
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

    if (payload.sendWelcomeEmail === true) {
        const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
        void notifyFirmStaffWelcome({
            staffEmail: created.email,
            staffName: created.fullName,
            firmName: firm?.name || null,
        }).catch(() => { });
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
            welcomeEmailSent: payload.sendWelcomeEmail === true,
        },
        req,
    });

    return getMember(firmId, created.id);
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
        patch.role = normalizeRole(payload.role);
    }
    if (payload.jobTitle !== undefined) {
        patch.jobTitle = normalizeJobTitle(payload.jobTitle);
    }
    if (payload.departmentId !== undefined) {
        const departmentId = payload.departmentId || null;
        await assertDepartmentBelongsToFirm(firmId, departmentId);
        patch.departmentId = departmentId;
    }

    if (Object.keys(patch).length === 0) {
        return getMember(firmId, memberId);
    }

    const updated = await firmUsersRepository.updateFirmMember(firmId, memberId, patch);

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

    return getMember(firmId, updated.id);
}

async function deactivateMember({ firmId, memberId, actor, req }) {
    const current = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!current) throw new AppError('Membro não encontrado.', 404);
    if (String(current.id) === String(actor.id)) {
        throw new AppError('Não é permitido desativar o próprio utilizador.', 400);
    }

    const all = await firmUsersRepository.listFirmUsers(firmId, { activeOnly: false });
    const activeOwners = all.filter((u) => u.isActive && u.role === 'FIRM_OWNER');
    if (current.role === 'FIRM_OWNER' && activeOwners.length <= 1) {
        throw new AppError('Não é possível desativar o último owner do escritório.', 400);
    }

    const updated = await firmUsersRepository.setFirmMemberActive(firmId, memberId, false);
    await securityAudit.recordTeamMutation({
        action: 'team.member.deactivated',
        actor,
        firmId,
        targetUserId: updated.id,
        metadata: { role: updated.role },
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
};
