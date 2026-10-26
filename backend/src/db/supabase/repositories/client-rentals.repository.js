const { getSupabaseAdmin } = require('../client');

function mapProperty(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id || null,
    label: row.label,
    addressLine: row.address_line || null,
    postalCode: row.postal_code || null,
    locality: row.locality || null,
    artigoMatricial: row.artigo_matricial || null,
    notes: row.notes || null,
    costCategory: row.cost_category || 'outro',
    supplierName: row.supplier_name || null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLease(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    propertyId: row.property_id,
    tenantDisplayName: row.tenant_display_name,
    tenantNif: row.tenant_nif || null,
    tenantEmail: row.tenant_email || null,
    tenantPhone: row.tenant_phone || null,
    startDate: row.start_date,
    endDate: row.end_date || null,
    monthlyRentCents: row.monthly_rent_cents,
    currency: row.currency || 'EUR',
    rentDueDay: row.rent_due_day || 1,
    leaseType: row.lease_type || 'habitacao',
    status: row.status,
    notes: row.notes || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReceipt(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    leaseId: row.lease_id,
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

async function listProperties(firmId, { clientId, status = 'active', limit = 200 } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('client_properties')
    .select('*')
    .eq('firm_id', firmId)
    .order('label', { ascending: true })
    .limit(Math.min(Number(limit) || 200, 500));
  if (clientId) q = q.eq('client_id', clientId);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapProperty);
}

async function findPropertyById(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_properties')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapProperty(data);
}

async function insertProperty(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('client_properties')
    .insert({
      firm_id: data.firmId,
      client_id: data.clientId || null,
      label: data.label,
      address_line: data.addressLine || null,
      postal_code: data.postalCode || null,
      locality: data.locality || null,
      artigo_matricial: data.artigoMatricial || null,
      notes: data.notes || null,
      cost_category: data.costCategory || 'outro',
      supplier_name: data.supplierName || null,
      status: data.status || 'active',
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapProperty(inserted);
}

async function updateProperty(id, firmId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.addressLine !== undefined) row.address_line = patch.addressLine;
  if (patch.postalCode !== undefined) row.postal_code = patch.postalCode;
  if (patch.locality !== undefined) row.locality = patch.locality;
  if (patch.artigoMatricial !== undefined) row.artigo_matricial = patch.artigoMatricial;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.costCategory !== undefined) row.cost_category = patch.costCategory;
  if (patch.supplierName !== undefined) row.supplier_name = patch.supplierName;
  if (patch.status !== undefined) row.status = patch.status;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_properties')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return mapProperty(data);
}

async function listLeasesForFirm(firmId, { propertyId, status } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('property_leases')
    .select('*')
    .eq('firm_id', firmId)
    .order('start_date', { ascending: false });
  if (propertyId) q = q.eq('property_id', propertyId);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapLease);
}

async function listActiveLeases(firmId) {
  return listLeasesForFirm(firmId, { status: 'active' });
}

async function findLeaseById(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('property_leases')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapLease(data);
}

async function insertLease(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('property_leases')
    .insert({
      firm_id: data.firmId,
      property_id: data.propertyId,
      tenant_display_name: data.tenantDisplayName,
      tenant_nif: data.tenantNif || null,
      tenant_email: data.tenantEmail || null,
      tenant_phone: data.tenantPhone || null,
      start_date: data.startDate,
      end_date: data.endDate || null,
      monthly_rent_cents: data.monthlyRentCents,
      currency: data.currency || 'EUR',
      rent_due_day: data.rentDueDay || 1,
      lease_type: data.leaseType || 'habitacao',
      status: data.status || 'active',
      notes: data.notes || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapLease(inserted);
}

async function updateLease(id, firmId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.tenantDisplayName !== undefined) row.tenant_display_name = patch.tenantDisplayName;
  if (patch.tenantNif !== undefined) row.tenant_nif = patch.tenantNif;
  if (patch.tenantEmail !== undefined) row.tenant_email = patch.tenantEmail;
  if (patch.tenantPhone !== undefined) row.tenant_phone = patch.tenantPhone;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.endDate !== undefined) row.end_date = patch.endDate;
  if (patch.monthlyRentCents !== undefined) row.monthly_rent_cents = patch.monthlyRentCents;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.rentDueDay !== undefined) row.rent_due_day = patch.rentDueDay;
  if (patch.leaseType !== undefined) row.lease_type = patch.leaseType;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('property_leases')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return mapLease(data);
}

async function listReceiptsForYear(firmId, year) {
  const y = String(year);
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('lease_rent_receipts')
    .select('*')
    .eq('firm_id', firmId)
    .gte('year_month', `${y}-01`)
    .lte('year_month', `${y}-12`)
    .neq('status', 'cancelled')
    .order('year_month', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapReceipt);
}

async function findReceiptById(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('lease_rent_receipts')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapReceipt(data);
}

async function findOpenReceipt(firmId, leaseId, yearMonth) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('lease_rent_receipts')
    .select('*')
    .eq('firm_id', firmId)
    .eq('lease_id', leaseId)
    .eq('year_month', yearMonth)
    .neq('status', 'cancelled')
    .maybeSingle();
  if (error) throw error;
  return mapReceipt(data);
}

async function insertReceipt(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('lease_rent_receipts')
    .insert({
      firm_id: data.firmId,
      lease_id: data.leaseId,
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
  return mapReceipt(inserted);
}

async function updateReceipt(id, firmId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.amountCents !== undefined) row.amount_cents = patch.amountCents;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.paymentMethod !== undefined) row.payment_method = patch.paymentMethod;
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.notes !== undefined) row.notes = patch.notes;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('lease_rent_receipts')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return mapReceipt(data);
}

module.exports = {
  mapProperty,
  mapLease,
  mapReceipt,
  listProperties,
  findPropertyById,
  insertProperty,
  updateProperty,
  listLeasesForFirm,
  listActiveLeases,
  findLeaseById,
  insertLease,
  updateLease,
  listReceiptsForYear,
  findReceiptById,
  findOpenReceipt,
  insertReceipt,
  updateReceipt,
};
