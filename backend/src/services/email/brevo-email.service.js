/**
 * Envio de email via Brevo API REST.
 */
const axios = require('axios');
const { env } = require('../../config/env');
const { AppError } = require('../../middlewares/error.middleware');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const APP_URL = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Remove caracteres de controlo (CR/LF) de campos que acabam num cabeçalho de e-mail. */
function stripControlChars(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function formatBrevoError(err) {
  const data = err?.response?.data;
  const raw =
    (typeof data?.message === 'string' && data.message) ||
    (Array.isArray(data?.message) && data.message.join('; ')) ||
    (typeof data === 'string' && data) ||
    err?.message ||
    'Falha no envio de e-mail';
  return String(raw).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]');
}

/**
 * @param {{
 *   to: string,
 *   subject: string,
 *   html?: string,
 *   text?: string,
 *   tags?: string[],
 *   replyTo?: { email: string, name?: string },
 * }} params
 * @returns {Promise<{ sent: true, messageId?: string } | { skipped: true, reason: string }>}
 */
async function sendEmail({ to, subject, html, text, tags, replyTo }) {
  if (!env.EMAIL_ENABLED || !env.BREVO_API_KEY) {
    console.log('[Teglion][email] skip (desativado):', subject, '→', to);
    return { skipped: true, reason: 'email_disabled' };
  }
  if (!to || !subject) return { skipped: true, reason: 'missing_to_or_subject' };
  if (!env.FROM_EMAIL) {
    console.warn('[Teglion][email] FROM_EMAIL ausente');
    return { skipped: true, reason: 'missing_from_email' };
  }

  const categoryTags = Array.isArray(tags) && tags.length
    ? tags.map((t) => String(t).slice(0, 50))
    : ['transactional'];

  const payload = {
    sender: {
      name: env.FROM_NAME || 'Teglion',
      email: env.FROM_EMAIL,
    },
    to: [{ email: String(to).trim() }],
    subject: stripControlChars(subject),
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
      ...(replyTo.name ? { name: stripControlChars(replyTo.name) } : {}),
    };
  } else {
    payload.replyTo = {
      email: env.FROM_EMAIL,
      name: env.FROM_NAME || 'Teglion',
    };
  }

  try {
    const res = await axios.post(BREVO_URL, payload, {
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    const messageId = res?.data?.messageId || null;
    console.log('[Teglion][email] enviado:', subject, '→', to, messageId ? `(id ${messageId})` : '');
    return { sent: true, messageId };
  } catch (err) {
    const status = err?.response?.status;
    const message = formatBrevoError(err);
    console.error('[Teglion][email] falha Brevo:', status, message);
    if (status === 401 || status === 403) {
      throw new AppError(
        'A chave Brevo foi recusada. Verifique BREVO_API_KEY no servidor.',
        502,
        { code: 'EMAIL_PROVIDER_AUTH' },
      );
    }
    if (status === 400) {
      throw new AppError(
        `Brevo rejeitou o e-mail: ${message}. Confirme que o remetente (FROM_EMAIL) está verificado em Senders na Brevo.`,
        502,
        { code: 'EMAIL_PROVIDER_REJECTED' },
      );
    }
    throw new AppError(`Falha ao enviar e-mail via Brevo: ${message}`, 502, {
      code: 'EMAIL_PROVIDER_ERROR',
    });
  }
}

module.exports = { sendEmail, stripControlChars };
