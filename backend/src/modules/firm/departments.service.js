const { AppError } = require('../../middlewares/error.middleware');
const departmentsRepository = require('../../db/supabase/repositories/departments.repository');
const securityAudit = require('../../services/audit/security-audit.service');

function normalizeName(name) {
    const value = String(name || '').trim();
    if (!value || value.length < 2) {
        throw new AppError('Nome do departamento inválido.', 400);
    }
    if (value.length > 80) {
        throw new AppError('Nome do departamento excede o limite de 80 caracteres.', 400);
    }
    return value;
}

function normalizeOptional(field, max) {
    if (field === undefined) return undefined;
    const value = String(field || '').trim();
    if (!value) return null;
    if (value.length > max) {
        throw new AppError(`Campo excede o limite de ${max} caracteres.`, 400);
    }
    return value;
}

async function list(firmId) {
    return departmentsRepository.listDepartments(firmId, { activeOnly: false });
}

async function create({ firmId, actor, payload, req }) {
    const name = normalizeName(payload.name);
    const code = normalizeOptional(payload.code, 24);
    const color = normalizeOptional(payload.color, 24);

    const created = await departmentsRepository.createDepartment({
        firmId,
        name,
        code,
        color,
        isDefault: Boolean(payload.isDefault),
        isActive: payload.isActive !== false,
    });

    await securityAudit.recordTeamMutation({
        action: 'team.department.created',
        actor,
        firmId,
        targetUserId: created.id,
        metadata: { name: created.name },
        req,
    });

    return created;
}

async function patch({ firmId, departmentId, actor, payload, req }) {
    const current = await departmentsRepository.findDepartmentById(firmId, departmentId);
    if (!current) throw new AppError('Departamento não encontrado.', 404);

    const patch = {};
    if (payload.name !== undefined) patch.name = normalizeName(payload.name);
    if (payload.code !== undefined) patch.code = normalizeOptional(payload.code, 24);
    if (payload.color !== undefined) patch.color = normalizeOptional(payload.color, 24);
    if (payload.isDefault !== undefined) patch.isDefault = Boolean(payload.isDefault);
    if (payload.isActive !== undefined) patch.isActive = Boolean(payload.isActive);

    if (Object.keys(patch).length === 0) return current;

    const updated = await departmentsRepository.updateDepartment(firmId, departmentId, patch);

    await securityAudit.recordTeamMutation({
        action: 'team.department.updated',
        actor,
        firmId,
        targetUserId: updated.id,
        metadata: { changedFields: Object.keys(patch), name: updated.name },
        req,
    });

    return updated;
}

async function remove({ firmId, departmentId, actor, req }) {
    const current = await departmentsRepository.findDepartmentById(firmId, departmentId);
    if (!current) throw new AppError('Departamento não encontrado.', 404);

    const activeMembers = await departmentsRepository.countFirmUsersByDepartment(firmId, departmentId);
    if (activeMembers > 0) {
        throw new AppError('Não é possível desativar um departamento com membros ativos.', 409);
    }

    const updated = await departmentsRepository.updateDepartment(firmId, departmentId, { isActive: false });

    await securityAudit.recordTeamMutation({
        action: 'team.department.deactivated',
        actor,
        firmId,
        targetUserId: updated.id,
        metadata: { name: updated.name },
        req,
    });

    return updated;
}

module.exports = {
    list,
    create,
    patch,
    remove,
};
