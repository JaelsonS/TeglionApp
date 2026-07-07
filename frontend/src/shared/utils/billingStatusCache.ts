import type { BillingStatus } from '@/infrastructure/api/contabil/billing'

const STORAGE_KEY = 'teglion:billing-status'
const TTL_MS = 30 * 60 * 1000

type CachedBilling = BillingStatus & { cachedAt: number }

export function writeBillingStatusCache(status: BillingStatus) {
  try {
    const payload: CachedBilling = { ...status, cachedAt: Date.now() }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function readBillingStatusCache(): BillingStatus | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CachedBilling
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > TTL_MS) return undefined
    const { cachedAt: _c, ...status } = parsed
    return status
  } catch {
    return undefined
  }
}

export function clearBillingStatusCache() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Após login — evita bloquear o shell à espera de /billing/status. */
export function seedBillingStatusFromLogin(firmAccess?: { hasAccess: boolean; reason?: string }) {
  if (!firmAccess) return
  const status = firmAccess.hasAccess ? 'ACTIVE' : firmAccess.reason === 'TRIAL_EXPIRED' ? 'TRIAL' : 'SUSPENDED'
  writeBillingStatusCache({
    status,
    hasAccess: firmAccess.hasAccess,
    accessReason: firmAccess.reason || (firmAccess.hasAccess ? 'ACTIVE' : 'BLOCKED'),
    stripeConfigured: false,
    hasSubscription: false,
  })
}
