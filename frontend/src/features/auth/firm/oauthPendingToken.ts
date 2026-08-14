const OAUTH_PENDING_STORAGE_KEY = 'teglion:oauth_register_pending'

export function readStoredOAuthPendingToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('pending')
    if (fromUrl?.trim()) {
      window.sessionStorage.setItem(OAUTH_PENDING_STORAGE_KEY, fromUrl.trim())
      return fromUrl.trim()
    }
    return window.sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearStoredOAuthPendingToken() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(OAUTH_PENDING_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function oauthPendingHeaders(token?: string | null): Record<string, string> {
  const value = String(token || readStoredOAuthPendingToken() || '').trim()
  return value ? { 'X-OAuth-Pending': value } : {}
}
