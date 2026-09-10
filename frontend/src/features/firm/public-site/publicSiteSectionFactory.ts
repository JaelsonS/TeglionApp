import type { PublicSiteSection, PublicSiteSectionType } from '@/shared/types/firmPublicSite'

const MAX_SECTIONS = 20

function generateStableId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}${random}`
}

/** Tipos que podem existir mais do que uma vez na página. */
export const DUPLICATABLE_SECTION_TYPES: PublicSiteSectionType[] = [
  'about',
  'services',
  'bookingServices',
  'features',
  'process',
  'faq',
]

/** Tipos seleccionáveis no «Adicionar secção». */
export const ADDABLE_SECTION_TYPES: PublicSiteSectionType[] = [
  'hero',
  'about',
  'services',
  'bookingServices',
  'features',
  'process',
  'faq',
  'contact',
  'footer',
]

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

export function createPublicSiteSection(
  type: PublicSiteSectionType,
  order: number,
): PublicSiteSection {
  return {
    key: generateStableId('sec_'),
    type,
    enabled: true,
    order,
    content: emptySectionContent(type),
  } as PublicSiteSection
}

/**
 * Adiciona ou reactiva uma secção.
 * - Se existir desactivada e o tipo não for duplicável → reactiva.
 * - Se já estiver activa e for duplicável → cria nova instância.
 * - Header é único e não aparece no selector (barra do topo).
 */
export function addOrEnablePublicSiteSection(
  sections: PublicSiteSection[],
  type: PublicSiteSectionType,
): { sections: PublicSiteSection[]; focusKey: string; created: boolean } | { error: string } {
  if (sections.length >= MAX_SECTIONS) {
    return { error: `Só é possível ter até ${MAX_SECTIONS} secções.` }
  }

  const existing = sections.filter((s) => s.type === type)
  const disabled = existing.find((s) => !s.enabled)
  const canDuplicate = DUPLICATABLE_SECTION_TYPES.includes(type)

  if (disabled && !canDuplicate) {
    const next = sections.map((s) => (s.key === disabled.key ? { ...s, enabled: true } : s))
    return { sections: next, focusKey: disabled.key, created: false }
  }

  if (existing.some((s) => s.enabled) && !canDuplicate) {
    const active = existing.find((s) => s.enabled)!
    return { sections, focusKey: active.key, created: false }
  }

  if (disabled && canDuplicate && existing.length === 1) {
    // Prefer reactivar a única instância desligada antes de duplicar.
    const next = sections.map((s) => (s.key === disabled.key ? { ...s, enabled: true } : s))
    return { sections: next, focusKey: disabled.key, created: false }
  }

  const maxOrder = sections.reduce((m, s) => Math.max(m, s.order), -1)
  const created = createPublicSiteSection(type, maxOrder + 1)
  return { sections: [...sections, created], focusKey: created.key, created: true }
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
