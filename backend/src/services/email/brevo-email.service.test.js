const test = require('node:test');
const assert = require('node:assert/strict');

const { stripControlChars } = require('./brevo-email.service');

// Regressão: subject e replyTo.name interpolavam dados do utilizador (nome do
// escritório, nome do solicitante) sem remover \r\n antes de irem para a API da
// Brevo. Defesa em profundidade: mesmo que o transporte seja JSON/HTTPS (não SMTP
// cru, logo não injectável a nível do nosso servidor), normaliza caracteres de
// controlo para não depender de como a Brevo constrói o header SMTP final deles.

test('stripControlChars: remove CR/LF de um valor com quebras de linha', () => {
  assert.equal(stripControlChars('Assunto\r\nBcc: atacante@evil.tld'), 'Assunto Bcc: atacante@evil.tld');
  assert.equal(stripControlChars('Linha1\nLinha2\r\nLinha3'), 'Linha1 Linha2 Linha3');
});

test('stripControlChars: texto normal fica inalterado (só trim)', () => {
  assert.equal(stripControlChars('  Novo pedido de João Silva  '), 'Novo pedido de João Silva');
});

test('stripControlChars: null/undefined viram string vazia, sem lançar', () => {
  assert.equal(stripControlChars(null), '');
  assert.equal(stripControlChars(undefined), '');
});
