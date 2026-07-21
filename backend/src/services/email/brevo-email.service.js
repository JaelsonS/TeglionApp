/**
 * Envio de email via Brevo API REST.
 */
const axios = require('axios');
const { env } = require('../../config/env');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const APP_URL = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/**
 * @param {{
 *   to: string,
 *   subject: string,
 *   html?: string,
 *   text?: string,
 *   tags?: string[],
 *   replyTo?: { email: string, name?: string },
 * }} params
 */
async function sendEmail({ to, subject, html, text, tags, replyTo }) {
  if (!env.EMAIL_ENABLED || !env.BREVO_API_KEY) {
    console.log('[Teglion][email] skip (desativado):', subject, '→', to);
    return { skipped: true };
  }
  if (!to || !subject) return { skipped: true };

  const categoryTags = Array.isArray(tags) && tags.length
    ? tags.map((t) => String(t).slice(0, 50))
    : ['transactional'];

  const payload = {
    sender: {
      name: env.FROM_NAME || 'Teglion',
      email: env.FROM_EMAIL || 'noreply@teglion.com',
    },
    to: [{ email: String(to).trim() }],
    subject: String(subject),
    htmlContent: html || `<p>${text || subject}</p>`,
    textContent: text || subject,
    tags: categoryTags,
    headers: {
      // Ajuda a classificar como conta/transaccional (não newsletter).
      'X-Mailin-Tag': categoryTags[0],
      'X-Priority': '1',
      Importance: 'high',
      'List-Unsubscribe': `<${APP_URL}/privacidade>`,
    },
  };

  if (replyTo?.email) {
    payload.replyTo = {
      email: String(replyTo.email).trim(),
      ...(replyTo.name ? { name: String(replyTo.name) } : {}),
    };
  } else if (env.FROM_EMAIL) {
    payload.replyTo = {
      email: env.FROM_EMAIL,
      name: env.FROM_NAME || 'Teglion',
    };
  }

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
