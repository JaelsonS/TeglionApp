/**
 * Resolve backend API base URL.
 *
 * Critical isolation rule:
 * - teglion.com / www → same-origin `/api` (Vercel rewrite → Render prod)
 * - staging.teglion.com → ALWAYS Render staging API (never `/api` rewrite to prod)
 */
export const API_BASE_STORAGE_KEY = 'contabil.apiBaseUrl'

const STAGING_API_BASE = 'https://teglion-api-staging.onrender.com/api'
const PROD_SAME_ORIGIN_API = '/api'

function getHostname(): string {
  if (typeof window === 'undefined') return ''
  return String(window.location.hostname || '').toLowerCase()
}

/** Production marketing / app hosts — use Vercel `/api` rewrite to prod API. */
function isProductionFrontendHost(hostname: string): boolean {
  return hostname === 'teglion.com' || hostname === 'www.teglion.com'
}

/**
 * Staging hosts must never use relative `/api` because `vercel.json` rewrites
 * `/api` to production Render (`teglionapp.onrender.com`).
 */
function isStagingFrontendHost(hostname: string): boolean {
  if (!hostname) return false
  if (hostname === 'staging.teglion.com') return true
  if (hostname === 'www.staging.teglion.com') return true
  // Vercel preview URLs for the staging project / branch (safety net)
  if (hostname.endsWith('.vercel.app') && hostname.includes('staging')) return true
  return false
}

function shouldForceSameOriginApi(): boolean {
  return isProductionFrontendHost(getHostname())
}

function shouldForceStagingApi(): boolean {
  return isStagingFrontendHost(getHostname())
}

function normalizeApiBase(value: string | null | undefined): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  // Keep relative bases (e.g. "/api") for same-origin proxy setups (Vercel rewrites).
  if (raw.startsWith('/')) return raw.replace(/\/+$/, '') || '/'
  try {
    // Prefer absolute URLs.
    // eslint-disable-next-line no-new
    new URL(raw)
    return raw.replace(/\/+$/, '')
  } catch {
    return null
  }
}

function uniqueNonEmpty(list: Array<string | null | undefined>): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of list) {
    const v = String(item || '').trim()
    if (!v) continue
    if (seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}

/**
 * Returns candidate API bases in priority order.
 * Callers can try the next candidate when the current one fails (e.g. CORS / network).
 */
export function getApiBaseUrlCandidates(): string[] {
  // Soft override: useful for debugging without rebuilding.
  // Example: localStorage.setItem('contabil.apiBaseUrl', 'http://localhost:3001/api')
  let override: string | null = null
  try {
    override = normalizeApiBase(localStorage.getItem(API_BASE_STORAGE_KEY))
  } catch {
    // ignore
  }

  // Hard lock: staging host can NEVER talk to prod via `/api` rewrite.
  if (shouldForceStagingApi()) {
    return uniqueNonEmpty([override, STAGING_API_BASE])
  }

  // Soft lock: on production domain, always use same-origin `/api` (Vercel rewrite → Render).
  // This prevents "stuck" overrides (localStorage / old builds) from pointing the live site to localhost.
  if (shouldForceSameOriginApi()) {
    return [PROD_SAME_ORIGIN_API]
  }

  // Soft override via querystring (useful for debugging):
  // https://app/?apiBase=https://xxx.onrender.com/api
  let queryOverride: string | null = null
  try {
    const queryApiBase = new URLSearchParams(window.location.search).get('apiBase')
    queryOverride = normalizeApiBase(queryApiBase)
  } catch {
    // ignore
  }

  const envBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL as any)

  // Prefer relative "/api" in production builds when env is missing.
  // This works well with Vercel rewrites (vercel.json) and avoids CORS.
  const preferredProdBase = import.meta.env.PROD ? PROD_SAME_ORIGIN_API : null

  // Dev fallback: Vite proxy (`frontend/vite.config.ts` proxies `/api` → localhost:3001).
  // Prefer relative `/api` to avoid CORS + "Backend offline" false negatives.
  const preferredDevBase = import.meta.env.DEV ? PROD_SAME_ORIGIN_API : null

  // Last-resort absolute fallback (useful when opening the built files without a reverse proxy).
  // Keep it at the end so we don't cause CORS failures when a proxy is available.
  // Use 127.0.0.1 (not localhost) to avoid IPv6 (::1) mismatches when the backend listens on IPv4 only.
  const lastResortDevBase = import.meta.env.DEV ? 'http://127.0.0.1:3001/api' : null

  return uniqueNonEmpty([
    override,
    queryOverride,
    envBase,
    preferredProdBase,
    preferredDevBase,
    lastResortDevBase,
  ])
}

export function getApiBaseUrl(): string {
  const list = getApiBaseUrlCandidates()
  return list[0] || (import.meta.env.DEV ? 'http://127.0.0.1:3001/api' : PROD_SAME_ORIGIN_API)
}

export const API_BASE_URL = getApiBaseUrl()
