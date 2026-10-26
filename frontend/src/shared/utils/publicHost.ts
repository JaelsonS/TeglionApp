/**
 * Resolução de página pública por subdomínio.
 *
 * Staging (activo): `{slug}.staging.teglion.com`
 * Produção (ainda path): `teglion.com/{slug}` — activar subdomain só após DNS+SSL+UAT.
 */

const RESERVED_SUBDOMAIN_LABELS = new Set([
  'www',
  'app',
  'api',
  'staging',
  'cdn',
  'mail',
  'email',
  'static',
  'assets',
  'admin',
  'status',
  'docs',
  'blog',
  'auth',
  'manual',
])

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

export function isValidPublicSlug(slug: string): boolean {
  const s = String(slug || '').toLowerCase().trim()
  if (!s || s.length < 2) return false
  if (RESERVED_SUBDOMAIN_LABELS.has(s)) return false
  return SLUG_RE.test(s)
}

export function getHostname(hostname?: string): string {
  if (hostname) return String(hostname).toLowerCase()
  if (typeof window !== 'undefined') return String(window.location.hostname || '').toLowerCase()
  return ''
}

/** true em staging.teglion.com ou *.staging.teglion.com */
export function isStagingPublicHost(hostname?: string): boolean {
  const host = getHostname(hostname)
  return (
    host === 'staging.teglion.com' ||
    host === 'www.staging.teglion.com' ||
    host.endsWith('.staging.teglion.com')
  )
}

/**
 * Extrai slug de `{slug}.staging.teglion.com`.
 * Produção `*.teglion.com` ainda não activo (fase seguinte).
 */
export function getPublicSubdomainSlug(hostname?: string): string | null {
  const host = getHostname(hostname)
  if (!host) return null

  const stagingSuffix = '.staging.teglion.com'
  if (host.endsWith(stagingSuffix)) {
    const label = host.slice(0, -stagingSuffix.length)
    if (!label || label.includes('.')) return null
    if (!isValidPublicSlug(label)) return null
    return label
  }

  return null
}

/** Apex onde o path `/{slug}` deve redireccionar para subdomínio (só staging). */
export function isPublicPathRedirectHost(hostname?: string): boolean {
  const host = getHostname(hostname)
  return host === 'staging.teglion.com' || host === 'www.staging.teglion.com'
}

/**
 * URL canónica pública do escritório.
 * Staging → subdomínio; produção → path (até activarmos wildcard prod).
 */
export function buildFirmPublicUrl(firmSlug: string, hostname?: string): string | null {
  const slug = String(firmSlug || '').trim().toLowerCase()
  if (!isValidPublicSlug(slug)) return null

  const host = getHostname(hostname)
  if (isStagingPublicHost(host)) {
    return `https://${encodeURIComponent(slug)}.staging.teglion.com`
  }
  return `https://teglion.com/${encodeURIComponent(slug)}`
}

/** Path relativo correcto no host actual (subdomínio vs path). */
export function publicSitePath(firmSlug: string, ...segments: string[]): string {
  const slug = String(firmSlug || '').trim()
  const rest = segments
    .filter(Boolean)
    .map((s) => encodeURIComponent(String(s).replace(/^\/+|\/+$/g, '')))
    .join('/')
  const onOwnSubdomain = getPublicSubdomainSlug() === slug.toLowerCase()
  if (onOwnSubdomain) return rest ? `/${rest}` : '/'
  const base = `/${encodeURIComponent(slug)}`
  return rest ? `${base}/${rest}` : base
}
