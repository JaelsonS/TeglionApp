const { AppError } = require('../../middlewares/error.middleware');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('../../utils/permissions');
const securityAudit = require('../../services/audit/security-audit.service');

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

function effectivePermissionsForMember(member) {
    const rolePermissions = ROLE_PERMISSIONS[String(member.role || '').trim()] || [];
    const override = Array.isArray(member.permissionsOverride) ? member.permissionsOverride : null;
    return override || rolePermissions;
}

async function getTeamPermissions({ firmId, memberId }) {
    const member = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!member) throw new AppError('Membro não encontrado.', 404);

    const rolePermissions = ROLE_PERMISSIONS[String(member.role || '').trim()] || [];
    return {
        memberId: member.id,
        role: member.role,
        rolePermissions,
        overridePermissions: Array.isArray(member.permissionsOverride) ? member.permissionsOverride : null,
        effectivePermissions: effectivePermissionsForMember(member),
        availablePermissions: ALL_PERMISSIONS,
    };
}

async function patchTeamPermissions({ firmId, memberId, actor, payload, req }) {
    const member = await firmUsersRepository.findFirmUserByIdForFirm(firmId, memberId);
    if (!member) throw new AppError('Membro não encontrado.', 404);

    const mode = String(payload.mode || 'INHERIT').trim().toUpperCase();
    if (!['INHERIT', 'OVERRIDE'].includes(mode)) {
        throw new AppError('Modo inválido. Use INHERIT ou OVERRIDE.', 400);
    }

    let permissionsOverride = null;
    if (mode === 'OVERRIDE') {
        if (!Array.isArray(payload.permissions)) {
            throw new AppError('Permissões inválidas.', 400);
        }
        permissionsOverride = payload.permissions
            .map((p) => String(p || '').trim())
            .filter((p) => ALL_PERMISSIONS.includes(p));
    }

    const updated = await firmUsersRepository.updateFirmMember(firmId, memberId, {
        permissionsOverride,
    });

    await securityAudit.recordTeamMutation({
        action: 'team.member.permissions.updated',
        actor,
        firmId,
        targetUserId: memberId,
        metadata: { mode, permissionsCount: permissionsOverride ? permissionsOverride.length : 0 },
        req,
    });

    return {
        memberId: updated.id,
        mode,
        overridePermissions: permissionsOverride,
        effectivePermissions: effectivePermissionsForMember(updated),
    };
}

module.exports = {
    getTeamPermissions,
    patchTeamPermissions,
    ALL_PERMISSIONS,
};
