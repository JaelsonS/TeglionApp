const GTAG_ID = 'G-87JMNHY650'
const ADS_CLIENT = 'ca-pub-8576885038152568'

let analyticsLoaded = false
let adsLoaded = false

function loadScript(src: string, attrs?: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve()

    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return resolve()

    const script = document.createElement('script')
    script.async = true
    script.src = src
    if (attrs) {
      Object.entries(attrs).forEach(([key, value]) => {
        script.setAttribute(key, value)
      })
    }
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function initGtag() {
  if (typeof window === 'undefined') return
  const w = window as any
  w.dataLayer = w.dataLayer || []
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments) }
  w.gtag('js', new Date())
  w.gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  })
  w.gtag('config', GTAG_ID)
}

export async function loadThirdPartyScripts() {
  if (analyticsLoaded) return
  analyticsLoaded = true

  try {
    initGtag()
    await loadScript(`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`)
  } catch {
    // fallback silencioso
  }
}

/** Envia page_view (SPA) — útil no blog /blog e /blog/:slug */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return
  const w = window as any
  if (typeof w.gtag !== 'function') return
  w.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    send_to: GTAG_ID,
  })
}

export function getGtagId() {
  return GTAG_ID
}

function hasAcceptedCookieConsent() {
  if (typeof window === 'undefined') return false

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key || !key.startsWith('cookieConsent:')) continue
    if (window.localStorage.getItem(key) === 'accepted') {
      return true
    }
  }

  return false
}

export async function loadAdSenseScript() {
  if (adsLoaded) return
  if (!hasAcceptedCookieConsent()) return
  adsLoaded = true

  try {
    await loadScript(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`, {
      crossorigin: 'anonymous',
    })
  } catch {
    // fallback silencioso
  }
}
