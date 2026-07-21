const webpush = require('web-push');
const { getSupabaseAdmin } = require('../../db/supabase/client');
const { env } = require('../../config/env');
const { logger } = require('../../utils/logger');

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT || 'mailto:suporte@teglion.com',
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    vapidConfigured = true;
    return true;
  }
  return false;
}

async function saveSubscription({ firmId, userRole, userId, subscription, userAgent }) {
  const sb = getSupabaseAdmin();
  const keys = subscription?.keys || {};
  const { error } = await sb.from('push_subscriptions').upsert(
    {
      firm_id: firmId,
      user_role: userRole,
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent || null,
    },
    { onConflict: 'endpoint' },
  );
  if (error) throw error;
  return { ok: true };
}

function getVapidPublicKey() {
  return env.VAPID_PUBLIC_KEY || null;
}

async function sendPushToUser({ firmId, userId, userRole, title, body, url }) {
  if (!ensureVapid()) return { skipped: true, reason: 'VAPID not configured' };

  const sb = getSupabaseAdmin();
  let query = sb.from('push_subscriptions').select('endpoint, p256dh, auth');
  if (firmId) query = query.eq('firm_id', firmId);
  if (userId) query = query.eq('user_id', userId);
  if (userRole) query = query.eq('user_role', userRole);

  const { data: subs, error } = await query;
  if (error) throw error;
  if (!subs?.length) return { sent: 0 };

  const payload = JSON.stringify({ title: title || 'Teglion', body: body || '', url: url || '/' });
  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
      sent += 1;
    } catch (err) {
      const statusCode = Number(err?.statusCode);
      if (statusCode === 410 || statusCode === 404) {
        const { error: delErr } = await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        if (delErr) {
          logger.safe.warn('[push] failed to remove stale subscription', {
            endpoint: sub.endpoint?.slice(0, 40),
            message: delErr.message,
          });
        } else {
          logger.info('[push] removed stale subscription', { statusCode });
        }
      } else {
        logger.safe.warn('[push] send failed', {
          endpoint: sub.endpoint?.slice(0, 40),
          statusCode: statusCode || undefined,
          message: err?.message,
        });
      }
    }
  }

  return { sent };
}

module.exports = { saveSubscription, getVapidPublicKey, sendPushToUser };
