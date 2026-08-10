const test = require('node:test');
const assert = require('node:assert/strict');

const { map } = require('./service-inquiry-requests.repository');
const { encryptField } = require('../../../utils/crypto-fields');

test('map: linha sem resposta em texto devolve textReply null', () => {
  const row = {
    id: 'req-1',
    firm_id: 'firm-1',
    service_inquiry_id: 'inquiry-1',
    kind: 'document',
    tag: 'cc',
    title: 'Cartão de Cidadão',
    instructions: null,
    status: 'PENDING',
    text_reply_enc: null,
    document_id: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00.000Z',
    answered_at: null,
  };
  assert.equal(map(row).textReply, null);
  assert.equal(map(row).kind, 'document');
});

test('map: decifra text_reply_enc para o texto original', () => {
  const original = 'Sim, tenho dois dependentes.';
  const row = {
    id: 'req-2',
    firm_id: 'firm-1',
    service_inquiry_id: 'inquiry-1',
    kind: 'question',
    tag: null,
    title: 'Tem dependentes a cargo?',
    instructions: null,
    status: 'ANSWERED',
    text_reply_enc: encryptField(original),
    document_id: null,
    created_by: null,
    created_at: '2026-01-01T00:00:00.000Z',
    answered_at: '2026-01-02T00:00:00.000Z',
  };
  assert.equal(map(row).textReply, original);
});

test('map: null devolve null', () => {
  assert.equal(map(null), null);
});
