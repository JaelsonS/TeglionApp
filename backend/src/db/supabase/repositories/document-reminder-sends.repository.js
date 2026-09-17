const { getSupabaseAdmin } = require('../client');

/**
 * Reserva envio de lembrete de validade (document_id + channel + dia civil).
 * @returns {Promise<boolean>}
 */
async function tryClaimReminderSend({ firmId, documentId, channel, dayBucket }) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('document_reminder_sends').insert({
    firm_id: firmId,
    document_id: documentId,
    channel,
    day_bucket: dayBucket,
  });
  if (!error) return true;
  if (error.code === '23505') return false;
  throw error;
}

module.exports = { tryClaimReminderSend };
