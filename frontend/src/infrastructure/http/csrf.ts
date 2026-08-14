import type { AxiosInstance } from 'axios'

export const CSRF_COOKIE_NAME = 'csrfToken'
export const CSRF_HEADER_NAME = 'X-CSRF-Token'

let csrfTokenMemory: string | null = null
let csrfRefreshPromise: Promise<string | null> | null = null

export function clearClientCsrfCache(): void {
  csrfTokenMemory = null
  csrfRefreshPromise = null
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

/**
 * When the API is on another host (staging.teglion.com → *.onrender.com),
 * document.cookie may still expose a prod csrfToken (Domain=.teglion.com).
 * That value must NEVER be sent as X-CSRF-Token to the staging API — it causes
 * CSRF_INVALID (header ≠ API cookie).
 */
function isCrossOriginApiBase(api: AxiosInstance): boolean {
  if (typeof window === 'undefined') return false
  const base = String(api.defaults.baseURL || '').trim()
  if (!base || base.startsWith('/')) return false
  try {
    return new URL(base).hostname.toLowerCase() !== String(window.location.hostname || '').toLowerCase()
  } catch {
    return true
  }
}

export async function ensureCsrfToken(refreshApi: AxiosInstance): Promise<string | null> {
  const crossOrigin = isCrossOriginApiBase(refreshApi)
  // Same-origin (/api rewrite): page cookie is authoritative.
  // Cross-origin: only trust in-memory token from this API's /csrf JSON body.
  const existing = crossOrigin ? csrfTokenMemory : readCookie(CSRF_COOKIE_NAME) || csrfTokenMemory
  if (existing) return existing

  if (!csrfRefreshPromise) {
    csrfRefreshPromise = refreshApi
      .get('/csrf')
      .then((response) => {
        const token = response?.data?.token || (!crossOrigin ? readCookie(CSRF_COOKIE_NAME) : null) || null
        if (token) csrfTokenMemory = token
        return token
      })
      .catch(() => csrfTokenMemory || (!crossOrigin ? readCookie(CSRF_COOKIE_NAME) : null))
      .finally(() => {
        if (csrfTokenMemory || (!crossOrigin && readCookie(CSRF_COOKIE_NAME))) {
          csrfRefreshPromise = null
        }
      })
  }

  return csrfRefreshPromise
}

export async function prefetchAuthCsrf(refreshApi: AxiosInstance): Promise<void> {
  await ensureCsrfToken(refreshApi)
}

export async function warmupAuthApi(refreshApi: AxiosInstance): Promise<void> {
  await refreshApi.get('/public/health', { timeout: 20_000 })
}
