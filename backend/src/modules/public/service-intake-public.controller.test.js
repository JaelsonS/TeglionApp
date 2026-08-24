const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

require('../../test/ensure-test-env');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const accountingServiceGroupsRepository = require('../../db/supabase/repositories/accounting-service-groups.repository');
const accountingServiceOptionsRepository = require('../../db/supabase/repositories/accounting-service-options.repository');
const firmBrandingService = require('../firm/firm-branding.service');
const bookingService = require('../booking/booking.service');
const controller = require('./service-intake-public.controller');

function mockRes() {
  const captured = { statusCode: 200, body: null };
  return {
    status(code) {
      captured.statusCode = code;
      return this;
    },
    json(body) {
      captured.body = body;
      return this;
    },
    captured,
  };
}

test('getPublicSlots: requiresBooking=false devolve slots vazios e não consulta o motor', async () => {
  mock.restoreAll();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => ({ id: 'firm-x', slug: 'demo' }));
  mock.method(accountingServicesRepository, 'listByFirm', async () => [
    {
      id: 'svc-1',
      slug: 'irs',
      isPubliclyListed: true,
      isActive: true,
      requiresBooking: false,
    },
  ]);
  mock.method(bookingService, 'listSlotsForBooking', async () => {
    throw new Error('não devia gerar slots quando requiresBooking=false');
  });

  const req = { params: { firmSlug: 'demo', serviceSlug: 'irs' }, query: {} };
  const res = mockRes();
  await controller.getPublicSlots(req, res, (err) => {
    throw err || new Error('next não devia ser chamado');
  });

  assert.deepEqual(res.captured.body, { slots: [] });
});

test('getPublicFirmServices: grupo desactivado (F-05) não aparece como cabeçalho, mesmo publicamente listado', async () => {
  mock.restoreAll();
  mock.method(firmsRepository, 'findFirmBySlugOrLabel', async () => ({ id: 'firm-x', slug: 'demo', settings: {} }));
  mock.method(accountingServiceGroupsRepository, 'listByFirm', async () => [
    { id: 'group-active', name: 'Consultorias', isActive: true, isPubliclyListed: true },
    { id: 'group-inactive', name: 'Descontinuado', isActive: false, isPubliclyListed: true },
  ]);
  mock.method(accountingServiceOptionsRepository, 'listByFirm', async () => []);
  mock.method(firmBrandingService, 'resolveLogoUrl', async () => null);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [
    {
      id: 'svc-active-group',
      slug: 'consultoria-fiscal',
      name: 'Consultoria Fiscal',
      isPubliclyListed: true,
      isActive: true,
      groupId: 'group-active',
      publicGroup: null,
      priceCents: 0,
    },
    {
      id: 'svc-inactive-group',
      slug: 'servico-antigo',
      name: 'Serviço Antigo',
      isPubliclyListed: true,
      isActive: true,
      groupId: 'group-inactive',
      publicGroup: null,
      priceCents: 0,
    },
  ]);

  const req = { params: { firmSlug: 'demo' }, query: {} };
  const res = mockRes();
  await controller.getPublicFirmServices(req, res, (err) => {
    throw err || new Error('next não devia ser chamado');
  });

  const bySlug = Object.fromEntries(res.captured.body.items.map((i) => [i.slug, i]));
  assert.equal(bySlug['consultoria-fiscal'].publicGroup, 'Consultorias');
  assert.notEqual(bySlug['servico-antigo'].publicGroup, 'Descontinuado');
});
