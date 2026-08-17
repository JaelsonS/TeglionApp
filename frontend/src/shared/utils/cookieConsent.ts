/** Consentimento anónimo de cookies (landing/blog) — sem AuthContext. */

export const ANON_CONSENT_KEY = 'cookieConsent:anonymous'
export const CONSENT_PREFS_KEY = 'cookieConsent:prefs'
export const COOKIE_CONSENT_CHANGED = 'teglion:cookie-consent'
export const OPEN_COOKIE_PREFS_EVENT = 'teglion:open-cookie-prefs'

export const CONSENT_ACCEPTED = 'accepted'
export const CONSENT_REJECTED = 'rejected'
export const CONSENT_CUSTOM = 'custom'

export type CookieConsentChoice = typeof CONSENT_ACCEPTED | typeof CONSENT_REJECTED | typeof CONSENT_CUSTOM

export type CookiePrefs = {
  essential: true
  analytics: boolean
  advertising: boolean
}

const DEFAULT_OFF: CookiePrefs = { essential: true, analytics: false, advertising: false }

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readAnonConsent(): CookieConsentChoice | null {
  const raw = safeStorage()?.getItem(ANON_CONSENT_KEY)
  if (raw === CONSENT_ACCEPTED || raw === CONSENT_REJECTED || raw === CONSENT_CUSTOM) return raw
  return null
}

export function readCookiePrefs(): CookiePrefs {
  const choice = readAnonConsent()
  if (choice === CONSENT_ACCEPTED) return { essential: true, analytics: true, advertising: true }
  if (choice === CONSENT_REJECTED) return DEFAULT_OFF
  if (choice === CONSENT_CUSTOM) {
    try {
      const parsed = JSON.parse(safeStorage()?.getItem(CONSENT_PREFS_KEY) || '') as Partial<CookiePrefs>
      return {
        essential: true,
        analytics: parsed.analytics === true,
        advertising: parsed.advertising === true,
      }
    } catch {
      return DEFAULT_OFF
    }
  }
  return DEFAULT_OFF
}

export function hasStoredCookieConsent(): boolean {
  return readAnonConsent() !== null
}

export function analyticsAllowed(): boolean {
  return readCookiePrefs().analytics
}

export function advertisingAllowed(): boolean {
  return readCookiePrefs().advertising
}

/** True se alguma medição/anúncio foi aceite — compatível com o banner antigo (`accepted`). */
export function hasAcceptedCookieConsent(): boolean {
  const prefs = readCookiePrefs()
  return prefs.analytics || prefs.advertising
}

function choiceFromPrefs(prefs: CookiePrefs): CookieConsentChoice {
  if (prefs.analytics && prefs.advertising) return CONSENT_ACCEPTED
  if (!prefs.analytics && !prefs.advertising) return CONSENT_REJECTED
  return CONSENT_CUSTOM
}

export function writeCookiePrefs(prefs: CookiePrefs): CookieConsentChoice {
  const next: CookiePrefs = {
    essential: true,
    analytics: Boolean(prefs.analytics),
    advertising: Boolean(prefs.advertising),
  }
  const choice = choiceFromPrefs(next)
  const storage = safeStorage()
  if (storage) {
    storage.setItem(ANON_CONSENT_KEY, choice)
    if (choice === CONSENT_CUSTOM) storage.setItem(CONSENT_PREFS_KEY, JSON.stringify(next))
    else storage.removeItem(CONSENT_PREFS_KEY)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED, { detail: { choice, prefs: next } }))
  }
  return choice
}

export function acceptAllCookies(): CookieConsentChoice {
  return writeCookiePrefs({ essential: true, analytics: true, advertising: true })
}

export function rejectNonEssentialCookies(): CookieConsentChoice {
  return writeCookiePrefs({ essential: true, analytics: false, advertising: false })
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFS_EVENT))
}

export function updateGtagConsent(granted: { analytics: boolean; advertising: boolean }) {
  if (typeof window === 'undefined') return
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== 'function') return
  gtag('consent', 'update', {
    ad_storage: granted.advertising ? 'granted' : 'denied',
    analytics_storage: granted.analytics ? 'granted' : 'denied',
    ad_user_data: granted.advertising ? 'granted' : 'denied',
    ad_personalization: granted.advertising ? 'granted' : 'denied',
  })
}
