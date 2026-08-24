require('../../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');

function stubModule(relativeFromHere, exports) {
  const resolved = require.resolve(relativeFromHere, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

test('updateConsultation rejeita campos internos (google*/hold) e status de pagamento', async () => {
  const updates = [];
  stubModule('../../db/supabase/repositories/consultations.repository', {
    findByIdForFirm: async () => ({
      id: 'c1',
      firmId: 'f1',
      status: 'SCHEDULED',
      clientId: 'client-1',
      scheduledAt: new Date().toISOString(),
    }),
    updateConsultation: async (id, firmId, patch) => {
      updates.push(patch);
      return { id, firmId, ...patch, status: patch.status || 'SCHEDULED' };
    },
    listConsultations: async () => [],
    countAttentionByFirm: async () => ({ count: 0 }),
  });
  stubModule('../../db/supabase/repositories/firms.repository', {
    findFirmById: async () => ({ id: 'f1', settings: {} }),
  });
  stubModule('../../db/supabase/repositories/clients.repository', {
    findClientById: async () => ({ id: 'client-1', displayName: 'Acme' }),
  });
  stubModule('../../db/supabase/repositories/leads.repository', {
    findByIdForFirm: async () => null,
  });
  stubModule('../integrations/google-calendar/google-calendar-sync.service', {
    syncConsultationToGoogle: async () => {},
  });

  delete require.cache[require.resolve('./consultations.service')];
  const service = require('./consultations.service');

  await service.updateConsultation({
    firmId: 'f1',
    id: 'c1',
    patch: {
      notes: 'ok',
      googleEventId: 'evil',
      googleSyncStatus: 'SYNCED',
      holdExpiresAt: new Date().toISOString(),
      status: 'CANCELLED',
      cancelReason: 'cancelled_by_firm',
    },
  });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].notes, 'ok');
  assert.equal(updates[0].status, 'CANCELLED');
  assert.equal(updates[0].cancelReason, 'cancelled_by_firm');
  assert.equal(updates[0].googleEventId, undefined);
  assert.equal(updates[0].googleSyncStatus, undefined);
  assert.equal(updates[0].holdExpiresAt, undefined);

  await assert.rejects(
    () =>
      service.updateConsultation({
        firmId: 'f1',
        id: 'c1',
        patch: { status: 'PENDING_PAYMENT' },
      }),
    (err) => err?.details?.code === 'PAYMENT_STATUS_LOCKED' || err?.code === 'PAYMENT_STATUS_LOCKED',
  );
});
