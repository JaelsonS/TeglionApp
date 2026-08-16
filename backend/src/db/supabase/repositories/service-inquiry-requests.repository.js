const { getSupabaseAdmin } = require('../client');
const { encryptField, decryptField } = require('../../../utils/crypto-fields');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    serviceInquiryId: row.service_inquiry_id,
    kind: row.kind,
    tag: row.tag || null,
    title: row.title,
    instructions: row.instructions || null,
    status: row.status,
    textReply: row.text_reply_enc ? decryptField(row.text_reply_enc) : null,
    documentId: row.document_id || null,
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    answeredAt: row.answered_at || null,
  };
}

async function listByInquiry(serviceInquiryId, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiry_requests')
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
    .from('service_inquiry_requests')
    .select('*')
    .eq('id', id)
    .eq('service_inquiry_id', serviceInquiryId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

/** Encontra o pedido PENDING de um documento pela tag — usado pelo upload do mini-portal. */
async function findPendingDocumentByTag(serviceInquiryId, firmId, tag) {
  const sb = getSupabaseAdmin();
  // limit(1): se houver duplicados legados com a mesma tag, maybeSingle() rebenta.
  const { data, error } = await sb
    .from('service_inquiry_requests')
    .select('*')
    .eq('service_inquiry_id', serviceInquiryId)
    .eq('firm_id', firmId)
    .eq('kind', 'document')
    .eq('tag', tag)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function createRow({ firmId, serviceInquiryId, kind, tag, title, instructions, createdBy, status }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiry_requests')
    .insert({
      firm_id: firmId,
      service_inquiry_id: serviceInquiryId,
      kind,
      tag: tag || null,
      title,
      instructions: instructions || null,
      created_by: createdBy || null,
      status: status || 'PENDING',
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function createMany(rows) {
  if (!rows.length) return [];
  const sb = getSupabaseAdmin();
  const insertRows = rows.map((r) => ({
    firm_id: r.firmId,
    service_inquiry_id: r.serviceInquiryId,
    kind: r.kind,
    tag: r.tag || null,
    title: r.title,
    instructions: r.instructions || null,
    created_by: r.createdBy || null,
    status: r.status || 'PENDING',
  }));
  const { data, error } = await sb.from('service_inquiry_requests').insert(insertRows).select();
  if (error) throw error;
  return (data || []).map(map);
}

async function markAnswered(id, firmId, { documentId, textReply } = {}) {
  const sb = getSupabaseAdmin();
  const row = {
    status: 'ANSWERED',
    answered_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (documentId !== undefined) row.document_id = documentId;
  if (textReply !== undefined) row.text_reply_enc = textReply ? encryptField(textReply) : null;

  const { data, error } = await sb
    .from('service_inquiry_requests')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

module.exports = {
  listByInquiry,
  findByIdForInquiry,
  findPendingDocumentByTag,
  createRow,
  createMany,
  markAnswered,
  map,
};
