import type { Firm } from '@/shared/types/firm'

const PREFIX = 'contabil:firmBranding:'
const TTL_MS = 15 * 60 * 1000

type CachedBranding = {
  firm: Firm | null
  logoUrl: string | null
  cachedAt: number
}

export function readFirmBrandingCache(tenantSlug: string): { firm: Firm | null; logoUrl: string | null } | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${tenantSlug}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedBranding
    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > TTL_MS) return null
    return { firm: parsed.firm, logoUrl: parsed.logoUrl }
  } catch {
    return null
  }
}

export function writeFirmBrandingCache(tenantSlug: string, firm: Firm | null, logoUrl: string | null) {
  try {
    const payload: CachedBranding = { firm, logoUrl, cachedAt: Date.now() }
    localStorage.setItem(`${PREFIX}${tenantSlug}`, JSON.stringify(payload))
  } catch {
    // ignore
  }
}
