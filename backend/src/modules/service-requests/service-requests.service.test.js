const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const serviceRequestsRepo = require('../../db/supabase/repositories/service-requests.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const serviceRequestsService = require('./service-requests.service');

function resetMocks() {
  mock.restoreAll();
}

test('getQuotePdfPayload: inclui nome do escritório e amount formatado', async () => {
  resetMocks();
  mock.method(serviceRequestsRepo, 'findById', async () => ({
    id: 'req-1',
    title: 'Simulação de IRS',
    description: 'Descrição do pedido',
    status: 'QUOTED',
    quotedAmountCents: 12345,
    currency: 'EUR',
    clientId: 'client-1',
  }));
  mock.method(clientsRepository, 'findClientById', async () => ({ id: 'client-1', displayName: 'João Silva' }));
  mock.method(firmsRepository, 'findFirmById', async () => ({ id: 'firm-1', name: 'MayaVida', settings: {} }));

  const { quote } = await serviceRequestsService.getQuotePdfPayload('firm-1', 'req-1');

  assert.equal(quote.firmName, 'MayaVida');
  assert.equal(quote.clientName, 'João Silva');
  assert.equal(quote.amount, '123.45 EUR');
  assert.equal(quote.description, 'Descrição do pedido');
  assert.equal(quote.introText, null);
});

test('getQuotePdfPayload: propaga introText/termsText/footerText configurados pelo escritório', async () => {
  resetMocks();
  mock.method(serviceRequestsRepo, 'findById', async () => ({
    id: 'req-1',
    title: 'Consultoria',
    description: null,
    status: 'QUOTED',
    quotedAmountCents: null,
    clientId: 'client-1',
  }));
  mock.method(clientsRepository, 'findClientById', async () => null);
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: 'firm-1',
    name: 'Escritório X',
    settings: {
      quotePdf: {
        introText: 'Obrigado pelo contacto.',
        termsText: 'Válido por 30 dias.',
        footerText: 'IBAN PT50...',
      },
    },
  }));

  const { quote } = await serviceRequestsService.getQuotePdfPayload('firm-1', 'req-1');

  assert.equal(quote.introText, 'Obrigado pelo contacto.');
  assert.equal(quote.termsText, 'Válido por 30 dias.');
  assert.equal(quote.footerText, 'IBAN PT50...');
  assert.equal(quote.amount, 'A definir');
  assert.equal(quote.clientName, 'Cliente');
});

test('getQuotePdfPayload: pedido inexistente devolve 404', async () => {
  resetMocks();
  mock.method(serviceRequestsRepo, 'findById', async () => null);

  await assert.rejects(
    () => serviceRequestsService.getQuotePdfPayload('firm-1', 'req-x'),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});
