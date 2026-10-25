const { getSupabaseAdmin } = require('../client');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id || null,
    calcType: row.calc_type,
    jurisdiction: row.jurisdiction,
    tax: row.tax,
    ruleVersion: row.rule_version,
    status: row.status,
    input: row.input_json || {},
    result: row.result_json || {},
    meta: row.meta_json || {},
    createdBy: row.created_by || null,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function insertCalculation(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('fiscal_calculations')
    .insert({
      firm_id: data.firmId,
      client_id: data.clientId || null,
      calc_type: data.calcType,
      jurisdiction: data.jurisdiction,
      tax: data.tax,
      rule_version: data.ruleVersion,
      status: data.status || 'simulation',
      input_json: data.input || {},
      result_json: data.result || {},
      meta_json: data.meta || {},
      created_by: data.createdBy || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(inserted);
}

async function findById(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('fiscal_calculations')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function listForFirm(firmId, { limit = 50, calcType } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('fiscal_calculations')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100));
  if (calcType) q = q.eq('calc_type', calcType);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapRow);
}

module.exports = {
  mapRow,
  insertCalculation,
  findById,
  listForFirm,
};
