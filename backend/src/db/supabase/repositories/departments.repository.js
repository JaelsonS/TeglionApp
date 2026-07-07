const { getSupabaseAdmin } = require('../client');

function mapDepartment(row) {
    if (!row) return null;
    return {
        id: row.id,
        firmId: row.firm_id,
        name: row.name,
        code: row.code,
        color: row.color,
        isDefault: Boolean(row.is_default),
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function listDepartments(firmId, { activeOnly = false } = {}) {
    const sb = getSupabaseAdmin();
    let q = sb
        .from('departments')
        .select('id, firm_id, name, code, color, is_default, is_active, created_at, updated_at')
        .eq('firm_id', firmId)
        .order('name', { ascending: true });
    if (activeOnly) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(mapDepartment);
}

async function findDepartmentById(firmId, departmentId) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
        .from('departments')
        .select('id, firm_id, name, code, color, is_default, is_active, created_at, updated_at')
        .eq('firm_id', firmId)
        .eq('id', departmentId)
        .maybeSingle();
    if (error) throw error;
    return mapDepartment(data);
}

async function createDepartment({ firmId, name, code, color, isDefault = false, isActive = true }) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
        .from('departments')
        .insert({
            firm_id: firmId,
            name,
            code: code || null,
            color: color || null,
            is_default: Boolean(isDefault),
            is_active: Boolean(isActive),
        })
        .select('id, firm_id, name, code, color, is_default, is_active, created_at, updated_at')
        .single();
    if (error) throw error;
    return mapDepartment(data);
}

async function updateDepartment(firmId, departmentId, patch) {
    const sb = getSupabaseAdmin();
    const update = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.code !== undefined) update.code = patch.code || null;
    if (patch.color !== undefined) update.color = patch.color || null;
    if (patch.isDefault !== undefined) update.is_default = Boolean(patch.isDefault);
    if (patch.isActive !== undefined) update.is_active = Boolean(patch.isActive);

    const { data, error } = await sb
        .from('departments')
        .update(update)
        .eq('firm_id', firmId)
        .eq('id', departmentId)
        .select('id, firm_id, name, code, color, is_default, is_active, created_at, updated_at')
        .single();
    if (error) throw error;
    return mapDepartment(data);
}

async function countFirmUsersByDepartment(firmId, departmentId) {
    const sb = getSupabaseAdmin();
    const { count, error } = await sb
        .from('firm_users')
        .select('id', { count: 'exact', head: true })
        .eq('firm_id', firmId)
        .eq('department_id', departmentId)
        .eq('is_active', true);
    if (error) throw error;
    return Number(count || 0);
}

module.exports = {
    mapDepartment,
    listDepartments,
    findDepartmentById,
    createDepartment,
    updateDepartment,
    countFirmUsersByDepartment,
};
