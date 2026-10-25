const { getSupabaseAdmin } = require('../client');

function mapCharge(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    yearMonth: row.year_month,
    amountCents: row.amount_cents,
    currency: row.currency || 'EUR',
    status: row.status,
    paymentMethod: row.payment_method || null,
    paidAt: row.paid_at || null,
    dueDate: row.due_date || null,
    notes: row.notes || null,
    source: row.source || 'manual',
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listChargesForYear(firmId, year) {
  const y = String(year);
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_fee_charges')
    .select('*')
    .eq('firm_id', firmId)
    .gte('year_month', `${y}-01`)
    .lte('year_month', `${y}-12`)
    .neq('status', 'cancelled')
    .order('year_month', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCharge);
}

async function listChargesForClient(firmId, clientId, { year } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('client_fee_charges')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .neq('status', 'cancelled')
    .order('year_month', { ascending: false });
  if (year) {
    const y = String(year);
    q = q.gte('year_month', `${y}-01`).lte('year_month', `${y}-12`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapCharge);
}

async function findChargeById(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_fee_charges')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapCharge(data);
}

async function findOpenCharge(firmId, clientId, yearMonth) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_fee_charges')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('year_month', yearMonth)
    .neq('status', 'cancelled')
    .maybeSingle();
  if (error) throw error;
  return mapCharge(data);
}

async function insertCharge(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('client_fee_charges')
    .insert({
      firm_id: data.firmId,
      client_id: data.clientId,
      year_month: data.yearMonth,
      amount_cents: data.amountCents,
      currency: data.currency || 'EUR',
      status: data.status || 'draft',
      payment_method: data.paymentMethod || null,
      paid_at: data.paidAt || null,
      due_date: data.dueDate || null,
      notes: data.notes || null,
      source: data.source || 'manual',
      created_by: data.createdBy || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapCharge(inserted);
}

async function updateCharge(id, firmId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.amountCents !== undefined) row.amount_cents = patch.amountCents;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod;
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.notes !== undefined) row.notes = patch.notes;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_fee_charges')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return mapCharge(data);
}

module.exports = {
  mapCharge,
  listChargesForYear,
  listChargesForClient,
  findChargeById,
  findOpenCharge,
  insertCharge,
  updateCharge,
};
