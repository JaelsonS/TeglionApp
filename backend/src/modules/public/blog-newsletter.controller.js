const blogNewsletterRepo = require('../../db/supabase/repositories/blog-newsletter.repository');
const { sendEmail } = require('../../services/email/brevo-email.service');
const { env } = require('../../config/env');
const { logger } = require('../../utils/logger');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.subscribe = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const consent = req.body?.consent === true || req.body?.consent === 'true' || req.body?.consent === 1;
    const source = String(req.body?.source || 'blog')
      .replace(/[^a-zA-Z0-9._:-]+/g, '-')
      .slice(0, 80);
    // Audience estável — evita 400 por valores inesperados no cliente
    const audience = 'blog';
    const locale = String(req.body?.locale || 'pt-PT').slice(0, 12);

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido', code: 'INVALID_EMAIL' });
    }
    if (!consent) {
      return res.status(400).json({ error: 'Consentimento obrigatório', code: 'CONSENT_REQUIRED' });
    }

    const row = await blogNewsletterRepo.upsertSubscriber({ email, audience, source, locale });

    const notifyTo = env.BLOG_NEWSLETTER_NOTIFY_EMAIL || env.FROM_EMAIL;
    if (notifyTo) {
      void sendEmail({
        to: notifyTo,
        subject: `[TegLion Blog] Nova subscrição: ${email}`,
        text: `Nova subscrição newsletter (${source})\nE-mail: ${email}\nID: ${row?.id}`,
        html: `<p>Nova subscrição no blog (<strong>${source}</strong>).</p><p>E-mail: ${email}</p>`,
      }).catch((err) => logger.warn('[blog-newsletter] notify failed', err?.message));
    }

    return res.status(201).json({ ok: true, subscribed: true });
  } catch (err) {
    logger.warn('[blog-newsletter] subscribe failed', err?.message || err);
    return next(err);
  }
};
