import { describe, expect, it } from 'vitest'

import { searchMayaIntents } from '@/features/maya/searchMayaIntents'

describe('searchMayaIntents', () => {
  it('encontra guia de publicação', () => {
    const hits = searchMayaIntents('como publicar a pagina publica')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.id.includes('public-page'))).toBe(true)
  })
})
