import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  acceptAllCookies,
  ANON_CONSENT_KEY,
  hasStoredCookieConsent,
  readAnonConsent,
  readCookiePrefs,
  rejectNonEssentialCookies,
  writeCookiePrefs,
} from '@/shared/utils/cookieConsent'

function installLocalStorageMock() {
  const store = new Map<string, string>()
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v))
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
  }
  ;(globalThis as { window?: unknown }).window = {
    localStorage,
    dispatchEvent: () => true,
  }
  return store
}

describe('cookieConsent', () => {
  beforeEach(() => {
    installLocalStorageMock()
  })

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window
  })

  it('starts without a stored choice', () => {
    expect(hasStoredCookieConsent()).toBe(false)
    expect(readAnonConsent()).toBeNull()
  })

  it('accepts and rejects all optional cookies', () => {
    acceptAllCookies()
    expect(readAnonConsent()).toBe('accepted')
    expect(readCookiePrefs()).toEqual({ essential: true, analytics: true, advertising: true })
    rejectNonEssentialCookies()
    expect(readAnonConsent()).toBe('rejected')
    expect(readCookiePrefs().analytics).toBe(false)
  })

  it('stores a mixed custom choice', () => {
    writeCookiePrefs({ essential: true, analytics: true, advertising: false })
    expect(readAnonConsent()).toBe('custom')
    expect(readCookiePrefs()).toEqual({ essential: true, analytics: true, advertising: false })
    expect(window.localStorage.getItem(ANON_CONSENT_KEY)).toBe('custom')
  })
})
