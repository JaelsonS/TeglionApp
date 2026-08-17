import { describe, expect, it } from 'vitest'

import {
  patchNewsFeedSearchParams,
  patchUpdatesTabSearchParams,
  updatesTabFromSearch,
} from './clientUpdatesSearch'

describe('clientUpdatesSearch', () => {
  it('reads news tab from tab=news or tab=noticias', () => {
    expect(updatesTabFromSearch(new URLSearchParams('tab=news'))).toBe('news')
    expect(updatesTabFromSearch(new URLSearchParams('tab=noticias'))).toBe('news')
    expect(updatesTabFromSearch(new URLSearchParams())).toBe('alerts')
  })

  it('keeps tab=news when setting or clearing an article slug', () => {
    const opened = patchNewsFeedSearchParams(new URLSearchParams('tab=news'), 'iva-2026')
    expect(opened.get('tab')).toBe('news')
    expect(opened.get('slug')).toBe('iva-2026')

    const closed = patchNewsFeedSearchParams(opened, null)
    expect(closed.get('tab')).toBe('news')
    expect(closed.get('slug')).toBeNull()
  })

  it('restores tab=news if a previous write dropped it', () => {
    const recovered = patchNewsFeedSearchParams(new URLSearchParams('slug=iva-2026'), 'iva-2026')
    expect(recovered.get('tab')).toBe('news')
    expect(recovered.get('slug')).toBe('iva-2026')
  })

  it('clears slug when leaving the news tab', () => {
    const next = patchUpdatesTabSearchParams(new URLSearchParams('tab=news&slug=iva-2026'), 'alerts')
    expect(next.get('tab')).toBeNull()
    expect(next.get('slug')).toBeNull()
  })
})
