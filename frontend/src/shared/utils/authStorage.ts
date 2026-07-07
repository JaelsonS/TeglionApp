const LEGACY_STORAGE_KEY = 'contabil:accessToken'

/** Remove tokens legados gravados em sessionStorage (migração cookie-only). */
function purgeLegacyStoredToken() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    /* quota / private mode */
  }
}

/**
 * Autenticação cookie-only: access/refresh tokens vivem em cookies httpOnly.
 * Nunca persistir JWT em sessionStorage/localStorage (risco XSS).
 */
export const authStorage = {
  getAccessToken(): string | null {
    purgeLegacyStoredToken()
    return null
  },
  setAccessToken(_token: string) {
    purgeLegacyStoredToken()
  },
  clear() {
    purgeLegacyStoredToken()
  },
}
