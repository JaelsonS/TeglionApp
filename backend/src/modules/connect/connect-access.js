const { CONNECT_TERMS_VERSION } = require('./connect-terms');

function deriveOnboardingStatus(account) {
  if (!account) return 'not_started';
  if (account.charges_enabled || account.chargesEnabled) return 'complete';
  const due =
    account.requirements?.currently_due ||
    account.requirementsCurrentlyDue ||
    [];
  const disabled =
    account.requirements?.disabled_reason || account.requirementsDisabledReason || null;
  if (disabled || (Array.isArray(due) && due.length > 0)) return 'restricted';
  if (account.details_submitted || account.detailsSubmitted) return 'pending';
  return 'pending';
}

function hasCurrentTermsAccepted(account) {
  return account?.latestTermsVersion === CONNECT_TERMS_VERSION && Boolean(account?.latestTermsAcceptedAt);
}

function mapStripeAccountPatch(stripeAccount, eventId) {
  const currentlyDue = stripeAccount.requirements?.currently_due || [];
  return {
    detailsSubmitted: Boolean(stripeAccount.details_submitted),
    chargesEnabled: Boolean(stripeAccount.charges_enabled),
    payoutsEnabled: Boolean(stripeAccount.payouts_enabled),
    requirementsCurrentlyDue: currentlyDue,
    requirementsDisabledReason: stripeAccount.requirements?.disabled_reason || null,
    onboardingStatus: deriveOnboardingStatus(stripeAccount),
    lastAccountUpdatedEventId: eventId || undefined,
  };
}

module.exports = {
  deriveOnboardingStatus,
  hasCurrentTermsAccepted,
  mapStripeAccountPatch,
  HOLD_MINUTES: 30,
};
