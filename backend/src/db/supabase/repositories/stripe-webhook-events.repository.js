const { getSupabaseAdmin, isSupabaseConfigured } = require('../client');
const { logger } = require('../../../utils/logger');

async function claimWebhookEvent(eventId, eventType) {
  if (!eventId || !isSupabaseConfigured()) return true;

  const sb = getSupabaseAdmin();
  const { error } = await sb.from('stripe_webhook_events').insert({
    event_id: eventId,
    event_type: eventType || 'unknown',
  });

  if (!error) return true;

  if (error.code === '23505') {
    logger.info('[billing] webhook duplicate skipped', { eventId, eventType });
    return false;
  }

  logger.warn('[billing] webhook idempotency insert failed', { eventId, message: error.message });
  return true;
}

module.exports = { claimWebhookEvent };
