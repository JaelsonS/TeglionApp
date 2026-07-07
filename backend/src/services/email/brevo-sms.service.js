/**
 * SMS transacional via Brevo API REST.
 * Requer SMS_ENABLED=true e número remetente validado na Brevo.
 */
const axios = require('axios');
const { env } = require('../../config/env');

const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';

function normalizePhone(phone) {
  const raw = String(phone || '').replace(/\s/g, '');
  if (!raw) return null;
  if (raw.startsWith('+')) return raw;
  if (raw.startsWith('00')) return `+${raw.slice(2)}`;
  // Portugal: 9 dígitos móvel ou 2xx fixo
  if (/^9\d{8}$/.test(raw)) return `+351${raw}`;
  if (/^2\d{8}$/.test(raw)) return `+351${raw}`;
  return raw.startsWith('351') ? `+${raw}` : raw;
}

async function sendSms({ to, message }) {
  if (!env.SMS_ENABLED || !env.BREVO_API_KEY) {
    console.log('[TegLion][sms] skip (desativado):', to);
    return { skipped: true };
  }
  const recipient = normalizePhone(to);
  if (!recipient || !message) return { skipped: true };

  const sender = env.BREVO_SMS_SENDER || 'TegLion';
  await axios.post(
    BREVO_SMS_URL,
    {
      sender,
      recipient,
      content: String(message).slice(0, 160),
      type: 'transactional',
    },
    {
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    },
  );

  return { sent: true };
}

module.exports = { sendSms, normalizePhone };
