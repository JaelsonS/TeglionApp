const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    createdBy: row.created_by,
    status: row.status,
    answers: row.answers || {},
    proposal: row.proposal || null,
    generateCount: row.generate_count ?? 0,
    appliedAt: row.applied_at || null,
    appliedBy: row.applied_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createSession({ firmId, createdBy, answers }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('maya_setup_sessions')
    .insert({
      firm_id: firmId,
      created_by: createdBy,
      answers: answers || {},
      status: 'draft',
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('maya_setup_sessions')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function updateSession(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = {};
  if (patch.status != null) row.status = patch.status;
  if (patch.answers != null) row.answers = patch.answers;
  if (patch.proposal !== undefined) row.proposal = patch.proposal;
  if (patch.generateCount != null) row.generate_count = patch.generateCount;
  if (patch.appliedAt !== undefined) row.applied_at = patch.appliedAt;
  if (patch.appliedBy !== undefined) row.applied_by = patch.appliedBy;
  row.updated_at = new Date().toISOString();

  const { data, error } = await sb
    .from('maya_setup_sessions')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function countGeneratesSince(firmId, sinceIso) {
  const sb = getSupabaseAdmin();
  const { count, error } = await sb
    .from('maya_setup_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .gte('updated_at', sinceIso)
    .gt('generate_count', 0);
  if (error) throw error;
  return count || 0;
}

async function sumGenerateCountToday(firmId, dayStartIso) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('maya_setup_sessions')
    .select('generate_count')
    .eq('firm_id', firmId)
    .gte('updated_at', dayStartIso);
  if (error) throw error;
  return (data || []).reduce((n, row) => n + (Number(row.generate_count) || 0), 0);
}

module.exports = {
  createSession,
  findByIdForFirm,
  updateSession,
  sumGenerateCountToday,
};
