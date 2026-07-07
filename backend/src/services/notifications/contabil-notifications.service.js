/**
 * Notificações TegLion — email (Brevo) + SMS (Brevo transactional).
 */
const { sendEmail } = require('../email/brevo-email.service');
const { sendSms } = require('../email/brevo-sms.service');
const { env } = require('../../config/env');

const APP_URL = (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

function portalUrl() {
  return `${APP_URL}/auth/client/login`;
}

function inviteUrl(token) {
  return `${APP_URL}/auth/client/convite/${token}`;
}

function teamInviteUrl(token) {
  return `${APP_URL}/auth/firm/team-invite/${token}`;
}

function staffEmailConfirmUrl(token) {
  return `${APP_URL}/auth/firm/confirm-email/${token}`;
}

async function notifyClientInvite({ clientEmail, clientName, firmName, inviteUrl: url, expiresAt }) {
  if (!clientEmail) return { skipped: true, reason: 'no_email' };
  const link = url || portalUrl();
  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString('pt-PT') : '14 dias';
  return sendEmail({
    to: clientEmail,
    subject: `${firmName || 'O seu escritório'} convidou-o para o portal TegLion`,
    html: `
      <p>Olá${clientName ? ` ${clientName}` : ''},</p>
      <p>O escritório <strong>${firmName || 'de contabilidade'}</strong> convidou-o a aceder ao portal TegLion — onde pode enviar documentos, ver obrigações e falar com a equipa.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#0f2942;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Aceitar convite</a></p>
      <p style="font-size:13px;color:#64748b">Link válido até ${expiry}. Se não esperava este e-mail, ignore-o.</p>
      <p>TegLion</p>
    `,
    text: `Convite TegLion: ${link} (válido até ${expiry})`,
  });
}

async function notifyClientNewTask({ clientEmail, clientName, taskTitle, firmName, dueDate }) {
  if (!clientEmail) return { skipped: true };
  const name = clientName || 'Cliente';
  const firm = firmName || 'o seu escritório';
  const due = dueDate ? `<p><strong>Prazo:</strong> ${dueDate}</p>` : '';
  return sendEmail({
    to: clientEmail,
    subject: `${firm} — nova tarefa no portal`,
    html: `
      <p>Olá ${name},</p>
      <p>O escritório <strong>${firm}</strong> pediu-lhe documentos ou uma ação no portal TegLion:</p>
      <p><strong>${taskTitle}</strong></p>
      ${due}
      <p><a href="${portalUrl()}">Entrar no portal</a> — demora menos de 2 minutos.</p>
      <p>TegLion</p>
    `,
    text: `Nova tarefa: ${taskTitle}. Entre em ${portalUrl()}`,
  });
}

async function notifyClientObligationReminder({ clientEmail, clientName, obligationTitle, firmName, dueDate, body }) {
  if (!clientEmail) return { skipped: true };
  return sendEmail({
    to: clientEmail,
    subject: `${firmName || 'Escritório'} — ${obligationTitle || 'lembrete fiscal'}`,
    html: `
      <p>Olá ${clientName || 'Cliente'},</p>
      <p>${body || `A obrigação <strong>${obligationTitle}</strong> tem prazo ${dueDate || 'em breve'}.`}</p>
      <p><a href="${portalUrl()}">Abrir portal TegLion</a></p>
    `,
    text: body || `Lembrete: ${obligationTitle}. Portal: ${portalUrl()}`,
  });
}

async function notifyFirmDocumentReceived({ staffEmail, clientName, documentTitle, firmName }) {
  if (!staffEmail) return { skipped: true };
  return sendEmail({
    to: staffEmail,
    subject: `Documento recebido — ${clientName || 'Cliente'}`,
    html: `
      <p>Novo documento no TegLion:</p>
      <p><strong>${documentTitle}</strong> de ${clientName || 'cliente'} (${firmName || 'escritório'}).</p>
      <p><a href="${APP_URL}/app/firm/documents">Validar no painel</a></p>
    `,
    text: `Documento recebido: ${documentTitle}`,
  });
}

async function notifyClientSms({ phone, message }) {
  if (!phone || !message) return { skipped: true };
  return sendSms({ to: phone, message });
}

async function notifyPasswordReset({ email, resetUrl, userType }) {
  if (!email || !resetUrl) return { skipped: true };
  const isClient = userType === 'client';
  const subject = isClient
    ? 'TegLion — redefinir palavra-passe do portal'
    : 'TegLion — redefinir palavra-passe do escritório';
  return sendEmail({
    to: email,
    subject,
    html: `
      <p>Recebemos um pedido para redefinir a sua palavra-passe no TegLion.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0f2942;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Redefinir palavra-passe</a></p>
      <p style="font-size:13px;color:#64748b">O link expira em 15 minutos. Se não fez este pedido, ignore este e-mail.</p>
      <p>TegLion</p>
    `,
    text: `Redefinir palavra-passe TegLion: ${resetUrl} (válido 15 minutos)`,
  });
}

async function notifyFirmConsultationBooked({ staffEmail, firmName, clientName, serviceName, when }) {
  if (!staffEmail) return { skipped: true };
  return sendEmail({
    to: staffEmail,
    subject: `Nova marcação — ${clientName || 'Cliente'}`,
    html: `
      <p>O cliente <strong>${clientName || '—'}</strong> marcou <strong>${serviceName || 'consultoria'}</strong> no portal TegLion.</p>
      <p><strong>Data/hora:</strong> ${when || '—'}</p>
      <p><a href="${APP_URL}/app/firm/agenda">Ver agenda</a></p>
      <p style="font-size:13px;color:#64748b">${firmName || ''}</p>
    `,
    text: `Marcação: ${serviceName} com ${clientName} em ${when}. Agenda: ${APP_URL}/app/firm/agenda`,
  });
}

async function notifyFirmStaffWelcome({ staffEmail, staffName, firmName }) {
  if (!staffEmail) return { skipped: true };
  const appName = firmName || 'TegLion';
  const loginLink = `${APP_URL}/auth/firm/login`;
  return sendEmail({
    to: staffEmail,
    subject: `${appName} — acesso criado à sua conta`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:620px">
        <p>Olá${staffName ? ` ${staffName}` : ''},</p>
        <p>Foi criada uma conta de colaborador para si no <strong>${appName}</strong>.</p>
        <p style="margin:24px 0 16px">
          <a href="${loginLink}" style="display:inline-block;padding:12px 24px;background:#0f2942;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">
            Entrar no TegLion
          </a>
        </p>
        <p style="font-size:13px;color:#475569;margin:0 0 6px">Se o botão não abrir, copie e cole este link no navegador:</p>
        <p style="margin:0 0 16px">
          <a href="${loginLink}" style="color:#0f2942;word-break:break-all">${loginLink}</a>
        </p>
        <p style="font-size:13px;color:#64748b">Se ainda não recebeu a sua palavra-passe inicial, contacte o dono/administrador do escritório.</p>
        <p style="margin-top:20px">TegLion</p>
      </div>
    `,
    text: [
      `Olá${staffName ? ` ${staffName}` : ''},`,
      '',
      `Foi criada uma conta de colaborador para si no ${appName}.`,
      '',
      'Entrar no TegLion:',
      loginLink,
      '',
      'Se ainda não recebeu a sua palavra-passe inicial, contacte o dono/administrador do escritório.',
      '',
      'TegLion',
    ].join('\n'),
  });
}

async function notifyFirmMemberInvite({ staffEmail, staffName, firmName, inviteToken, expiresAt }) {
  if (!staffEmail) return { skipped: true, reason: 'no_email' };
  const link = teamInviteUrl(inviteToken);
  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString('pt-PT') : '14 dias';
  return sendEmail({
    to: staffEmail,
    subject: `${firmName || 'TegLion'} — convite para equipa`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;max-width:620px">
        <p>Olá${staffName ? ` ${staffName}` : ''},</p>
        <p>Recebeu um convite para entrar na equipa do escritório <strong>${firmName || 'TegLion'}</strong>.</p>
        <p style="margin:24px 0 16px">
          <a href="${link}" style="display:inline-block;padding:12px 24px;background:#0f2942;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Aceitar convite</a>
        </p>
        <p style="font-size:13px;color:#475569;margin:0 0 6px">Se o botão não abrir, copie e cole este link no navegador:</p>
        <p style="margin:0 0 16px"><a href="${link}" style="color:#0f2942;word-break:break-all">${link}</a></p>
        <p style="font-size:13px;color:#64748b">Convite válido até ${expiry}. Se não esperava este e-mail, ignore.</p>
        <p style="margin-top:20px">TegLion</p>
      </div>
    `,
    text: [
      `Olá${staffName ? ` ${staffName}` : ''},`,
      '',
      `Recebeu um convite para entrar na equipa do escritório ${firmName || 'TegLion'}.`,
      '',
      'Aceitar convite:',
      link,
      '',
      `Convite válido até ${expiry}. Se não esperava este e-mail, ignore.`,
      '',
      'TegLion',
    ].join('\n'),
  });
}

async function notifyFirmStaffEmailConfirmation({ staffEmail, staffName, firmName, token }) {
  if (!staffEmail || !token) return { skipped: true };
  const link = staffEmailConfirmUrl(token);
  return sendEmail({
    to: staffEmail,
    subject: `${firmName || 'TegLion'} — confirme o seu e-mail`,
    html: `
      <p>Olá${staffName ? ` ${staffName}` : ''},</p>
      <p>Para concluir o seu acesso à equipa, confirme o seu e-mail.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#0f2942;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Confirmar e-mail</a></p>
      <p style="font-size:13px;color:#64748b">Se não reconhece este pedido, ignore esta mensagem.</p>
      <p>TegLion</p>
    `,
    text: `Confirme o seu e-mail para ativar o acesso: ${link}`,
  });
}

module.exports = {
  notifyClientInvite,
  notifyClientNewTask,
  notifyClientObligationReminder,
  notifyFirmDocumentReceived,
  notifyFirmConsultationBooked,
  notifyClientSms,
  notifyPasswordReset,
  notifyFirmStaffWelcome,
  notifyFirmMemberInvite,
  notifyFirmStaffEmailConfirmation,
  inviteUrl,
  teamInviteUrl,
  staffEmailConfirmUrl,
};
