import { describe, expect, it } from 'vitest'

import { defaultPublicSiteNavLinks } from '@/features/public-intake/publicSiteNavLinks'

describe('defaultPublicSiteNavLinks', () => {
  it('fills Serviços, Áreas and Contactos when the header has no navLinks yet', () => {
    const links = defaultPublicSiteNavLinks({ showAreasMenu: false })
    expect(links.map((link) => link.label)).toEqual(['Serviços', 'Áreas', 'Contactos'])
    expect(links.find((link) => link.kind === 'areas')?.enabled).toBe(false)
  })

  it('keeps custom labels already saved', () => {
    const links = defaultPublicSiteNavLinks({
      navLinks: [
        { id: '1', label: 'O escritório', enabled: true, kind: 'section', sectionId: 'sobre' },
      ],
    })
    expect(links).toHaveLength(1)
    expect(links[0].label).toBe('O escritório')
  })
})
