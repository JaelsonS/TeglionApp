/**
 * Histórico e envio de SMS via Brevo.
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const { sendSms } = require('../email/brevo-sms.service');
const { buildMessage } = require('./sms-templates.service');
const { env } = require('../../config/env');

function ensureClient() {
  if (!isSupabaseConfigured()) return null;
  return getSupabaseAdmin();
}

const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

async function wasRecentlySent({
  sb,
  firmId,
  clientId,
  templateKey,
  entityType,
  entityId,
  windowMs = DEDUPE_WINDOW_MS,
}) {
  if (!sb) return false;
  const since = new Date(Date.now() - windowMs).toISOString();
  let q = sb
    .from('sms_logs')
    .select('id')
    .eq('firm_id', firmId)
    .eq('template_key', templateKey)
    .gte('created_at', since)
    .in('status', ['PENDING', 'DELIVERED'])
    .limit(1);
  if (clientId) q = q.eq('client_id', clientId);
  if (entityType) q = q.eq('entity_type', entityType);
  if (entityId) q = q.eq('entity_id', entityId);
  const { data, error } = await q;
  if (error) return false;
  return (data || []).length > 0;
}

async function sendTemplatedSms({
  firmId,
  clientId,
  phone,
  templateKey,
  templateVars = {},
  entityType = null,
  entityId = null,
  skipDedupe = false,
  dedupeWindowMs = DEDUPE_WINDOW_MS,
}) {
  const message = buildMessage(templateKey, templateVars);
  if (!message || !phone) return { skipped: true, reason: 'no_message_or_phone' };

  if (!env.SMS_ENABLED || !env.BREVO_API_KEY) {
    return { skipped: true, reason: 'sms_disabled' };
  }

  const sb = ensureClient();
  let logId = null;

  if (sb && !skipDedupe) {
    const duplicate = await wasRecentlySent({
      sb,
      firmId,
      clientId,
      templateKey,
      entityType,
      entityId,
      windowMs: dedupeWindowMs,
    });
    if (duplicate) {
      return { skipped: true, reason: 'duplicate_within_window' };
    }
  }

  if (sb) {
    const { data: log } = await sb
      .from('sms_logs')
      .insert({
        firm_id: firmId,
        client_id: clientId,
        phone,
        template_key: templateKey,
        message,
        status: 'PENDING',
        entity_type: entityType,
        entity_id: entityId,
      })
      .select('id')
      .single();
    logId = log?.id;
  }

  try {
    const result = await sendSms({ to: phone, message });
    if (sb && logId) {
      await sb
        .from('sms_logs')
        .update({
          status: 'DELIVERED',
          brevo_message_id: result?.messageId || null,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', logId);
    }
    return { ok: true, logId, result };
  } catch (err) {
    if (sb && logId) {
      await sb
        .from('sms_logs')
        .update({ status: 'FAILED', error_message: err.message || 'send_failed' })
        .eq('id', logId);
    }
    return { ok: false, error: err.message };
  }
}

async function listSmsLogs({ firmId, clientId, limit = 50 }) {
  const sb = ensureClient();
  if (!sb) return [];
  let q = sb.from('sms_logs').select('*').eq('firm_id', firmId).order('created_at', { ascending: false }).limit(limit);
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    phone: r.phone,
    templateKey: r.template_key,
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at,
    clientId: r.client_id,
  }));
}

module.exports = {
  sendTemplatedSms,
  listSmsLogs,
};
