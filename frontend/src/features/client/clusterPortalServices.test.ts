import { describe, expect, it } from 'vitest'

import { clusterPortalServices } from './clusterPortalServices'

describe('clusterPortalServices', () => {
  it('keeps a flat list when no group is set', () => {
    const out = clusterPortalServices([{ publicGroup: null }, { publicGroup: '' }])
    expect(out).toEqual([{ heading: null, items: [{ publicGroup: null }, { publicGroup: '' }] }])
  })

  it('clusters adjacent services with the same group', () => {
    const out = clusterPortalServices([
      { publicGroup: 'Consultoria Fiscal', id: 'a' },
      { publicGroup: 'Consultoria Fiscal', id: 'b' },
      { publicGroup: null, id: 'c' },
    ])
    expect(out.map((c) => c.heading)).toEqual(['Consultoria Fiscal', null])
    expect(out[0].items.map((i) => i.id)).toEqual(['a', 'b'])
  })
})
