import { describe, expect, it } from 'vitest'

import { resolvePublicSiteContact } from './publicSiteContactResolve'

describe('resolvePublicSiteContact', () => {
  const firm = {
    email: 'escritorio@firma.pt',
    phone: '+351 210 000 000',
    address: 'Rua do Escritório, Lisboa',
  }

  it('usa dados do escritório quando rodapé vazio', () => {
    expect(resolvePublicSiteContact(firm, {})).toEqual(firm)
    expect(resolvePublicSiteContact(firm, null)).toEqual(firm)
  })

  it('substitui só campos preenchidos no rodapé', () => {
    expect(
      resolvePublicSiteContact(firm, {
        email: 'contacto@pagina.pt',
        phone: null,
        address: '',
      }),
    ).toEqual({
      email: 'contacto@pagina.pt',
      phone: firm.phone,
      address: firm.address,
    })
  })

  it('usa só rodapé quando todos os campos estão definidos', () => {
    expect(
      resolvePublicSiteContact(firm, {
        email: 'a@b.pt',
        phone: '+351 900 000 000',
        address: 'Porto',
      }),
    ).toEqual({
      email: 'a@b.pt',
      phone: '+351 900 000 000',
      address: 'Porto',
    })
  })
})
