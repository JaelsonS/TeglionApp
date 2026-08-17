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
    case 'whatsapp':
      return socialLinks.whatsapp || '#contactos'
    case 'contact-form':
      return '#contactos'
    case 'external-url':
      return cta.target.url || '#'
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
    return Boolean(socialLinks.whatsapp)
  }
  if (cta.target.type === 'external-url') {
    return Boolean(cta.target.url)
  }
  return true
}
