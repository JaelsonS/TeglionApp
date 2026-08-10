const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const leadsRepository = require('../../db/supabase/repositories/leads.repository');
const consultationsService = require('./consultations.service');

const FIRM_ID = 'firm-x';

function resetMocks() {
  mock.restoreAll();
}

test('listConsultations: resolve holderName a partir do Client quando clientId presente', async () => {
  resetMocks();
  mock.method(consultationsRepository, 'listConsultations', async () => [
    { id: 'c1', clientId: 'client-1', leadId: null, title: 'Consulta' },
  ]);
  mock.method(clientsRepository, 'findClientById', async (firmId, clientId) => {
    assert.equal(firmId, FIRM_ID);
    assert.equal(clientId, 'client-1');
    return { displayName: 'Ana Cliente' };
  });
  mock.method(leadsRepository, 'findByIdForFirm', async () => {
    throw new Error('não devia chamar leads quando é um Client');
  });

  const items = await consultationsService.listConsultations({ firmId: FIRM_ID });
  assert.equal(items[0].holderName, 'Ana Cliente');
});

test('listConsultations: resolve holderName a partir do Lead quando leadId presente (Fase 3a)', async () => {
  resetMocks();
  mock.method(consultationsRepository, 'listConsultations', async () => [
    { id: 'c2', clientId: null, leadId: 'lead-1', title: 'Consulta' },
  ]);
  mock.method(leadsRepository, 'findByIdForFirm', async (leadId, firmId) => {
    assert.equal(leadId, 'lead-1');
    assert.equal(firmId, FIRM_ID);
    return { name: 'Bruno Lead' };
  });
  mock.method(clientsRepository, 'findClientById', async () => {
    throw new Error('não devia chamar clients quando é um Lead');
  });

  const items = await consultationsService.listConsultations({ firmId: FIRM_ID });
  assert.equal(items[0].holderName, 'Bruno Lead');
});
