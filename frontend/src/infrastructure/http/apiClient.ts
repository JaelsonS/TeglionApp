import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

import i18n from '@/i18n'
import {
  broadcastAuthLogout,
  coordinatedAuthRefresh,
} from '@/shared/utils/authRefreshCoordinator'
import { logger } from '@/shared/utils/logger'
import { getRateLimitBackoffMs, pauseQueriesAfterRateLimit } from '@/shared/utils/rate-limit-backoff'

import {
  API_BASE_URL,
  applyActiveApiBase,
  getApiBaseUrl,
  getApiBaseUrlCandidates,
  normalizeApiBase,
} from './apiBase'
import { CSRF_HEADER_NAME, ensureCsrfToken } from './csrf'

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
})

export const refreshApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
})

refreshApi.interceptors.request.use((config) => {
  config.headers = config.headers ?? {}
  config.headers['X-Requested-With'] = 'XMLHttpRequest'
  return config
})

export function getApiBaseUrlResolved(): string {
  const raw =
    api.defaults.baseURL && String(api.defaults.baseURL).length > 0 ? String(api.defaults.baseURL) : API_BASE_URL
  return normalizeApiBase(raw)
}

export function getApiUploadsRoot(): string {
  return getApiBaseUrlResolved().replace(/\/api$/, '')
}

/**
 * Full-page OAuth (Google SSO / Calendar) must hit the Render host directly on staging:
 * callback cookies live on `*.onrender.com`, not on the Vercel rewrite host.
 * XHR/fetch uses same-origin `/api` via apiBase (first-party cookies).
 */
const STAGING_API_BASE = 'https://teglion-api-staging.onrender.com/api'
const PROD_SAME_ORIGIN_HOSTS = ['teglion.com', 'www.teglion.com', 'app.teglion.com']

function isStagingFrontendHost(host: string): boolean {
  if (!host) return false
  if (host === 'staging.teglion.com' || host === 'www.staging.teglion.com') return true
  return host.endsWith('.vercel.app') && host.includes('staging')
}

/** Base URL for full-page navigations (Google OAuth / Calendar). */
function resolveNavigationApiBase(): string {
  const isBrowser = typeof window !== 'undefined'
  const host = isBrowser ? String(window.location.hostname || '').toLowerCase() : ''
  if (isStagingFrontendHost(host)) return STAGING_API_BASE
  if (PROD_SAME_ORIGIN_HOSTS.includes(host)) return `${window.location.origin}/api`
  return getApiBaseUrlResolved()
}

export function getGoogleAuthStartUrl(options?: { intent?: 'login' | 'register'; countryCode?: string }): string {
  const base = resolveNavigationApiBase().replace(/\/$/, '')
  const params = new URLSearchParams()
  if (options?.intent === 'register') params.set('intent', 'register')
  if (options?.countryCode) params.set('countryCode', options.countryCode)
  const qs = params.toString()
  return `${base}/auth/google${qs ? `?${qs}` : ''}`
}

/** URL de navegação de página inteira (não XHR) para ligar o Google Calendar — mesma
 * resolução de origem que getGoogleAuthStartUrl(), rota autenticada (Fase Ha). */
export function getGoogleCalendarConnectUrl(): string {
  const base = resolveNavigationApiBase().replace(/\/$/, '')
  return `${base}/contabil/integrations/google-calendar/connect`
}

