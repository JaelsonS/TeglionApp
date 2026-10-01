import {
  findEnabledFooterContent,
  resolvePublicSiteContact,
  type PublicSiteContactFields,
} from '@/features/public-intake/publicSiteContactResolve'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import type { PublicSiteConfig, PublicSiteHeroContent, PublicSiteSection } from '@/shared/types/firmPublicSite'

export type PublicSitePublishReadinessId = 'slug' | 'hero' | 'publicServices' | 'contact'

export type PublicSitePublishReadinessFocus =
  | { kind: 'identity' }
  | { kind: 'section'; sectionKey: string }
  | { kind: 'servicesCatalog' }

export type PublicSitePublishReadinessItem = {
  id: PublicSitePublishReadinessId
  label: string
  ok: boolean
  detail: string
  focus: PublicSitePublishReadinessFocus
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/

export function isPublicSiteSlugReady(slug: string): boolean {
  const trimmed = String(slug || '').trim()
  return trimmed.length >= 2 && SLUG_RE.test(trimmed)
}

function findFirstSectionKey(sections: PublicSiteSection[], type: PublicSiteSection['type']): string | null {
  const match = sections.find((s) => s.type === type && s.enabled)
  return match?.key ?? sections.find((s) => s.type === type)?.key ?? null
}

function isHeroReady(sections: PublicSiteSection[], images: PublicSiteConfig['images']): boolean {
  const hero = sections.find((s) => s.type === 'hero' && s.enabled)
  if (!hero || hero.type !== 'hero') return false
  const content = hero.content as PublicSiteHeroContent
  const hasText = [content.title, content.tagline, content.bio].some((v) => String(v || '').trim())
  const heroImageId = content.imageIds?.[0]
  const hasImage =
    Boolean(heroImageId) &&
    (images.hero.some((img) => img.id === heroImageId) ||
      Boolean(images.bySection?.[hero.key]?.some((img) => img.id === heroImageId)))
  return hasText || hasImage
}

/** API pública do site só devolve serviços já publicados (slug + listagem). */
function countPublicListedServices(services: PublicFirmServiceSummary[]): number {
  return services.filter((s) => String(s.slug || '').trim()).length
}

/** Espelha o que o visitante vê em Contactos ou no Rodapé (herdando Escritório). */
export function isPublicSiteContactVisible(
  config: PublicSiteConfig,
  firmContact: PublicSiteContactFields,
): boolean {
  const footerContent = findEnabledFooterContent(config)
  const resolved = resolvePublicSiteContact(firmContact, footerContent)
  const contactEnabled = config.sections.some((s) => s.type === 'contact' && s.enabled)
  const contactSection = config.sections.find((s) => s.type === 'contact' && s.enabled)

  if (contactSection?.type === 'contact') {
    const c = contactSection.content
    if ((c.ctas?.length ?? 0) > 0) return true
    if (c.showEmail && resolved.email) return true
    if (c.showPhone && resolved.phone) return true
    if (c.showAddress && resolved.address) return true
  }

  const footerEnabled = config.sections.some((s) => s.type === 'footer' && s.enabled)
  if (footerEnabled && !contactEnabled) {
    return Boolean(resolved.email || resolved.phone || resolved.address)
  }

  return false
}

export function evaluatePublicSitePublishReadiness(input: {
  firmSlug: string
  config: PublicSiteConfig
  services: PublicFirmServiceSummary[]
  firmContact: PublicSiteContactFields
}): PublicSitePublishReadinessItem[] {
  const { firmSlug, config, services, firmContact } = input
  const sections = config.sections || []
  const slugOk = isPublicSiteSlugReady(firmSlug)
  const heroOk = isHeroReady(sections, config.images)
  const publicCount = countPublicListedServices(services)
  const servicesOk = publicCount >= 1
  const contactOk = isPublicSiteContactVisible(config, firmContact)

  const heroKey = findFirstSectionKey(sections, 'hero')
  const servicesKey =
    findFirstSectionKey(sections, 'services') ?? findFirstSectionKey(sections, 'bookingServices')
  const contactKey =
    findFirstSectionKey(sections, 'contact') ?? findFirstSectionKey(sections, 'footer')

  return [
    {
      id: 'slug',
      label: 'Link público',
      ok: slugOk,
      detail: slugOk ? `teglion.com/${firmSlug.trim()}` : 'Defina e guarde um slug válido (mín. 2 caracteres).',
      focus: { kind: 'identity' },
    },
    {
      id: 'hero',
      label: 'Destaque principal',
      ok: heroOk,
      detail: heroOk
        ? 'Texto ou imagem de fundo configurados.'
        : 'Adicione título, frase, texto ou imagem de fundo.',
      focus: heroKey ? { kind: 'section', sectionKey: heroKey } : { kind: 'identity' },
    },
    {
      id: 'publicServices',
      label: 'Serviços no site',
      ok: servicesOk,
      detail: servicesOk
        ? `${publicCount} serviço(s) com «Aparece na página pública».`
        : 'Marque pelo menos um serviço no Catálogo ou IRS.',
      focus: servicesOk && servicesKey
        ? { kind: 'section', sectionKey: servicesKey }
        : { kind: 'servicesCatalog' },
    },
    {
      id: 'contact',
      label: 'Contactos e redes visíveis',
      ok: contactOk,
      detail: contactOk
        ? 'Contactos na secção Contactos e redes ou no rodapé (se essa secção estiver off).'
        : 'Active Contactos e redes ou mostre email, telefone ou morada no rodapé.',
      focus: contactKey ? { kind: 'section', sectionKey: contactKey } : { kind: 'identity' },
    },
  ]
}

export function publicSiteSectionCardDomId(sectionKey: string): string {
  return `public-site-section-${sectionKey}`
}
