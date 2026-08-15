const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// Testa o resolvedor puro (sem carregar env.js completo).
const { resolveEncryptionKeyBuffer } = require('./crypto-fields.resolve');

describe('resolveEncryptionKeyBuffer', () => {
  test('aceita chave hex 64 chars (32 bytes)', () => {
    const hex = 'ab'.repeat(32);
    const key = resolveEncryptionKeyBuffer(hex);
    assert.equal(key.length, 32);
    assert.equal(key.toString('hex'), hex);
  });

  test('aceita chave base64 de 32 bytes', () => {
    const raw = Buffer.alloc(32, 7).toString('base64');
    const key = resolveEncryptionKeyBuffer(raw);
    assert.equal(key.length, 32);
  });

  test('rejeita base64 com tamanho errado', () => {
    assert.throws(() => resolveEncryptionKeyBuffer(Buffer.alloc(16).toString('base64')), /32 bytes/);
  });

  test('roundtrip AES com hex key (como staging)', () => {
    const hex = crypto.randomBytes(32).toString('hex');
    const key = resolveEncryptionKeyBuffer(hex);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update('ping', 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    assert.equal(Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8'), 'ping');
  });
});
