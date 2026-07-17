/**
 * Layout HTML table-based para clientes de e-mail (Gmail, Outlook, Apple Mail).
 * Tom transacional — evita padrões de marketing que empurram para Separadores/Promoções.
 */

const { env } = require('../../config/env');

const APP_URL = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const BRAND = 'TegLion';
const BRAND_COLOR = '#0f2942';
const ACCENT = '#1d4ed8';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {{
 *   preheader?: string,
 *   title: string,
 *   greeting?: string,
 *   bodyHtml: string,
 *   ctaLabel: string,
 *   ctaUrl: string,
 *   footerNote?: string,
 * }} opts
 */
function renderTransactionalEmail(opts) {
  const preheader = escapeHtml(opts.preheader || opts.title);
  const title = escapeHtml(opts.title);
  const greeting = opts.greeting ? escapeHtml(opts.greeting) : null;
  const ctaLabel = escapeHtml(opts.ctaLabel);
  const ctaUrl = String(opts.ctaUrl || '').trim();
  const footerNote = opts.footerNote ? escapeHtml(opts.footerNote) : null;
  const safeBody = opts.bodyHtml || '';

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:${BRAND_COLOR};padding:20px 28px;">
              <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.02em;color:#ffffff;">${BRAND}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;font-weight:700;color:#0f172a;">${title}</h1>
              ${greeting ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;">${greeting}</p>` : ''}
              <div style="font-size:15px;line-height:1.55;color:#334155;">${safeBody}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;" align="left">
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 28px;background:${ACCENT};color:#ffffff !important;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">
                ${ctaLabel}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#64748b;">Se o botão não abrir, copie e cole este link no navegador:</p>
              <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${escapeHtml(ctaUrl)}" style="color:${ACCENT};text-decoration:underline;">${escapeHtml(ctaUrl)}</a>
              </p>
              ${footerNote ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">${footerNote}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;">
                Esta é uma mensagem transacional da ${BRAND} relacionada com a sua conta.
                <a href="${escapeHtml(APP_URL)}/privacidade" style="color:#64748b;">Privacidade</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  escapeHtml,
  renderTransactionalEmail,
  APP_URL,
  BRAND,
};
