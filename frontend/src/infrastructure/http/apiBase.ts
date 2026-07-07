const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
export const API_BASE_STORAGE_KEY = 'contabil.apiBaseUrl'

export function allowApiBaseFromQuery(): boolean {
  if (import.meta.env.DEV) return true
  return String(import.meta.env.VITE_ALLOW_API_BASE_QUERY || '').toLowerCase() === 'true'
}

export function normalizeApiBase(value: string): string {
  let v = String(value || '').trim().replace(/\/$/, '')
  if (!v) return v
  if (v.startsWith('/')) return v
  if (!/^https?:\/\//i.test(v)) {
    const hostPart = (v.split('/')[0] || '').split(':')[0]
    const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostPart)
    v = `${isLocal ? 'http://' : 'https://'}${v.replace(/^\/+/, '')}`
  }
  v = v.replace(/\/$/, '')
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v)
      const path = u.pathname.replace(/\/$/, '')
      if (!path || path === '/') {
        u.pathname = '/api'
        v = u.toString().replace(/\/$/, '')
      }
    } catch {
      // noop
    }
  }
  return v
}

function parseApiBaseList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => normalizeApiBase(s))
    .filter(Boolean)
}

function dedupeBases(list: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const u of list) {
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

export function getApiBaseUrlCandidates(): string[] {
  if (import.meta.env.DEV) {
    return ['/api']
  }

  if (typeof window !== 'undefined' && allowApiBaseFromQuery()) {
    const queryApiBase = new URLSearchParams(window.location.search).get('apiBase')
    if (queryApiBase && /^https?:\/\//i.test(queryApiBase)) {
      return [normalizeApiBase(queryApiBase)]
    }
  }

  const fromEnvRaw = import.meta.env.VITE_API_BASE_URL
  const fromEnv = typeof fromEnvRaw === 'string' ? fromEnvRaw.trim() : ''
  const extraFallbackRaw = import.meta.env.VITE_API_BASE_URL_FALLBACK
  const extraFallback = typeof extraFallbackRaw === 'string' ? normalizeApiBase(extraFallbackRaw) : ''

  const defaultNorm = normalizeApiBase(DEFAULT_API_BASE_URL)
  let list: string[] = []

  if (fromEnv) {
    list = fromEnv.includes(',') ? parseApiBaseList(fromEnv) : [normalizeApiBase(fromEnv)]
    if (extraFallback && !list.includes(extraFallback)) {
      list.push(extraFallback)
    }
  } else {
    list = [defaultNorm]
  }

  list = dedupeBases(list)

  const primary = list[0] || ''
  const sameOriginApi = primary.startsWith('/')
  if (sameOriginApi) {
    list = [primary]
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let rawSaved = window.sessionStorage.getItem(API_BASE_STORAGE_KEY) || ''
      if (sameOriginApi && rawSaved && /^https?:\/\//i.test(rawSaved)) {
        try {
          window.sessionStorage.removeItem(API_BASE_STORAGE_KEY)
        } catch {
          // noop
        }
        rawSaved = ''
      }
      if (rawSaved && rawSaved.includes('/api/api')) {
        try {
          window.sessionStorage.removeItem(API_BASE_STORAGE_KEY)
        } catch {
          // noop
        }
        rawSaved = ''
      }
      if (rawSaved && /^https?:\/\//i.test(rawSaved) && !rawSaved.replace(/\/$/, '').endsWith('/api')) {
        try {
          window.sessionStorage.removeItem(API_BASE_STORAGE_KEY)
        } catch {
          // noop
        }
        rawSaved = ''
      }
      const saved = normalizeApiBase(rawSaved)
      if (saved && list.includes(saved)) {
        list = [saved, ...list.filter((u) => u !== saved)]
      }
    }
  } catch {
    // private mode / storage bloqueado
  }

  return list
}

export function getApiBaseUrl(): string {
  const list = getApiBaseUrlCandidates()
  return list[0] || normalizeApiBase(DEFAULT_API_BASE_URL)
}

export const API_BASE_URL = getApiBaseUrl()

export function persistPreferredApiBase(url: string) {
  try {
    window.sessionStorage?.setItem(API_BASE_STORAGE_KEY, normalizeApiBase(url))
  } catch {
    // noop
  }
}

export function applyActiveApiBase(url: string, api: { defaults: { baseURL?: string } }, refreshApi: { defaults: { baseURL?: string } }) {
  const u = normalizeApiBase(url)
  api.defaults.baseURL = u
  refreshApi.defaults.baseURL = u
  persistPreferredApiBase(u)
}
