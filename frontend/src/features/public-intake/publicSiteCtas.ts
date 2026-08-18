import type { PublicSiteCta, PublicSiteSocialLinks } from '@/shared/types/firmPublicSite'

export type PublicCtaRenderContext = {
  firmSlug: string
  services: Array<{ slug: string }>
  contact: { phone: string | null }
  openInternalLinksInNewTab?: boolean
}

export function ctaTelHref(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, '')
  return compact ? `tel:${compact}` : '#'
}

export function ctaWhatsAppHref(phone: string): string | null {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return null
  return `https://wa.me/${digits}`
}

/** Rejeita javascript:/data: e força https para o preview coincidir com o backend. */
export function coerceExternalHttpsUrl(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed || /[\s<>]/.test(trimmed)) return null
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return null

  let candidate = trimmed
  if (/^https:\/\//i.test(trimmed)) candidate = trimmed
  else if (/^http:\/\//i.test(trimmed)) candidate = `https://${trimmed.slice('http://'.length)}`
  else if (/^\/\//.test(trimmed)) candidate = `https:${trimmed}`
  else if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) candidate = `https://${trimmed}`
  else return null

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'https:') return null
    if (!parsed.hostname) return null
    if (parsed.username || parsed.password) return null
    return candidate.slice(0, 500)
  } catch {
    return null
  }
}

export function resolvePublicCtaHref(
  cta: PublicSiteCta,
  ctx: PublicCtaRenderContext,
  socialLinks: Partial<PublicSiteSocialLinks>,
): string {
  switch (cta.target.type) {
    case 'booking':
    case 'service-detail':
      return cta.target.serviceId
        ? `/${encodeURIComponent(ctx.firmSlug)}/servicos/${encodeURIComponent(cta.target.serviceId)}`
        : '#servicos'
    case 'whatsapp': {
      const fromButton = ctaWhatsAppHref(cta.target.phone || '')
      if (fromButton) return fromButton
      return socialLinks.whatsapp || '#contactos'
    }
    case 'contact-form':
      return '#contactos'
    case 'external-url':
      return coerceExternalHttpsUrl(cta.target.url) || '#'
    case 'phone': {
      const phone = String(cta.target.phone || ctx.contact.phone || '').trim()
      return phone ? ctaTelHref(phone) : '#'
    }
    default:
      return '#'
  }
}

export function isPublicCtaRenderable(
  cta: PublicSiteCta,
  ctx: PublicCtaRenderContext,
  socialLinks: Partial<PublicSiteSocialLinks>,
): boolean {
  if (!cta?.label) return false
  const publicSlugs = new Set(ctx.services.map((s) => s.slug).filter(Boolean))
  if (cta.target.type === 'service-detail') {
    const slug = cta.target.serviceId
    return Boolean(slug) && publicSlugs.has(String(slug))
  }
  if (cta.target.type === 'booking' && cta.target.serviceId) {
    return publicSlugs.has(cta.target.serviceId)
  }
  if (cta.target.type === 'phone') {
    return Boolean(String(cta.target.phone || ctx.contact.phone || '').trim())
  }
  if (cta.target.type === 'whatsapp') {
    return Boolean(ctaWhatsAppHref(cta.target.phone || '') || socialLinks.whatsapp)
  }
  if (cta.target.type === 'external-url') {
    return Boolean(coerceExternalHttpsUrl(cta.target.url))
  }
  return true
}
