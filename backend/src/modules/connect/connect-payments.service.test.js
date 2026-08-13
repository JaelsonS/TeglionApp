// STRIPE_CONNECT_ENABLED / STRIPE_SECRET_KEY precisam existir no process.env
// ANTES do primeiro require de config/env.js (env.js congela no load). Em CI
// o workflow também as injecta; aqui reforçamos para runs locais herméticos.
process.env.STRIPE_CONNECT_ENABLED = process.env.STRIPE_CONNECT_ENABLED || 'true';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_ci_placeholder_not_for_prod';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const connectAccountsRepository = require('../../db/supabase/repositories/firm-stripe-connect-accounts.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const bookingService = require('../booking/booking.service');
const entitlements = require('../entitlements/entitlements.service');
const connectPaymentsService = require('./connect-payments.service');

const FIRM_ID = 'firm-x';
const SERVICE = {
  id: 'service-1',
  name: 'Consulta com pagamento',
  isActive: true,
  paymentRequired: true,
  requiresBooking: true,
  durationMinutes: 60,
  priceCents: 5000,
  currency: 'EUR',
};

function resetMocks() {
  mock.restoreAll();
}

function nextWeekdayNoonUtc() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setUTCHours(12, 0, 0, 0);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString();
}

function wireHappyPathUpToConsultationCreate(scheduledIso) {
  // isStripeConnectConfigured é lido via binding no service — o CI/workflow
  // injecta STRIPE_CONNECT_ENABLED + STRIPE_SECRET_KEY antes do boot do Node.
  mock.method(entitlements, 'can', async () => ({ allowed: true }));
  mock.method(accountingServicesRepository, 'findByIdForFirm', async () => SERVICE);
  mock.method(connectAccountsRepository, 'findByFirmId', async () => ({
    stripeAccountId: 'acct_123',
    chargesEnabled: true,
  }));
  mock.method(bookingService, 'listSlotsForBooking', async () => ({
    slots: [scheduledIso],
    booking: {},
  }));
  mock.method(bookingService, 'normalizeBooking', () => ({ googleCalendarStaffUserId: null }));
  mock.method(firmsRepository, 'findFirmById', async () => ({ id: FIRM_ID, settings: {} }));
}

test('bookAndPayAsClient: violação da exclusion constraint (23P01) vira 409, não 500', async () => {
  resetMocks();
  const scheduledIso = nextWeekdayNoonUtc();
  wireHappyPathUpToConsultationCreate(scheduledIso);
  mock.method(consultationsRepository, 'createConsultation', async () => {
    const err = new Error('conflicting key value violates exclusion constraint "consultations_no_overlap"');
    err.code = '23P01';
    throw err;
  });

  await assert.rejects(
    () =>
      connectPaymentsService.bookAndPayAsClient({
        firmId: FIRM_ID,
        clientId: 'client-1',
        serviceId: SERVICE.id,
        scheduledAt: scheduledIso,
      }),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'SLOT_TAKEN');
      return true;
    },
  );
});
