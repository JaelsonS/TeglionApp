import { describe, expect, it } from 'vitest'

import { clientNavLabelForPath, isClientNavItemActive, CLIENT_NAV_PRIMARY } from './clientPortalNav'

describe('clientPortalNav', () => {
  it('marks Início only on the exact home path', () => {
    const home = CLIENT_NAV_PRIMARY[0]
    expect(isClientNavItemActive(home, '/app/client')).toBe(true)
    expect(isClientNavItemActive(home, '/app/client/requests')).toBe(false)
  })

  it('treats Prazos as part of Mais', () => {
    const more = CLIENT_NAV_PRIMARY.find((i) => i.to === '/app/client/more')!
    expect(isClientNavItemActive(more, '/app/client/more')).toBe(true)
    expect(isClientNavItemActive(more, '/app/client/agenda')).toBe(true)
    expect(isClientNavItemActive(more, '/app/client/account')).toBe(true)
    expect(isClientNavItemActive(more, '/app/client/services')).toBe(false)
  })

  it('labels the current page', () => {
    expect(clientNavLabelForPath('/app/client')).toBe('Início')
    expect(clientNavLabelForPath('/app/client/services')).toBe('Serviços')
    expect(clientNavLabelForPath('/app/client/agenda')).toBe('Prazos')
  })
})
