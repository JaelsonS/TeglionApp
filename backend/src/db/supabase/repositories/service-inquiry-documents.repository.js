const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    serviceInquiryId: row.service_inquiry_id,
    tag: row.tag,
    title: row.title,
    storageProvider: row.storage_provider || 'supabase',
    storageKey: row.storage_key,
    mimeType: row.mime_type || null,
    sizeBytes: row.size_bytes || null,
    createdAt: row.created_at,
  };
}

async function listByInquiry(serviceInquiryId, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiry_documents')
    .select('*')
    .eq('service_inquiry_id', serviceInquiryId)
    .eq('firm_id', firmId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(map);
}

async function findByIdForInquiry(id, serviceInquiryId, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiry_documents')
    .select('*')
    .eq('id', id)
    .eq('service_inquiry_id', serviceInquiryId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function createRow({ firmId, serviceInquiryId, tag, title, storageProvider, storageKey, mimeType, sizeBytes }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiry_documents')
    .insert({
      firm_id: firmId,
      service_inquiry_id: serviceInquiryId,
      tag,
      title,
      storage_provider: storageProvider || 'supabase',
      storage_key: storageKey,
      mime_type: mimeType || null,
      size_bytes: sizeBytes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

module.exports = {
  listByInquiry,
  findByIdForInquiry,
  createRow,
  map,
};
