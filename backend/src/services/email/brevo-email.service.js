/**
 * Envio de email via Brevo API REST.
 * Se BREVO_API_KEY ausente, operações são no-op (log only).
 */
const axios = require('axios');
const { env } = require('../../config/env');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail({ to, subject, html, text }) {
  if (!env.EMAIL_ENABLED || !env.BREVO_API_KEY) {
    console.log('[TegLion][email] skip (desativado):', subject, '→', to);
    return { skipped: true };
  }
  if (!to || !subject) return { skipped: true };

  const payload = {
    sender: {
      name: env.FROM_NAME || 'TegLion',
      email: env.FROM_EMAIL || 'noreply@teglion.com',
    },
    to: [{ email: String(to).trim() }],
    subject: String(subject),
    htmlContent: html || `<p>${text || subject}</p>`,
    textContent: text || subject,
  };

  await axios.post(BREVO_URL, payload, {
    headers: {
      'api-key': env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  return { sent: true };
}

module.exports = { sendEmail };
