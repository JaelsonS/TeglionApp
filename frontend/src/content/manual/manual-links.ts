/**
 * Allowlist de links internos no Manual público.
 * Qualquer href fora desta lista é rejeitado no render (defesa em profundidade).
 */
const ALLOWED_EXACT = new Set([
  '/',
  '/pricing',
  '/suporte',
  '/blog',
  '/case-studies',
  '/manual',
  '/termos',
  '/privacidade',
  '/cookies',
  '/dpa',
  '/aviso-legal',
  '/auth',
  '/auth/firm/login',
  '/auth/firm/register',
  '/auth/client/login',
  '/app/firm/dashboard',
  '/app/firm/clients',
  '/app/firm/payments',
  '/app/firm/rentals',
  '/app/firm/client-rentals',
  '/app/firm/saft',
  '/app/firm/documents',
  '/app/firm/tasks',
  '/app/firm/agenda',
  '/app/firm/fiscal-calendar',
  '/app/firm/alerts',
  '/app/firm/services',
  '/app/firm/irs',
  '/app/firm/settings',
  '/app/firm/billing',
  '/app/firm/ajuda',
  '/app/firm/calculators',
  '/app/firm/news',
  '/app/client',
  '/app/client/account',
  '/app/client/documents',
  '/app/client/messages',
])

const ALLOWED_PREFIXES = ['/manual/', '/blog/', '/app/firm/settings', '/app/firm/tasks/'] as const

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSafeManualSlug(slug: string | undefined | null): boolean {
  if (!slug || typeof slug !== 'string') return false
  if (slug.length > 80) return false
  return SLUG_RE.test(slug)
}

/**
 * Aceita apenas caminhos relativos allowlistados (sem scheme, sem //, sem ..).
 */
export function isAllowedManualInternalHref(href: string | undefined | null): boolean {
  if (!href || typeof href !== 'string') return false
  const h = href.trim()
  if (!h.startsWith('/')) return false
  if (h.startsWith('//')) return false
  if (h.includes('\\') || h.includes('..')) return false
  if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return false
  if (h.includes('?') || h.includes('#')) {
    const pathOnly = h.split(/[?#]/)[0]
    return isAllowedManualInternalHref(pathOnly)
  }
  if (ALLOWED_EXACT.has(h)) return true
  return ALLOWED_PREFIXES.some((p) => h.startsWith(p))
}
