const { getSupabaseAdmin } = require('../client');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    obligationId: row.obligation_id,
    taskId: row.task_id,
    month: row.month,
    excluded: row.excluded === true,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function ensureClient() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('[Teglion] Supabase não configurado.');
  return sb;
}

async function listForFirm({ firmId, clientId, months }) {
  const sb = ensureClient();
  let q = sb
    .from('task_month_exclusions')
    .select('*')
    .eq('firm_id', firmId)
    .eq('excluded', true);
  if (clientId) q = q.eq('client_id', clientId);
  if (months?.length) q = q.in('month', months);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapRow);
}

async function upsertObligationExclusionSafe({ firmId, clientId, obligationId, month, createdBy }) {
  const sb = ensureClient();
  const existing = await sb
    .from('task_month_exclusions')
    .select('id')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('month', month)
    .eq('obligation_id', obligationId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) {
    const { data, error } = await sb
      .from('task_month_exclusions')
      .update({ excluded: true, created_by: createdBy || null })
      .eq('id', existing.data.id)
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  }
  const { data, error } = await sb
    .from('task_month_exclusions')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      obligation_id: obligationId,
      task_id: null,
      month,
      excluded: true,
      created_by: createdBy || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

async function removeObligationExclusion({ firmId, clientId, obligationId, month }) {
  const sb = ensureClient();
  const { error } = await sb
    .from('task_month_exclusions')
    .delete()
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('obligation_id', obligationId)
    .eq('month', month);
  if (error) throw error;
  return { ok: true };
}

function buildExclusionKey({ clientId, month, obligationId, taskId }) {
  if (obligationId) return `ob:${clientId}:${month}:${obligationId}`;
  if (taskId) return `task:${clientId}:${month}:${taskId}`;
  return null;
}

function exclusionKeySet(exclusions) {
  const set = new Set();
  for (const ex of exclusions) {
    const key = buildExclusionKey(ex);
    if (key) set.add(key);
  }
  return set;
}

function isObligationExcluded(exclusions, ob) {
  const month = String(ob.period || '').slice(0, 7);
  if (!month) return false;
  const clientId = ob.clientId || ob.clientId;
  const obId = ob._id || ob.id;
  return exclusions.some(
    (ex) =>
      ex.excluded &&
      ex.obligationId === obId &&
      ex.clientId === clientId &&
      ex.month === month,
  );
}

module.exports = {
  listForFirm,
  upsertObligationExclusionSafe,
  removeObligationExclusion,
  isObligationExcluded,
};
