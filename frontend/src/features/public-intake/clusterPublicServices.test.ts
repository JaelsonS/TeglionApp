import { describe, expect, it } from 'vitest'

import { clusterPublicServices, uniquePublicServiceGroups } from './clusterPublicServices'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'

function svc(slug: string, publicGroup?: string | null): PublicFirmServiceSummary {
  return {
    slug,
    name: slug,
    durationMinutes: 60,
    priceCents: 0,
    requiresBooking: false,
    publicGroup: publicGroup ?? null,
  }
}

describe('clusterPublicServices', () => {
  it('keeps a flat list when no group is set', () => {
    const out = clusterPublicServices([svc('irs'), svc('iva')])
    expect(out).toEqual([{ heading: null, items: [svc('irs'), svc('iva')] }])
  })

  it('clusters adjacent services with the same group', () => {
    const out = clusterPublicServices([
      svc('a', 'Consultoria Fiscal'),
      svc('b', 'Consultoria Fiscal'),
      svc('c'),
    ])
    expect(out.map((c) => c.heading)).toEqual(['Consultoria Fiscal', null])
    expect(out[0].items.map((i) => i.slug)).toEqual(['a', 'b'])
    expect(out[1].items.map((i) => i.slug)).toEqual(['c'])
  })

  it('trims blank group names to ungrouped', () => {
    const out = clusterPublicServices([svc('a', '  '), svc('b', 'IRS')])
    expect(out.map((c) => c.heading)).toEqual([null, 'IRS'])
  })
})

describe('uniquePublicServiceGroups', () => {
  it('skips services without slug and buckets the rest', () => {
    const out = uniquePublicServiceGroups([
      { ...svc('irs-1', 'IRS') },
      { ...svc('', 'IRS'), slug: '' },
      { ...svc('iva-1', 'IVA') },
      { ...svc('irs-2', 'IRS') },
    ])
    expect(out.map((c) => c.heading)).toEqual(['IRS', 'IVA'])
    expect(out[0].items.map((i) => i.slug)).toEqual(['irs-1', 'irs-2'])
  })
})
