/**
 * Notificações Teglion — email (Brevo) + SMS (Brevo transactional).
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
      bodyHtml: `<p style="margin:0 0 12px">O escritório <strong>${escapeHtml(firm)}</strong> convidou-o a aceder ao portal Teglion para enviar documentos, ver obrigações e comunicar com a equipa.</p>`,
      ctaLabel: 'Aceitar convite',
      ctaUrl: link,
      footerNote: `Link válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
    }),
    text: [
      `Olá${clientName ? ` ${clientName}` : ''},`,
      '',
      `O escritório ${firm} convidou-o a aceder ao portal Teglion.`,
      '',
      `Aceitar convite: ${link}`,
      '',
      `Válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
      '',
      'Teglion',
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

/**
 * Quando o escritório cria/envia uma obrigação — e-mail para o cliente entrar no Teglion.
 * (SMS fica para depois; o canal principal agora é e-mail.)
 */
async function notifyClientObligationAssigned({
  clientEmail,
  clientName,
  obligationTitle,
  firmName,
  dueDate,
  hasGuide = false,
}) {
  if (!clientEmail) return { skipped: true, reason: 'no_email' };
  const name = clientName || 'Cliente';
  const firm = firmName || 'o seu escritório';
  const title = obligationTitle || 'Nova obrigação fiscal';
  const dueLine = dueDate
    ? `<p style="margin:0 0 12px"><strong>Prazo:</strong> ${escapeHtml(dueDate)}</p>`
    : '';
  const guideLine = hasGuide
    ? `<p style="margin:0 0 12px">Há uma guia ou instruções prontas para consultar no portal.</p>`
    : '';
  return sendEmail({
    to: clientEmail,
    subject: `${firm} — tem uma obrigação no Teglion`,
    tags: ['transactional', 'obligation-assigned'],
    html: renderTransactionalEmail({
      preheader: `${title} — entre no portal do cliente`,
      title: 'O seu escritório deixou-lhe uma obrigação',
      greeting: `Olá ${escapeHtml(name)},`,
      bodyHtml: [
        `<p style="margin:0 0 12px">O escritório <strong>${escapeHtml(firm)}</strong> publicou uma obrigação fiscal para si no Teglion:</p>`,
        `<p style="margin:0 0 12px"><strong>${escapeHtml(title)}</strong></p>`,
        dueLine,
        guideLine,
        `<p style="margin:0 0 12px">Entre no portal para ver o detalhe, enviar documentos e acompanhar o prazo — no telemóvel ou no computador.</p>`,
      ].join(''),
      ctaLabel: 'Abrir o portal Teglion',
      ctaUrl: portalUrl(),
      footerNote: 'Se já tem acesso, use o mesmo e-mail com que o escritório o convidou. Se ainda não activou a conta, peça o convite ao seu contabilista.',
    }),
    text: [
      `Olá ${name},`,
      '',
      `O escritório ${firm} publicou uma obrigação no Teglion: ${title}.`,
      dueDate ? `Prazo: ${dueDate}` : '',
      hasGuide ? 'Há guia/instruções no portal.' : '',
      '',
      `Abrir o portal: ${portalUrl()}`,
      '',
      'Teglion',
    ]
      .filter(Boolean)
      .join('\n'),
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
      ctaLabel: 'Abrir portal Teglion',
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
    ? 'Redefinição de palavra-passe — portal Teglion'
    : 'Redefinição de palavra-passe — escritório Teglion';
  return sendEmail({
    to: email,
    subject,
    tags: ['transactional', 'password-reset'],
    html: renderTransactionalEmail({
      preheader: 'Pedido de redefinição de palavra-passe (válido 15 minutos)',
      title: 'Redefinir palavra-passe',
      bodyHtml: `<p style="margin:0">Recebemos um pedido para redefinir a sua palavra-passe no Teglion. Se não foi você, ignore este e-mail.</p>`,
      ctaLabel: 'Criar nova palavra-passe',
      ctaUrl: resetUrl,
      footerNote: 'O link expira em 15 minutos por segurança.',
    }),
    text: `Redefinir palavra-passe Teglion: ${resetUrl} (válido 15 minutos)`,
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
  const appName = firmName || 'Teglion';
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
      ctaLabel: 'Entrar no Teglion',
      ctaUrl: loginLink,
      footerNote: 'Se ainda não recebeu a palavra-passe inicial, contacte o administrador do escritório.',
    }),
    text: [
      `Olá${staffName ? ` ${staffName}` : ''},`,
      '',
      `Foi criada uma conta de colaborador para si no ${appName}.`,
      '',
      'Entrar no Teglion:',
      loginLink,
      '',
      'Se ainda não recebeu a sua palavra-passe inicial, contacte o dono/administrador do escritório.',
      '',
      'Teglion',
    ].join('\n'),
  });
}

