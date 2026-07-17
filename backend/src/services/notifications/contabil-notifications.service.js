/**
 * Notificações TegLion — email (Brevo) + SMS (Brevo transactional).
 */
const { sendEmail } = require('../email/brevo-email.service');
const { sendSms } = require('../email/brevo-sms.service');
const { env } = require('../../config/env');
const {
  escapeHtml,
  renderTransactionalEmail,
  APP_URL: LAYOUT_APP_URL,
} = require('../email/transactional-email-layout');

const APP_URL = LAYOUT_APP_URL || (env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

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
  const firm = firmName || 'o seu escritório';
  return sendEmail({
    to: clientEmail,
    subject: `Acesso ao portal — ${firm}`,
    tags: ['transactional', 'client-invite'],
    html: renderTransactionalEmail({
      preheader: `Convite para aceder ao portal do escritório ${firm}`,
      title: 'Convite para o portal do cliente',
      greeting: `Olá${clientName ? ` ${clientName}` : ''},`,
      bodyHtml: `<p style="margin:0 0 12px">O escritório <strong>${escapeHtml(firm)}</strong> convidou-o a aceder ao portal TegLion para enviar documentos, ver obrigações e comunicar com a equipa.</p>`,
      ctaLabel: 'Aceitar convite',
      ctaUrl: link,
      footerNote: `Link válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
    }),
    text: [
      `Olá${clientName ? ` ${clientName}` : ''},`,
      '',
      `O escritório ${firm} convidou-o a aceder ao portal TegLion.`,
      '',
      `Aceitar convite: ${link}`,
      '',
      `Válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
      '',
      'TegLion',
    ].join('\n'),
  });
}

async function notifyClientNewTask({ clientEmail, clientName, taskTitle, firmName, dueDate }) {
  if (!clientEmail) return { skipped: true };
  const name = clientName || 'Cliente';
  const firm = firmName || 'o seu escritório';
  const due = dueDate ? `<p style="margin:0 0 12px"><strong>Prazo:</strong> ${escapeHtml(dueDate)}</p>` : '';
  return sendEmail({
    to: clientEmail,
    subject: `${firm} — nova tarefa no portal`,
    tags: ['transactional', 'client-task'],
    html: renderTransactionalEmail({
      preheader: `Nova tarefa: ${taskTitle || 'pedido do escritório'}`,
      title: 'Nova tarefa no portal',
      greeting: `Olá ${escapeHtml(name)},`,
      bodyHtml: `<p style="margin:0 0 12px">O escritório <strong>${escapeHtml(firm)}</strong> pediu-lhe documentos ou uma ação:</p><p style="margin:0 0 12px"><strong>${escapeHtml(taskTitle || '')}</strong></p>${due}`,
      ctaLabel: 'Entrar no portal',
      ctaUrl: portalUrl(),
    }),
    text: `Nova tarefa: ${taskTitle}. Entre em ${portalUrl()}`,
  });
}

async function notifyClientObligationReminder({ clientEmail, clientName, obligationTitle, firmName, dueDate, body }) {
  if (!clientEmail) return { skipped: true };
  return sendEmail({
    to: clientEmail,
    subject: `${firmName || 'Escritório'} — ${obligationTitle || 'lembrete fiscal'}`,
    tags: ['transactional', 'obligation-reminder'],
    html: renderTransactionalEmail({
      preheader: obligationTitle || 'Lembrete fiscal',
      title: obligationTitle || 'Lembrete fiscal',
      greeting: `Olá ${escapeHtml(clientName || 'Cliente')},`,
      bodyHtml: `<p style="margin:0">${
        body ||
        `A obrigação <strong>${escapeHtml(obligationTitle || '')}</strong> tem prazo ${escapeHtml(dueDate || 'em breve')}.`
      }</p>`,
      ctaLabel: 'Abrir portal TegLion',
      ctaUrl: portalUrl(),
    }),
    text: body || `Lembrete: ${obligationTitle}. Portal: ${portalUrl()}`,
  });
}

async function notifyFirmDocumentReceived({ staffEmail, clientName, documentTitle, firmName }) {
  if (!staffEmail) return { skipped: true };
  return sendEmail({
    to: staffEmail,
    subject: `Documento recebido — ${clientName || 'Cliente'}`,
    tags: ['transactional', 'document-received'],
    html: renderTransactionalEmail({
      preheader: `Documento: ${documentTitle || ''}`,
      title: 'Novo documento recebido',
      bodyHtml: `<p style="margin:0"><strong>${escapeHtml(documentTitle || '')}</strong> de ${escapeHtml(clientName || 'cliente')} (${escapeHtml(firmName || 'escritório')}).</p>`,
      ctaLabel: 'Validar no painel',
      ctaUrl: `${APP_URL}/app/firm/documents`,
    }),
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
    ? 'Redefinição de palavra-passe — portal TegLion'
    : 'Redefinição de palavra-passe — escritório TegLion';
  return sendEmail({
    to: email,
    subject,
    tags: ['transactional', 'password-reset'],
    html: renderTransactionalEmail({
      preheader: 'Pedido de redefinição de palavra-passe (válido 15 minutos)',
      title: 'Redefinir palavra-passe',
      bodyHtml: `<p style="margin:0">Recebemos um pedido para redefinir a sua palavra-passe no TegLion. Se não foi você, ignore este e-mail.</p>`,
      ctaLabel: 'Criar nova palavra-passe',
      ctaUrl: resetUrl,
      footerNote: 'O link expira em 15 minutos por segurança.',
    }),
    text: `Redefinir palavra-passe TegLion: ${resetUrl} (válido 15 minutos)`,
  });
}

async function notifyFirmConsultationBooked({ staffEmail, firmName, clientName, serviceName, when }) {
  if (!staffEmail) return { skipped: true };
  return sendEmail({
    to: staffEmail,
    subject: `Nova marcação — ${clientName || 'Cliente'}`,
    tags: ['transactional', 'consultation'],
    html: renderTransactionalEmail({
      preheader: `Marcação: ${serviceName || 'consultoria'}`,
      title: 'Nova marcação no portal',
      bodyHtml: `<p style="margin:0 0 12px">O cliente <strong>${escapeHtml(clientName || '—')}</strong> marcou <strong>${escapeHtml(serviceName || 'consultoria')}</strong>.</p><p style="margin:0"><strong>Data/hora:</strong> ${escapeHtml(when || '—')}</p>`,
      ctaLabel: 'Ver agenda',
      ctaUrl: `${APP_URL}/app/firm/agenda`,
      footerNote: firmName || undefined,
    }),
    text: `Marcação: ${serviceName} com ${clientName} em ${when}. Agenda: ${APP_URL}/app/firm/agenda`,
  });
}

async function notifyFirmStaffWelcome({ staffEmail, staffName, firmName }) {
  if (!staffEmail) return { skipped: true };
  const appName = firmName || 'TegLion';
  const loginLink = `${APP_URL}/auth/firm/login`;
  return sendEmail({
    to: staffEmail,
    subject: `Conta criada — ${appName}`,
    tags: ['transactional', 'staff-welcome'],
    html: renderTransactionalEmail({
      preheader: `Acesso criado à conta no escritório ${appName}`,
      title: 'A sua conta está pronta',
      greeting: `Olá${staffName ? ` ${staffName}` : ''},`,
      bodyHtml: `<p style="margin:0">Foi criada uma conta de colaborador para si no escritório <strong>${escapeHtml(appName)}</strong>.</p>`,
      ctaLabel: 'Entrar no TegLion',
      ctaUrl: loginLink,
      footerNote: 'Se ainda não recebeu a palavra-passe inicial, contacte o administrador do escritório.',
    }),
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
  const firm = firmName || 'TegLion';
  return sendEmail({
    to: staffEmail,
    subject: `Convite para a equipa — ${firm}`,
    tags: ['transactional', 'team-invite'],
    html: renderTransactionalEmail({
      preheader: `Defina a sua palavra-passe para entrar na equipa de ${firm}`,
      title: 'Convite para a equipa',
      greeting: `Olá${staffName ? ` ${staffName}` : ''},`,
      bodyHtml: `<p style="margin:0 0 12px">Foi convidado(a) a juntar-se à equipa do escritório <strong>${escapeHtml(firm)}</strong> no TegLion.</p><p style="margin:0">Clique no botão abaixo para criar a sua palavra-passe e concluir o acesso. Depois confirme o e-mail para activar a conta.</p>`,
      ctaLabel: 'Criar palavra-passe e aceitar',
      ctaUrl: link,
      footerNote: `Convite válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
    }),
    text: [
      `Olá${staffName ? ` ${staffName}` : ''},`,
      '',
      `Foi convidado(a) a juntar-se à equipa do escritório ${firm} no TegLion.`,
      '',
      'Criar palavra-passe e aceitar:',
      link,
      '',
      `Convite válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
      '',
      'TegLion',
    ].join('\n'),
  });
}

async function notifyFirmStaffEmailConfirmation({ staffEmail, staffName, firmName, token }) {
  if (!staffEmail || !token) return { skipped: true };
  const link = staffEmailConfirmUrl(token);
  const firm = firmName || 'TegLion';
  return sendEmail({
    to: staffEmail,
    subject: `Confirme o e-mail — ${firm}`,
    tags: ['transactional', 'email-confirm'],
    html: renderTransactionalEmail({
      preheader: 'Confirme o e-mail para activar o acesso à equipa',
      title: 'Confirme o seu e-mail',
      greeting: `Olá${staffName ? ` ${staffName}` : ''},`,
      bodyHtml: `<p style="margin:0">Para activar o acesso à equipa de <strong>${escapeHtml(firm)}</strong>, confirme o seu endereço de e-mail.</p>`,
      ctaLabel: 'Confirmar e-mail',
      ctaUrl: link,
      footerNote: 'Se não reconhece este pedido, ignore esta mensagem.',
    }),
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
