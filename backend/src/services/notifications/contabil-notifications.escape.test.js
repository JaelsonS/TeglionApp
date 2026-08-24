const { test } = require('node:test');
const assert = require('node:assert/strict');

// Substitui os módulos de envio real (Brevo) por stubs em memória via require.cache,
// para não depender de flags experimentais (`mock.module`) nem de rede real.
function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

test('notifyClientObligationReminder escapa HTML perigoso em body (regressão XSS em e-mail)', async () => {
  const sentEmails = [];
  stubModule('../email/brevo-email.service', {
    sendEmail: async (payload) => {
      sentEmails.push(payload);
      return { skipped: false };
    },
  });
  stubModule('../email/brevo-sms.service', {
    sendSms: async () => ({ skipped: true }),
  });

  delete require.cache[require.resolve('./contabil-notifications.service')];
  const { notifyClientObligationReminder } = require('./contabil-notifications.service');

  const malicious = '<img src=x onerror="alert(document.cookie)"><a href="https://phish.example">clique aqui</a>';

  await notifyClientObligationReminder({
    clientEmail: 'cliente@example.com',
    clientName: 'Cliente Teste',
    obligationTitle: 'IVA trimestral',
    firmName: 'Escritório Teste',
    dueDate: '2026-09-30',
    body: malicious,
  });

  assert.equal(sentEmails.length, 1);
  const html = sentEmails[0].html;
  assert.equal(typeof html, 'string');
  // A tag <img> literal (não escapada) seria interpretada pelo cliente de e-mail;
  // o que importa é que ela nunca apareça como HTML real, só como texto inerte escapado.
  assert.ok(!html.includes('<img'), 'não deve conter tag <img> não escapada (executável)');
  assert.ok(!html.includes('<a href="https://phish.example">'), 'não deve conter link não escapado injetado via body');
  assert.ok(html.includes('&lt;img'), 'deve conter a versão escapada da tag <img>, como texto inerte');
  assert.ok(html.includes('&lt;a href='), 'deve conter a versão escapada do link, como texto inerte');
});

test('notifyClientObligationReminder mantém mensagem padrão (com strong/escape) quando body não é fornecido', async () => {
  const sentEmails = [];
  stubModule('../email/brevo-email.service', {
    sendEmail: async (payload) => {
      sentEmails.push(payload);
      return { skipped: false };
    },
  });
  stubModule('../email/brevo-sms.service', {
    sendSms: async () => ({ skipped: true }),
  });

  delete require.cache[require.resolve('./contabil-notifications.service')];
  const { notifyClientObligationReminder } = require('./contabil-notifications.service');

  await notifyClientObligationReminder({
    clientEmail: 'cliente@example.com',
    clientName: 'Cliente <script>alert(1)</script>',
    obligationTitle: 'IVA <b>trimestral</b>',
    firmName: 'Escritório Teste',
    dueDate: '2026-09-30',
  });

  assert.equal(sentEmails.length, 1);
  const html = sentEmails[0].html;
  assert.ok(html.includes('A obrigação <strong>'), 'mensagem padrão continua com formatação intencional');
  assert.ok(!html.includes('<script'), 'título malicioso do cliente continua escapado');
});
