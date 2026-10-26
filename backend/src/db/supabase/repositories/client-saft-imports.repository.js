const { getSupabaseAdmin } = require('../client');

function mapImport(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id || null,
    originalFilename: row.original_filename,
    contentSha256: row.content_sha256,
    fileBytes: row.file_bytes,
    sourceKind: row.source_kind,
    auditFileVersion: row.audit_file_version || null,
    companyId: row.company_id || null,
    taxRegistrationNumber: row.tax_registration_number || null,
    companyName: row.company_name || null,
    fiscalYear: row.fiscal_year || null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    currencyCode: row.currency_code || null,
    productId: row.product_id || null,
    productVersion: row.product_version || null,
    summary: row.summary || {},
    validationStatus: row.validation_status,
    validationNotes: row.validation_notes || [],
    createdBy: row.created_by || null,
    createdAt: row.created_at,
  };
}

async function listImports(firmId, { limit = 50, clientId } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('client_saft_imports')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(limit) || 50, 200));
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapImport);
}

async function findById(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_saft_imports')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapImport(data);
}

async function findByHash(firmId, sha256) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_saft_imports')
    .select('*')
    .eq('firm_id', firmId)
    .eq('content_sha256', sha256)
    .maybeSingle();
  if (error) throw error;
  return mapImport(data);
}

async function insertImport(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('client_saft_imports')
    .insert({
      firm_id: data.firmId,
      client_id: data.clientId || null,
      original_filename: data.originalFilename,
      content_sha256: data.contentSha256,
      file_bytes: data.fileBytes,
      source_kind: data.sourceKind || 'xml',
      audit_file_version: data.auditFileVersion || null,
      company_id: data.companyId || null,
      tax_registration_number: data.taxRegistrationNumber || null,
      company_name: data.companyName || null,
      fiscal_year: data.fiscalYear || null,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      currency_code: data.currencyCode || null,
      product_id: data.productId || null,
      product_version: data.productVersion || null,
      summary: data.summary || {},
      validation_status: data.validationStatus || 'ok',
      validation_notes: data.validationNotes || [],
      created_by: data.createdBy || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapImport(inserted);
}

async function deleteImport(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_saft_imports')
    .delete()
    .eq('firm_id', firmId)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

module.exports = {
  mapImport,
  listImports,
  findById,
  findByHash,
  insertImport,
  deleteImport,
};
