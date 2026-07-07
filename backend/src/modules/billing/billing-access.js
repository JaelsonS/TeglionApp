function computeFirmAccess(firm) {
  if (!firm) return { hasAccess: false, reason: 'NOT_FOUND' };
  if (firm.status === 'CANCELLED') return { hasAccess: false, reason: 'CANCELLED' };
  if (firm.status === 'ACTIVE') return { hasAccess: true, reason: 'ACTIVE' };
  if (firm.status === 'SUSPENDED') return { hasAccess: false, reason: 'SUSPENDED' };
  if (firm.status === 'TRIAL') {
    if (!firm.trialEndsAt) return { hasAccess: true, reason: 'TRIAL' };
    const ends = new Date(firm.trialEndsAt);
    if (!Number.isNaN(ends.getTime()) && ends.getTime() <= Date.now()) {
      return { hasAccess: false, reason: 'TRIAL_EXPIRED' };
    }
    return { hasAccess: true, reason: 'TRIAL' };
  }
  return { hasAccess: false, reason: 'BLOCKED' };
}

function mapSubscriptionStatusToFirm(subStatus) {
  if (subStatus === 'active' || subStatus === 'trialing') return 'ACTIVE';
  if (subStatus === 'past_due' || subStatus === 'unpaid') return 'SUSPENDED';
  if (subStatus === 'canceled' || subStatus === 'incomplete_expired') return 'SUSPENDED';
  return 'SUSPENDED';
}

module.exports = { computeFirmAccess, mapSubscriptionStatusToFirm };
