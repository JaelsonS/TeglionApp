import { describe, expect, it } from 'vitest'
import { countServicePublishStats, getServicePublishPresentation } from './servicePublishState'

describe('getServicePublishPresentation', () => {
  it('marks inactive services', () => {
    const p = getServicePublishPresentation({ isActive: false, isPubliclyListed: true, slug: 'x' })
    expect(p.id).toBe('inactive')
  })

  it('marks draft when active but not listed', () => {
    const p = getServicePublishPresentation({ isActive: true, isPubliclyListed: false, slug: null })
    expect(p.id).toBe('draft')
    expect(p.label).toBe('Só interno')
  })

  it('marks ready when listed without slug', () => {
    const p = getServicePublishPresentation({ isActive: true, isPubliclyListed: true, slug: '' })
    expect(p.id).toBe('ready')
  })

  it('marks published only with listed + slug', () => {
    const p = getServicePublishPresentation({ isActive: true, isPubliclyListed: true, slug: 'consultoria' })
    expect(p.id).toBe('published')
    expect(p.description).toMatch(/página pública/i)
  })

  it('counts stats without inventing data', () => {
    const stats = countServicePublishStats([
      { isActive: true, isPubliclyListed: true, slug: 'a' },
      { isActive: true, isPubliclyListed: false },
      { isActive: false, isPubliclyListed: false },
    ])
    expect(stats).toEqual({ active: 2, published: 1, internal: 1, total: 3 })
  })
})
