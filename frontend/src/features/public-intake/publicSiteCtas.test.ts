import { describe, expect, it } from 'vitest'

import { ctaTelHref, isPublicCtaRenderable, resolvePublicCtaHref, type PublicCtaRenderContext } from './publicSiteCtas'
import type { PublicSiteCta } from '@/shared/types/firmPublicSite'

const ctx: PublicCtaRenderContext = {
  firmSlug: 'maya',
  services: [{ slug: 'irs-2026' }],
  contact: { phone: '+351 912 345 678' },
}

function cta(partial: Partial<PublicSiteCta> & { target: PublicSiteCta['target'] }): PublicSiteCta {
  return {
    id: 'cta_1',
    label: 'Botão',
    style: 'primary',
    ...partial,
  }
}

describe('publicSiteCtas', () => {
  it('builds a service URL from the current firm slug', () => {
    expect(
      resolvePublicCtaHref(cta({ target: { type: 'service-detail', serviceId: 'irs-2026' } }), ctx, {}),
    ).toBe('/maya/servicos/irs-2026')
  })

  it('hides a service button when the slug is unpublished or foreign', () => {
    expect(
      isPublicCtaRenderable(cta({ target: { type: 'service-detail', serviceId: 'irs-2026' } }), ctx, {}),
    ).toBe(true)
    expect(
      isPublicCtaRenderable(cta({ target: { type: 'service-detail', serviceId: 'outro-escritorio' } }), ctx, {}),
    ).toBe(false)
    expect(isPublicCtaRenderable(cta({ target: { type: 'service-detail' } }), ctx, {})).toBe(false)
  })

  it('opens tel: with the button number or the office phone', () => {
    expect(ctaTelHref('+351 912 345 678')).toBe('tel:+351912345678')
    expect(resolvePublicCtaHref(cta({ target: { type: 'phone' } }), ctx, {})).toBe('tel:+351912345678')
    expect(
      resolvePublicCtaHref(cta({ target: { type: 'phone', phone: '+351 210 000 000' } }), ctx, {}),
    ).toBe('tel:+351210000000')
    expect(
      isPublicCtaRenderable(cta({ target: { type: 'phone' } }), { ...ctx, contact: { phone: null } }, {}),
    ).toBe(false)
  })

  it('keeps a booking CTA without a service as the services anchor', () => {
    expect(resolvePublicCtaHref(cta({ target: { type: 'booking' } }), ctx, {})).toBe('#servicos')
    expect(isPublicCtaRenderable(cta({ target: { type: 'booking' } }), ctx, {})).toBe(true)
  })
})
