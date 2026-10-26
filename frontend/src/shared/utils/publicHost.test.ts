import { describe, expect, it } from 'vitest'

import {
  buildFirmPublicUrl,
  getPublicSubdomainSlug,
  isPublicPathRedirectHost,
  isStagingPublicHost,
  isValidPublicSlug,
  publicSitePath,
} from '@/shared/utils/publicHost'

describe('publicHost', () => {
  it('valida slugs e reserva labels de sistema', () => {
    expect(isValidPublicSlug('mayavida-contabilista')).toBe(true)
    expect(isValidPublicSlug('llcnunes')).toBe(true)
    expect(isValidPublicSlug('www')).toBe(false)
    expect(isValidPublicSlug('api')).toBe(false)
    expect(isValidPublicSlug('a')).toBe(false)
  })

  it('extrai slug só de *.staging.teglion.com', () => {
    expect(getPublicSubdomainSlug('mayavida-contabilista.staging.teglion.com')).toBe(
      'mayavida-contabilista',
    )
    expect(getPublicSubdomainSlug('staging.teglion.com')).toBe(null)
    expect(getPublicSubdomainSlug('www.staging.teglion.com')).toBe(null)
    expect(getPublicSubdomainSlug('mayavida-contabilista.teglion.com')).toBe(null)
    expect(getPublicSubdomainSlug('www.teglion.com')).toBe(null)
  })

  it('detecta hosts de redirect e staging', () => {
    expect(isPublicPathRedirectHost('staging.teglion.com')).toBe(true)
    expect(isStagingPublicHost('foo.staging.teglion.com')).toBe(true)
    expect(isStagingPublicHost('teglion.com')).toBe(false)
  })

  it('buildFirmPublicUrl: staging → subdomain; prod → path', () => {
    expect(buildFirmPublicUrl('mayavida-contabilista', 'staging.teglion.com')).toBe(
      'https://mayavida-contabilista.staging.teglion.com',
    )
    expect(buildFirmPublicUrl('llcnunes', 'www.teglion.com')).toBe('https://teglion.com/llcnunes')
  })
})

describe('publicSitePath (sem window subdomain)', () => {
  it('usa path com slug quando não há subdomain activo', () => {
    expect(publicSitePath('maya', 'servicos', 'irs')).toBe('/maya/servicos/irs')
    expect(publicSitePath('maya')).toBe('/maya')
  })
})
