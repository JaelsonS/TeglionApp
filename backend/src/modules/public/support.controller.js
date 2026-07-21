const { sendEmail } = require('../../services/email/brevo-email.service');
const { env } = require('../../config/env');
const { BRAND } = require('../../config/brand');
const { logger } = require('../../utils/logger');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

exports.submit = async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 200);
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim().slice(0, 40);
    const subject = String(req.body?.subject || '').trim().slice(0, 200);
    const message = String(req.body?.message || '').trim().slice(0, 5000);

    if (!name) return res.status(400).json({ code: 'INVALID_NAME', error: 'Indique o seu nome' });
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ code: 'INVALID_EMAIL', error: 'E-mail inválido' });
    }
    if (!message || message.length < 10) {
      return res.status(400).json({ code: 'INVALID_MESSAGE', error: 'Descreva o problema com mais detalhe' });
    }

    const notifyTo = env.SUPPORT_NOTIFY_EMAIL || BRAND.emails.support;
    const finalSubject = subject ? `[Suporte Teglion] ${subject}` : `[Suporte Teglion] Novo pedido de ${name}`;

    let delivered = true;
    if (notifyTo) {
      try {
        const result = await sendEmail({
          to: notifyTo,
          subject: finalSubject,
          replyTo: { email, name },
          text: [
            `Nome: ${name}`,
            `E-mail: ${email}`,
            phone ? `Telefone: ${phone}` : null,
            subject ? `Assunto: ${subject}` : null,
            '',
            message,
          ]
            .filter(Boolean)
            .join('\n'),
          html: `
            <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
            ${phone ? `<p><strong>Telefone:</strong> ${escapeHtml(phone)}</p>` : ''}
            ${subject ? `<p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>` : ''}
            <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
          `,
          tags: ['support-request'],
        });
        if (result?.skipped) {
          delivered = false;
          logger.warn('[support] envio de email ignorado (Brevo não configurado)');
        }
      } catch (err) {
        delivered = false;
        logger.warn('[support] envio de email falhou', err?.message);
      }
    } else {
      delivered = false;
    }

    if (!delivered) {
      return res.status(502).json({
        code: 'SUPPORT_EMAIL_FAILED',
        error: 'Não foi possível enviar a mensagem. Contacte-nos directamente por telefone ou e-mail.',
      });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    return next(err);
  }
};
