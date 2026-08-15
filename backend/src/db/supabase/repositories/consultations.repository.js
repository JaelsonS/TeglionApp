const { getSupabaseAdmin } = require('../client');

function mapConsultation(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    leadId: row.lead_id,
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
    googleEventId: row.google_event_id || null,
    googleSyncStatus: row.google_sync_status || null,
    googleSyncError: row.google_sync_error || null,
    googleSyncedAt: row.google_synced_at || null,
    holdExpiresAt: row.hold_expires_at || null,
    cancelReason: row.cancel_reason || null,
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
      client_id: data.clientId || null,
      lead_id: data.leadId || null,
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
      hold_expires_at: data.holdExpiresAt || null,
      cancel_reason: data.cancelReason || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapConsultation(inserted);
}

async function findRecentDuplicateConsultation({
  firmId,
  clientId,
  leadId,
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
    .eq('scheduled_at', scheduledAt)
    .eq('title', title)
    .gte('created_at', after)
    .order('created_at', { ascending: false })
    .limit(1);
  q = clientId ? q.eq('client_id', clientId) : q.eq('lead_id', leadId);
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q;
  if (error) throw error;
  return mapConsultation(data?.[0] || null);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('consultations')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return mapConsultation(data);
}

/** Repontar todas as consultations de um Lead para o Client resultante da conversão (mesmo padrão de service-inquiries.repository.js). */
async function reassignLeadToClient(firmId, leadId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('consultations')
    .update({ client_id: clientId, lead_id: null })
    .eq('firm_id', firmId)
    .eq('lead_id', leadId)
    .select();
  if (error) throw error;
  return (data || []).map(mapConsultation);
}

async function updateConsultation(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.scheduledAt !== undefined) row.scheduled_at = patch.scheduledAt;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.staffId !== undefined) row.staff_id = patch.staffId;
  if (patch.googleEventId !== undefined) row.google_event_id = patch.googleEventId;
  if (patch.googleSyncStatus !== undefined) row.google_sync_status = patch.googleSyncStatus;
  if (patch.googleSyncError !== undefined) row.google_sync_error = patch.googleSyncError;
  if (patch.googleSyncedAt !== undefined) row.google_synced_at = patch.googleSyncedAt;
  if (patch.holdExpiresAt !== undefined) row.hold_expires_at = patch.holdExpiresAt;
  if (patch.cancelReason !== undefined) row.cancel_reason = patch.cancelReason;
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

async function countAttentionByFirm(firmId, { upcomingDays = 14 } = {}) {
  const sb = getSupabaseAdmin();
  const now = new Date();
  const until = new Date(now.getTime() + Math.max(1, Number(upcomingDays) || 14) * 24 * 60 * 60 * 1000);
  const fromIso = now.toISOString();
  const toIso = until.toISOString();

  const [upcomingRes, pendingPayRes] = await Promise.all([
    sb
      .from('consultations')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('status', 'SCHEDULED')
      .gte('scheduled_at', fromIso)
      .lte('scheduled_at', toIso),
    sb
      .from('consultations')
      .select('id', { count: 'exact', head: true })
      .eq('firm_id', firmId)
      .eq('status', 'PENDING_PAYMENT'),
  ]);
  if (upcomingRes.error) throw upcomingRes.error;
  if (pendingPayRes.error) throw pendingPayRes.error;
  const upcoming = Number(upcomingRes.count || 0);
  const pendingPayment = Number(pendingPayRes.count || 0);
  return {
    count: upcoming + pendingPayment,
    upcoming,
    pendingPayment,
  };
}

async function listExpiredPaymentHolds({ beforeIso, limit = 50 } = {}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('consultations')
    .select('*')
    .eq('status', 'PENDING_PAYMENT')
    .lt('hold_expires_at', beforeIso || new Date().toISOString())
    .order('hold_expires_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapConsultation);
}

module.exports = {
  listConsultations,
  createConsultation,
  findRecentDuplicateConsultation,
  findByIdForFirm,
  reassignLeadToClient,
  updateConsultation,
  countAttentionByFirm,
  listExpiredPaymentHolds,
};
