require('../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  signAccessToken,
  signMfaChallengeToken,
  signVaultStepUpToken,
  isAccessTokenValid,
  VAULT_STEPUP_PURPOSES,
  MFA_PURPOSES,
} = require('./jwt');

test('isAccessTokenValid aceita sessão normal e rejeita challenge/step-up', () => {
  const session = signAccessToken({ id: 'u1', role: 'FIRM_OWNER', firmId: 'f1' });
  assert.equal(isAccessTokenValid(session), true);

  const { token: challenge } = signMfaChallengeToken({
    id: 'u1',
    firmId: 'f1',
    purpose: MFA_PURPOSES.VERIFY,
  });
  assert.equal(isAccessTokenValid(challenge), false);

  const stepUp = signVaultStepUpToken({
    id: 'u1',
    firmId: 'f1',
    purpose: VAULT_STEPUP_PURPOSES.REVEAL,
  });
  assert.equal(isAccessTokenValid(stepUp), false);
});
