/** Measurement ID GA4 — deve coincidir com o snippet em index.html */
export const GTAG_ID = 'G-JHXZ25T7FJ'
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

function ensureGtagBootstrap() {
  if (typeof window === 'undefined') return
  const w = window as any
  w.dataLayer = w.dataLayer || []
  if (typeof w.gtag !== 'function') {
    w.gtag = function gtag() {
      w.dataLayer.push(arguments)
    }
  }
}

/**
 * Garante gtag presente (fallback se index.html não tiver o snippet).
 * No fluxo normal a tag já está no <head>; aqui só evitamos duplicar o script.
 */
export async function loadThirdPartyScripts() {
  if (analyticsLoaded) return
  analyticsLoaded = true

  try {
    ensureGtagBootstrap()
    const src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`
    const alreadyInDom = Boolean(document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`))
    if (!alreadyInDom) {
      await loadScript(src)
      const w = window as any
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
