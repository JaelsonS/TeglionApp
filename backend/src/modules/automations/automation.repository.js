const { getSupabaseAdmin } = require('../../db/supabase/client');

function mapRule(row) {
  return {
    id: row.id,
    firmId: row.firm_id,
    name: row.name,
    triggerType: row.trigger_type,
    actionType: row.action_type,
    config: row.config || {},
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

async function listRules(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('task_automation_rules')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRule);
}

async function upsertRule(firmId, payload) {
  const sb = getSupabaseAdmin();
  const row = {
    firm_id: firmId,
    name: payload.name,
    trigger_type: payload.triggerType,
    action_type: payload.actionType,
    config: payload.config || {},
    enabled: payload.enabled !== false,
  };
  if (payload.id) {
    const { data, error } = await sb
      .from('task_automation_rules')
      .update(row)
      .eq('id', payload.id)
      .eq('firm_id', firmId)
      .select()
      .single();
    if (error) throw error;
    return mapRule(data);
  }
  const { data, error } = await sb.from('task_automation_rules').insert(row).select().single();
  if (error) throw error;
  return mapRule(data);
}

module.exports = { listRules, upsertRule, mapRule };
