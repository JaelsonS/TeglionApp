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

function actorIsFirmOwner(actor) {
    return String(actor?.role || '').toUpperCase() === 'FIRM_OWNER';
}

/** Teto de permissões que o ator pode conceder a terceiros: nunca mais do que ele próprio tem. */
function actorEffectivePermissions(actor) {
    if (Array.isArray(actor?.permissions) && actor.permissions.length > 0) return actor.permissions;
    if (actor?.masterAccess) return ROLE_PERMISSIONS.FIRM_OWNER;
    return ROLE_PERMISSIONS[String(actor?.role || '').trim().toUpperCase()] || [];
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

    const isOwnerActor = actorIsFirmOwner(actor);

    // Sem isto, um ator com FIRM_MEMBER_PERMISSION_MANAGE delegado conseguia
    // conceder-se a si mesmo qualquer permissão (incluindo esta), ou reduzir as
    // permissões do dono do escritório, sem nunca tocar no `role` de ninguém.
    if (!isOwnerActor && String(member.id) === String(actor?.id)) {
        throw new AppError('Não pode alterar as suas próprias permissões.', 403, {
            code: 'SELF_PERMISSIONS_FORBIDDEN',
        });
    }

    if (!isOwnerActor && String(member.role || '').trim().toUpperCase() === 'FIRM_OWNER') {
        throw new AppError('Apenas o dono do escritório pode gerir permissões de outro dono.', 403, {
            code: 'OWNER_PERMISSIONS_FORBIDDEN',
        });
    }

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

        // Teto: um ator não-owner nunca pode conceder a terceiros uma permissão que ele
        // próprio não tem — impede escalada via concessão de FIRM_MEMBER_PERMISSION_MANAGE,
        // FIRM_MEMBER_ROLE_MANAGE, FIRM_BILLING_MANAGE, USERS_CREATE_ADMIN, etc. a si mesmo
        // ou a outro membro para depois assumir o controlo.
        if (!isOwnerActor) {
            const ceiling = new Set(actorEffectivePermissions(actor));
            const exceeded = permissionsOverride.filter((p) => !ceiling.has(p));
            if (exceeded.length > 0) {
                throw new AppError('Não pode conceder permissões que você mesmo não possui.', 403, {
                    code: 'PERMISSIONS_CEILING_EXCEEDED',
                });
            }
        }
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
