import type {
  PublicSiteChromeContent,
  PublicSiteNavLink,
  PublicSiteNavSectionId,
} from '@/shared/types/firmPublicSite'

export const MAX_PUBLIC_SITE_NAV_LINKS = 8

export const PUBLIC_SITE_SECTION_ANCHORS: { id: PublicSiteNavSectionId; label: string }[] = [
  { id: 'servicos', label: 'Serviços (rolar nesta página)' },
  { id: 'outros-servicos', label: 'Outros serviços (rolar nesta página)' },
  { id: 'contactos', label: 'Contactos (rolar nesta página)' },
  { id: 'sobre', label: 'Sobre (rolar nesta página)' },
  { id: 'faq', label: 'Perguntas frequentes (rolar nesta página)' },
  { id: 'como-trabalhamos', label: 'Como trabalhamos (rolar nesta página)' },
  { id: 'destaques', label: 'Destaques (rolar nesta página)' },
]

const SECTION_IDS = new Set(PUBLIC_SITE_SECTION_ANCHORS.map((item) => item.id))

export function isPublicSiteNavSectionId(value: string): value is PublicSiteNavSectionId {
  return SECTION_IDS.has(value as PublicSiteNavSectionId)
}

export function defaultPublicSiteNavLinks(content?: PublicSiteChromeContent | null): PublicSiteNavLink[] {
  if (Array.isArray(content?.navLinks) && content.navLinks.length > 0) {
    return content.navLinks
  }
  return [
    {
      id: 'nav_services',
      label: 'Serviços',
      enabled: content?.showServicesLink !== false,
      kind: 'section',
      sectionId: 'servicos',
    },
    {
      id: 'nav_areas',
      label: 'Áreas',
      enabled: content?.showAreasMenu !== false,
      kind: 'areas',
    },
    {
      id: 'nav_contact',
      label: 'Contactos',
      enabled: content?.showContactLink !== false,
      kind: 'section',
      sectionId: 'contactos',
    },
  ]
}

export function emptyPublicSiteNavLink(): PublicSiteNavLink {
  return {
    id: `nav_${Date.now().toString(36)}`,
    label: 'Novo link',
    enabled: true,
    kind: 'section',
    sectionId: 'servicos',
  }
}
