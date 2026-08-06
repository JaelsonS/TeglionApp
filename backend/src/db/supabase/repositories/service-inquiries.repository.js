const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    serviceId: row.service_id,
    leadId: row.lead_id,
    clientId: row.client_id,
    consultationId: row.consultation_id,
    status: row.status,
    assignedStaffId: row.assigned_staff_id,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listByFirm(firmId, { status, serviceId, limit = 200, offset = 0 } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('service_inquiries')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  if (serviceId) q = q.eq('service_id', serviceId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(map);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiries')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function createRow({ firmId, serviceId, leadId, clientId, notes, assignedStaffId, createdBy }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiries')
    .insert({
      firm_id: firmId,
      service_id: serviceId,
      lead_id: leadId || null,
      client_id: clientId || null,
      notes: notes ? String(notes).trim() : null,
      assigned_staff_id: assignedStaffId || null,
      created_by: createdBy || null,
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function updateRow(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes ? String(patch.notes).trim() : null;
  if (patch.assignedStaffId !== undefined) row.assigned_staff_id = patch.assignedStaffId || null;
  if (patch.consultationId !== undefined) row.consultation_id = patch.consultationId || null;

  const { data, error } = await sb
    .from('service_inquiries')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

/** Repontar todas as ServiceInquiries de um Lead para o Client resultante da conversão (secção 3.2 da spec). */
async function reassignLeadToClient(firmId, leadId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiries')
    .update({ client_id: clientId, lead_id: null, updated_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('lead_id', leadId)
    .select();
  if (error) throw error;
  return (data || []).map(map);
}

module.exports = {
  listByFirm,
  findByIdForFirm,
  createRow,
  updateRow,
  reassignLeadToClient,
  map,
};
