const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  CONNECT_TERMS_VERSION,
  connectTermsTextSha256,
  getConnectTermsPayload,
  CONNECT_TERMS_BODY,
} = require('./connect-terms');
const {
  deriveOnboardingStatus,
  hasCurrentTermsAccepted,
  mapStripeAccountPatch,
} = require('./connect-access');

describe('connect-terms', () => {
  it('expõe versão estável e hash do texto exacto', () => {
    const payload = getConnectTermsPayload();
    assert.equal(payload.version, CONNECT_TERMS_VERSION);
    assert.equal(payload.sha256, connectTermsTextSha256());
    assert.ok(CONNECT_TERMS_BODY.includes('não custodia'));
    assert.ok(CONNECT_TERMS_BODY.includes('Stripe'));
  });
});

describe('connect-access', () => {
  it('charges_enabled → complete', () => {
    assert.equal(deriveOnboardingStatus({ charges_enabled: true }), 'complete');
  });

  it('requirements due → restricted', () => {
    assert.equal(
      deriveOnboardingStatus({
        charges_enabled: false,
        requirements: { currently_due: ['external_account'] },
      }),
      'restricted',
    );
  });

  it('exige versão actual de termos', () => {
    assert.equal(hasCurrentTermsAccepted(null), false);
    assert.equal(
      hasCurrentTermsAccepted({
        latestTermsVersion: CONNECT_TERMS_VERSION,
        latestTermsAcceptedAt: new Date().toISOString(),
      }),
      true,
    );
    assert.equal(
      hasCurrentTermsAccepted({
        latestTermsVersion: 'old',
        latestTermsAcceptedAt: new Date().toISOString(),
      }),
      false,
    );
  });

  it('mapStripeAccountPatch deriva estado', () => {
    const patch = mapStripeAccountPatch(
      {
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: false,
        requirements: { currently_due: [], disabled_reason: null },
      },
      'evt_1',
    );
    assert.equal(patch.onboardingStatus, 'complete');
    assert.equal(patch.chargesEnabled, true);
    assert.equal(patch.lastAccountUpdatedEventId, 'evt_1');
  });

  it('hold de pagamento é 30 minutos', () => {
    const { HOLD_MINUTES } = require('./connect-access');
    assert.equal(HOLD_MINUTES, 30);
  });
});
