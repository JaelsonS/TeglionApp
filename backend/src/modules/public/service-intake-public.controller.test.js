const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

require('../../test/ensure-test-env');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
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
