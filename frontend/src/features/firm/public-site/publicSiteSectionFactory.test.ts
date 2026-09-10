import { describe, expect, it } from 'vitest'

import {
  addCustomCatalogSection,
  isRemovablePublicSiteSection,
  moveItemInArray,
  removePublicSiteSection,
  resolvePublicSiteSectionLabel,
} from './publicSiteSectionFactory'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'

const LABELS = {
  header: 'Barra do topo',
  hero: 'Destaque principal',
  about: 'Sobre o escritório',
  services: 'Consultorias com agendamento',
  bookingServices: 'Outros serviços',
  features: 'Diferenciais',
  process: 'Como funciona',
  faq: 'Perguntas frequentes',
  contact: 'Contactos',
  footer: 'Rodapé',
} as Record<PublicSiteSection['type'], string>

describe('publicSiteSectionFactory', () => {
  const base = (): PublicSiteSection[] => [
    { key: 'h', type: 'header', enabled: true, order: 0, content: {} },
    {
      key: 's',
      type: 'services',
      enabled: true,
      order: 1,
      content: { heading: 'Consultorias com agendamento', mode: 'auto' },
    },
  ]

  it('addCustomCatalogSection cria secção custom com título Secção N', () => {
    const result = addCustomCatalogSection(base())
    expect('error' in result).toBe(false)
    if ('error' in result) return
    const created = result.sections.find((s) => s.key === result.focusKey)
    expect(created?.custom).toBe(true)
    expect(created?.type).toBe('services')
    expect(created && 'heading' in created.content && created.content.heading).toBe('Secção 3')
  })

  it('modelo não é removível; custom é', () => {
    expect(isRemovablePublicSiteSection(base()[1])).toBe(false)
    expect(
      isRemovablePublicSiteSection({
        key: 'c',
        type: 'services',
        enabled: true,
        order: 2,
        custom: true,
        content: { heading: 'X', mode: 'auto' },
      }),
    ).toBe(true)
  })

  it('removePublicSiteSection só apaga custom', () => {
    const withCustom: PublicSiteSection[] = [
      ...base(),
      {
        key: 'c',
        type: 'services',
        enabled: true,
        order: 2,
        custom: true,
        content: { heading: 'Extra', mode: 'auto' },
      },
    ]
    const blocked = removePublicSiteSection(withCustom, 's')
    expect('error' in blocked).toBe(true)
    const ok = removePublicSiteSection(withCustom, 'c')
    expect('error' in ok).toBe(false)
    if ('error' in ok) return
    expect(ok.sections.map((s) => s.key)).toEqual(['h', 's'])
  })

  it('resolvePublicSiteSectionLabel usa heading nas custom', () => {
    expect(
      resolvePublicSiteSectionLabel(
        {
          key: 'c',
          type: 'services',
          enabled: true,
          order: 0,
          custom: true,
          content: { heading: 'Ofertas de Verão', mode: 'auto' },
        },
        LABELS,
        10,
      ),
    ).toBe('Ofertas de Verão')
    expect(
      resolvePublicSiteSectionLabel(
        { key: 's', type: 'services', enabled: true, order: 0, content: { heading: 'X', mode: 'auto' } },
        LABELS,
        3,
      ),
    ).toBe('Consultorias com agendamento')
  })

  it('moveItemInArray reorders', () => {
    expect(moveItemInArray(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })
})
