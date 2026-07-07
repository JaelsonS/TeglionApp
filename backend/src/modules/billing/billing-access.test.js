const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { computeFirmAccess, mapSubscriptionStatusToFirm } = require('./billing-access');

describe('computeFirmAccess', () => {
  it('retorna NOT_FOUND sem escritório', () => {
    assert.deepEqual(computeFirmAccess(null), { hasAccess: false, reason: 'NOT_FOUND' });
  });

  it('ACTIVE tem acesso', () => {
    assert.deepEqual(computeFirmAccess({ status: 'ACTIVE' }), { hasAccess: true, reason: 'ACTIVE' });
  });

  it('TRIAL válido tem acesso', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    assert.deepEqual(computeFirmAccess({ status: 'TRIAL', trialEndsAt: future }), {
      hasAccess: true,
      reason: 'TRIAL',
    });
  });

  it('TRIAL expirado bloqueia', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.deepEqual(computeFirmAccess({ status: 'TRIAL', trialEndsAt: past }), {
      hasAccess: false,
      reason: 'TRIAL_EXPIRED',
    });
  });

  it('SUSPENDED bloqueia', () => {
    assert.deepEqual(computeFirmAccess({ status: 'SUSPENDED' }), {
      hasAccess: false,
      reason: 'SUSPENDED',
    });
  });
});

describe('mapSubscriptionStatusToFirm', () => {
  it('mapeia active para ACTIVE', () => {
    assert.equal(mapSubscriptionStatusToFirm('active'), 'ACTIVE');
  });

  it('mapeia past_due para SUSPENDED', () => {
    assert.equal(mapSubscriptionStatusToFirm('past_due'), 'SUSPENDED');
  });
});
