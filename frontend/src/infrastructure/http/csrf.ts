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

export async function ensureCsrfToken(refreshApi: AxiosInstance): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE_NAME) || csrfTokenMemory
  if (existing) return existing

  if (!csrfRefreshPromise) {
    csrfRefreshPromise = refreshApi
      .get('/csrf')
      .then((response) => {
        const token = response?.data?.token || readCookie(CSRF_COOKIE_NAME) || null
        if (token) csrfTokenMemory = token
        return token
      })
      .catch(() => readCookie(CSRF_COOKIE_NAME) || csrfTokenMemory)
      .finally(() => {
        if (csrfTokenMemory || readCookie(CSRF_COOKIE_NAME)) {
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
