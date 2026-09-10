import { describe, expect, it } from 'vitest'

import { buildGoogleMapsUrl } from '@/shared/utils/googleMapsUrl'

describe('buildGoogleMapsUrl', () => {
  it('returns null without address or coordinates', () => {
    expect(buildGoogleMapsUrl({})).toBeNull()
    expect(buildGoogleMapsUrl({ address: '   ' })).toBeNull()
  })

  it('builds search URL from address', () => {
    const url = buildGoogleMapsUrl({ address: 'Rua X, Coimbra, Portugal' })
    expect(url).toContain('https://www.google.com/maps/search/')
    expect(url).toContain(encodeURIComponent('Rua X, Coimbra, Portugal'))
  })

  it('prefers coordinates when present', () => {
    const url = buildGoogleMapsUrl({
      address: 'Ignored',
      latitude: 40.2,
      longitude: -8.4,
    })
    expect(url).toContain(encodeURIComponent('40.2,-8.4'))
  })

  it('accepts google maps https URL', () => {
    const mapsUrl = 'https://www.google.com/maps/place/Coimbra'
    expect(buildGoogleMapsUrl({ mapsUrl, address: 'x' })).toBe(mapsUrl)
  })

  it('rejects non-maps http URLs', () => {
    expect(buildGoogleMapsUrl({ mapsUrl: 'https://evil.example/phish', address: 'Rua Y' })).toContain(
      encodeURIComponent('Rua Y'),
    )
  })
})
