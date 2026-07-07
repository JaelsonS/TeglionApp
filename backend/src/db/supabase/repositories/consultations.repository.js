const { getSupabaseAdmin } = require('../client');

function mapConsultation(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    staffId: row.staff_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    notes: row.notes,
    accountingServiceId: row.accounting_service_id,
    priceCents: row.price_cents,
    currency: row.currency,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listConsultations({ firmId, clientId, from, to, limit = 100 }) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('consultations')
    .select('*')
    .eq('firm_id', firmId)
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  if (clientId) q = q.eq('client_id', clientId);
  if (from) q = q.gte('scheduled_at', from);
  if (to) q = q.lte('scheduled_at', to);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapConsultation);
}

async function createConsultation(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('consultations')
    .insert({
      firm_id: data.firmId,
      client_id: data.clientId,
      staff_id: data.staffId || null,
      title: data.title,
      scheduled_at: data.scheduledAt,
      duration_minutes: data.durationMinutes || 60,
      status: data.status || 'SCHEDULED',
      notes: data.notes || null,
      accounting_service_id: data.accountingServiceId ?? null,
      price_cents: data.priceCents ?? null,
      currency: data.currency ?? 'EUR',
      source: data.source || 'FIRM',
    })
    .select()
    .single();
  if (error) throw error;
  return mapConsultation(inserted);
}

async function findRecentDuplicateConsultation({
  firmId,
  clientId,
  staffId,
  title,
  scheduledAt,
  withinSeconds = 20,
}) {
  const sb = getSupabaseAdmin();
  const after = new Date(Date.now() - withinSeconds * 1000).toISOString();
  let q = sb
    .from('consultations')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('scheduled_at', scheduledAt)
    .eq('title', title)
    .gte('created_at', after)
    .order('created_at', { ascending: false })
    .limit(1);
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q;
  if (error) throw error;
  return mapConsultation(data?.[0] || null);
}

async function updateConsultation(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.scheduledAt !== undefined) row.scheduled_at = patch.scheduledAt;
  if (patch.title !== undefined) row.title = patch.title;
  const { data, error } = await sb
    .from('consultations')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapConsultation(data);
}

module.exports = {
  listConsultations,
  createConsultation,
  findRecentDuplicateConsultation,
  updateConsultation,
};
