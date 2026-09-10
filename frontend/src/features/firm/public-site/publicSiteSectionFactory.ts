import type { PublicSiteSection, PublicSiteSectionType } from '@/shared/types/firmPublicSite'

const MAX_SECTIONS = 20

function generateStableId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}${random}`
}

export function emptySectionContent(type: PublicSiteSectionType): PublicSiteSection['content'] {
  switch (type) {
    case 'header':
      return { title: '', backgroundColor: null, textColor: null }
    case 'hero':
      return { title: '', tagline: '', bio: '', imageIds: [], ctas: [] }
    case 'about':
      return { heading: '', body: '', imageIds: [], ctas: [] }
    case 'services':
      return { heading: 'Consultorias com agendamento', mode: 'auto', ctas: [] }
    case 'bookingServices':
      return { heading: 'Outros serviços', mode: 'auto', ctas: [] }
    case 'features':
      return { items: [] }
    case 'process':
      return { steps: [] }
    case 'faq':
      return { items: [] }
    case 'contact':
      return { showEmail: true, showPhone: true, showAddress: true, ctas: [] }
    case 'footer':
      return { backgroundColor: null, textColor: null, email: null, phone: null, address: null }
    default:
      return {}
  }
}

/**
 * Secção criada pela contabilista («Adicionar secção»).
 * Usa o editor de catálogo (cores, título, serviços, botões).
 * As 10 de modelo (`custom !== true`) não podem ser apagadas.
 */
export function createCustomCatalogSection(order: number, displayIndex: number): PublicSiteSection {
  return {
    key: generateStableId('sec_'),
    type: 'services',
    enabled: true,
    order,
    custom: true,
    content: {
      heading: `Secção ${displayIndex}`,
      mode: 'auto',
      ctas: [],
      backgroundColor: null,
      headingColor: null,
    },
  }
}

/**
 * Cria uma nova secção de catálogo editável (sem ecrã de escolher tipo).
 */
export function addCustomCatalogSection(
  sections: PublicSiteSection[],
): { sections: PublicSiteSection[]; focusKey: string } | { error: string } {
  if (sections.length >= MAX_SECTIONS) {
    return { error: `Só é possível ter até ${MAX_SECTIONS} secções.` }
  }
  const maxOrder = sections.reduce((m, s) => Math.max(m, s.order), -1)
  const displayIndex = sections.length + 1
  const created = createCustomCatalogSection(maxOrder + 1, displayIndex)
  return { sections: [...sections, created], focusKey: created.key }
}

export function isRemovablePublicSiteSection(section: PublicSiteSection): boolean {
  return section.custom === true
}

export function removePublicSiteSection(
  sections: PublicSiteSection[],
  key: string,
): { sections: PublicSiteSection[] } | { error: string } {
  const target = sections.find((s) => s.key === key)
  if (!target) return { error: 'Secção não encontrada.' }
  if (!isRemovablePublicSiteSection(target)) {
    return { error: 'As secções de modelo não podem ser apagadas — pode desactivá-las.' }
  }
  return { sections: sections.filter((s) => s.key !== key) }
}

/** Rótulo na lista: título editado nas personalizadas; nome do modelo nas restantes. */
export function resolvePublicSiteSectionLabel(
  section: PublicSiteSection,
  modelLabels: Record<PublicSiteSection['type'], string>,
  index: number,
): string {
  if (section.custom) {
    const heading =
      'heading' in section.content ? String(section.content.heading || '').trim() : ''
    return heading || `Secção ${index + 1}`
  }
  return modelLabels[section.type]
}

export function moveItemInArray<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }
  if (fromIndex === toIndex) return items
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}