export function toPublicAssetUrl(path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('firm/')) return null
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getApiUploadsRoot()}${normalized}`
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/register-firm') ||
    url.includes('/auth/register-firm-google') ||
    url.includes('/contabil/auth/register-firm') ||
    url.includes('/auth/register-admin') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/reset') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/recover') ||
    url.includes('/auth/validate-reset-token') ||
    url.includes('/auth/validate-password')
  )
}

function isDocumentEndpoint(url?: string): boolean {
  if (!url) return false
  return url.includes('/documents/') || url.includes('/documents?')
}

function isPublicTokenEndpoint(url?: string): boolean {
  if (!url) return false
  return (
    url.includes('/public/confirmations/') ||
    url.includes('/public/satisfaction/') ||
    url.includes('/public/referrals/')
  )
}

const TOKEN_INVALID_WITH_ACCENT = String.fromCharCode(116, 111, 107, 101, 110, 32, 105, 110, 118, 225, 108, 105, 100, 111)

function isTokenInvalidError(error: AxiosError | unknown): boolean {
  const err = error as AxiosError<{ message?: string }>
  const message = String(err?.response?.data?.message || err?.message || '').toLowerCase()
  return (
    message.includes(TOKEN_INVALID_WITH_ACCENT) ||
    message.includes('token invalido') ||
    message.includes('token expired') ||
    message.includes('invalid token') ||
    message.includes('expirado')
  )
}

let isRefreshing = false
let refreshQueue: Array<(success: boolean) => void> = []
let refreshFailedAt: number | null = null

async function postAuthRefresh(): Promise<void> {
  const csrfToken = await ensureCsrfToken(refreshApi)
  await refreshApi.post('/auth/refresh', null, {
    headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
  })
}

export async function refreshAccessToken(): Promise<boolean> {
  return coordinatedAuthRefresh(postAuthRefresh)
}

function translateError(key: string, fallback: string): string {
  const value = i18n.t(key, { defaultValue: fallback })
  if (typeof value !== 'string') return fallback
  if (!value.trim()) return fallback
  if (value === key) return fallback
  return value
}

function enqueueRefresh(cb: (success: boolean) => void) {
  refreshQueue.push(cb)
}

function flushQueue(success: boolean) {
  refreshQueue.forEach((cb) => cb(success))
  refreshQueue = []
}

type ApiRequestWithFallback = AxiosRequestConfig & {
  _retry?: boolean
  __apiFallbackAttempts?: number
}

function shouldTryApiHostFallback(error: AxiosError): boolean {
  const status = error.response?.status
  if (status === 502 || status === 503 || status === 504) return true
  if (status === 408) return true
  if (status === 429) return false
  if (!error.response) {
    const code = String((error as AxiosError & { code?: string }).code || '')
    return (
      code === 'ERR_NETWORK' ||
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN'
    )
  }
  return false
}

api.interceptors.request.use(async (config) => {
  const method = String(config.method || 'get').toLowerCase()
  config.headers = config.headers ?? {}
  const activeLocale = i18n.language || 'pt-PT'

  config.headers['Accept-Language'] = activeLocale
  config.headers['X-User-Language'] = activeLocale

  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrfToken = await ensureCsrfToken(refreshApi)
    if (csrfToken) {
      config.headers[CSRF_HEADER_NAME] = csrfToken
    }
  }

  config.headers['X-Requested-With'] = 'XMLHttpRequest'
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ApiRequestWithFallback | undefined

    if (originalRequest && originalRequest.url && !/^https?:\/\//i.test(originalRequest.url)) {
      const candidates = getApiBaseUrlCandidates()
      if (candidates.length > 1 && shouldTryApiHostFallback(error)) {
        const attempts =
          typeof originalRequest.__apiFallbackAttempts === 'number' ? originalRequest.__apiFallbackAttempts : 0
        const nextIdx = attempts + 1
        if (nextIdx < candidates.length) {
          const nextBase = candidates[nextIdx]
          const prevBase = attempts < 0 ? candidates[0] : candidates[attempts]
          logger.info('[API] Fallback de host da API', {
            from: prevBase,
            to: nextBase,
            code: (error as AxiosError & { code?: string }).code,
            status: error.response?.status,
          })
          originalRequest.__apiFallbackAttempts = nextIdx
          originalRequest.baseURL = nextBase
          applyActiveApiBase(nextBase, api, refreshApi)
          return api.request(originalRequest)
        }
      }
    }

    if (!error.response) {
      ; (error as AxiosError & { __friendlyMessage?: string }).__friendlyMessage = translateError(
        'common.errors.serverUnavailable',
        'common.errors.serverUnavailable',
      )
      return Promise.reject(error)
    }

    const status = error.response?.status

    if (!originalRequest) {
      return Promise.reject(error)
    }

    if (isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error)
    }

    if (status === 401 && isDocumentEndpoint(originalRequest.url)) {
      return Promise.reject(error)
    }

    if (isPublicTokenEndpoint(originalRequest.url)) {
      return Promise.reject(error)
    }

    if (status === 429) {
      pauseQueriesAfterRateLimit(getRateLimitBackoffMs(error, 90_000))
      return Promise.reject(error)
    }

    if (status === 403 || status === 404) {
      ; (error as AxiosError & { __friendlyMessage?: string }).__friendlyMessage =
        status === 404
          ? translateError('common.errors.noRecords', 'common.errors.noRecords')
          : translateError('common.errors.forbidden', 'common.errors.forbidden')
      return Promise.reject(error)
    }

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (refreshFailedAt && Date.now() - refreshFailedAt < 5 * 60 * 1000) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        enqueueRefresh((success) => {
          if (!success) {
            return reject(error)
          }
          resolve(api(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      const refreshed = await refreshAccessToken()
      flushQueue(refreshed)
      refreshFailedAt = null
      return api(originalRequest)
    } catch (refreshError) {
      flushQueue(false)
      refreshFailedAt = Date.now()
      if (isTokenInvalidError(refreshError)) {
        try {
          window.dispatchEvent(new CustomEvent('auth:session-expired'))
        } catch {
          // noop
        }
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export { getApiBaseUrl, getApiBaseUrlCandidates, normalizeApiBase, API_BASE_URL }
