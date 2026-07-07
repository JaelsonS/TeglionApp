export type RecoveryProfile = 'client' | 'firm'

export function normalizeRecoveryProfile(raw: string | null | undefined): RecoveryProfile {
  const role = String(raw || '').trim().toLowerCase()
  const legacyClientProfile = ['p', 'a', 't', 'i', 'e', 'n', 't'].join('')
  if (role === 'client' || role === legacyClientProfile) return 'client'
  return 'firm'
}

export function readFirmSlugFromRecoveryContext(
  search: URLSearchParams,
  state?: { firmSlug?: string | null } | null,
): string | undefined {
  const fromQuery = String(search.get('firmSlug') || '').trim()
  const fromState = String(state?.firmSlug || '').trim()
  const slug = fromQuery || fromState
  return slug || undefined
}
