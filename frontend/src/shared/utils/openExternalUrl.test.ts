/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { openExternalUrl } from '@/shared/utils/openExternalUrl'

describe('openExternalUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens via window.open and never navigates the current tab away', () => {
    const opened = { opener: {} as Window }
    const open = vi.spyOn(window, 'open').mockReturnValue(opened as unknown as Window)
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined)

    const ok = openExternalUrl('https://afdigitalweb.com/')

    expect(ok).toBe(true)
    expect(open).toHaveBeenCalledWith('https://afdigitalweb.com/', '_blank')
    expect(opened.opener).toBeNull()
    expect(assign).not.toHaveBeenCalled()
  })

  it('falls back to a temporary anchor when window.open returns null (no location.assign)', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined)
    const click = vi.fn()
    const remove = vi.fn()
    const el = {
      href: '',
      target: '',
      rel: '',
      referrerPolicy: '',
      click,
      remove,
    } as unknown as HTMLAnchorElement
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(el)
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n)

    const ok = openExternalUrl('https://afdigitalweb.com/')

    expect(ok).toBe(true)
    expect(createElement).toHaveBeenCalledWith('a')
    expect(appendChild).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(remove).toHaveBeenCalled()
    expect(assign).not.toHaveBeenCalled()
  })
})