async function notifyFirmMemberInvite({ staffEmail, staffName, firmName, inviteToken, expiresAt }) {
  if (!staffEmail) return { skipped: true, reason: 'no_email' };
  const link = teamInviteUrl(inviteToken);
  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString('pt-PT') : '14 dias';
  const firm = firmName || 'Teglion';
  return sendEmail({
    to: staffEmail,
    subject: `Convite para a equipa — ${firm}`,
    tags: ['transactional', 'team-invite'],
    html: renderTransactionalEmail({
      preheader: `Defina a sua palavra-passe para entrar na equipa de ${firm}`,
      title: 'Convite para a equipa',
      greeting: `Olá${staffName ? ` ${staffName}` : ''},`,
      bodyHtml: `<p style="margin:0 0 12px">Foi convidado(a) a juntar-se à equipa do escritório <strong>${escapeHtml(firm)}</strong> no Teglion.</p><p style="margin:0">Clique no botão abaixo para criar a sua palavra-passe e concluir o acesso. Depois confirme o e-mail para activar a conta.</p>`,
      ctaLabel: 'Criar palavra-passe e aceitar',
      ctaUrl: link,
      footerNote: `Convite válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
    }),
    text: [
      `Olá${staffName ? ` ${staffName}` : ''},`,
      '',
      `Foi convidado(a) a juntar-se à equipa do escritório ${firm} no Teglion.`,
      '',
      'Criar palavra-passe e aceitar:',
      link,
      '',
      `Convite válido até ${expiry}. Se não esperava este e-mail, ignore-o.`,
      '',
      'Teglion',
    ].join('\n'),
  });
}

async function notifyFirmStaffEmailConfirmation({ staffEmail, staffName, firmName, token }) {
  if (!staffEmail || !token) return { skipped: true };
  const link = staffEmailConfirmUrl(token);
  const firm = firmName || 'Teglion';
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

/** Boas-vindas + confirmação para o dono do escritório (registo e-mail/senha). */
async function notifyFirmOwnerSignupConfirm({ ownerEmail, ownerName, firmName, token }) {
  if (!ownerEmail || !token) return { skipped: true };
  const link = staffEmailConfirmUrl(token);
  const firm = firmName || 'o seu escritório';
  return sendEmail({
    to: ownerEmail,
    subject: `Bem-vindo ao Teglion — confirme o e-mail`,
    tags: ['transactional', 'owner-signup', 'email-confirm'],
    html: renderTransactionalEmail({
      preheader: 'Confirme o e-mail para activar a conta do escritório',
      title: 'Bem-vindo ao Teglion',
      greeting: `Olá${ownerName ? ` ${ownerName}` : ''},`,
      bodyHtml: `<p style="margin:0 0 12px">A conta do seu escritório <strong>${escapeHtml(firm)}</strong> foi criada.</p><p style="margin:0">Para a activar e entrar no painel, confirme o seu e-mail. O link é válido durante 48 horas.</p>`,
      ctaLabel: 'Confirmar e-mail e activar conta',
      ctaUrl: link,
      footerNote: 'Depois da confirmação, entre com o e-mail e a palavra-passe que definiu. Se não criou esta conta, ignore este e-mail.',
    }),
    text: [
      `Olá${ownerName ? ` ${ownerName}` : ''},`,
      '',
      `A conta do escritório ${firm} foi criada no Teglion.`,
      '',
      'Confirme o e-mail para activar a conta:',
      link,
      '',
      'Depois entre com o e-mail e a palavra-passe que definiu.',
      '',
      'Teglion',
    ].join('\n'),
  });
}

/** Boas-vindas para dono que se registou com Google (e-mail já verificado). */
async function notifyFirmOwnerWelcome({ ownerEmail, ownerName, firmName }) {
  if (!ownerEmail) return { skipped: true };
  const loginLink = `${APP_URL}/auth/firm/login`;
  const firm = firmName || 'o seu escritório';
  return sendEmail({
    to: ownerEmail,
    subject: `Bem-vindo ao Teglion — ${firm}`,
    tags: ['transactional', 'owner-welcome', 'google-signup'],
    html: renderTransactionalEmail({
      preheader: 'A sua conta está pronta — entre com Google',
      title: 'Bem-vindo ao Teglion',
      greeting: `Olá${ownerName ? ` ${ownerName}` : ''},`,
      bodyHtml: `<p style="margin:0 0 12px">A conta do escritório <strong>${escapeHtml(firm)}</strong> está activa.</p><p style="margin:0">Como se registou com Google, o e-mail já está confirmado. Use <strong>Continuar com Google</strong> sempre que quiser entrar.</p>`,
      ctaLabel: 'Ir para o login',
      ctaUrl: loginLink,
      footerNote: 'Guarde este e-mail para referência. Estamos contentes por tê-lo connosco.',
    }),
    text: [
      `Olá${ownerName ? ` ${ownerName}` : ''},`,
      '',
      `A conta do escritório ${firm} está activa no Teglion.`,
      'Como se registou com Google, o e-mail já está confirmado.',
      '',
      'Login:',
      loginLink,
      '',
      'Teglion',
    ].join('\n'),
  });
}

/** Boas-vindas ao cliente após aceitar o convite do portal. */
async function notifyClientWelcome({ clientEmail, clientName, firmName }) {
  if (!clientEmail) return { skipped: true };
  const loginLink = `${APP_URL}/auth/client/login`;
  const firm = firmName || 'o seu escritório';
  return sendEmail({
    to: clientEmail,
    subject: `Bem-vindo ao portal — ${firm}`,
    tags: ['transactional', 'client-welcome'],
    html: renderTransactionalEmail({
      preheader: `O seu acesso ao portal de ${firm} está pronto`,
      title: 'Bem-vindo ao portal',
      greeting: `Olá${clientName ? ` ${clientName}` : ''},`,
      bodyHtml: `<p style="margin:0 0 12px">A sua conta no portal de <strong>${escapeHtml(firm)}</strong> está pronta.</p><p style="margin:0">Pode entrar com o e-mail e a palavra-passe que acabou de definir para enviar documentos e acompanhar pedidos.</p>`,
      ctaLabel: 'Entrar no portal',
      ctaUrl: loginLink,
      footerNote: 'Se não esperava este e-mail, contacte o seu escritório de contabilidade.',
    }),
    text: [
      `Olá${clientName ? ` ${clientName}` : ''},`,
      '',
      `A sua conta no portal de ${firm} está pronta.`,
      '',
      'Entrar:',
      loginLink,
      '',
      'Teglion',
    ].join('\n'),
  });
}

module.exports = {
  notifyClientInvite,
  notifyClientNewTask,
  notifyClientObligationAssigned,
  notifyClientObligationReminder,
  notifyFirmDocumentReceived,
  notifyFirmConsultationBooked,
  notifyClientSms,
  notifyPasswordReset,
  notifyFirmStaffWelcome,
  notifyFirmMemberInvite,
  notifyFirmStaffEmailConfirmation,
  notifyFirmOwnerSignupConfirm,
  notifyFirmOwnerWelcome,
  notifyClientWelcome,
  inviteUrl,
  teamInviteUrl,
  staffEmailConfirmUrl,
};
