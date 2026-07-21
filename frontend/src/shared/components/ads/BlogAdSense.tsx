import { useEffect } from 'react'

/** Publisher AdSense Teglion — carregar apenas dentro de `BlogLayout` (/blog). */
export const ADSENSE_CLIENT = 'ca-pub-8576885038152568'
const ADSENSE_SCRIPT_ID = 'teglion-adsense'
const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`

function removeAdSenseScript() {
  document.getElementById(ADSENSE_SCRIPT_ID)?.remove()
  document.querySelectorAll('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').forEach((node) => {
    node.remove()
  })
}

function ensureAdSenseScript() {
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = ADSENSE_SCRIPT_ID
  script.async = true
  script.src = ADSENSE_SRC
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}

/** Injeta AdSense — montar apenas em `/blog`*/
export function BlogAdSense() {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const load = () => ensureAdSenseScript()
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(load, { timeout: 3500 })
    } else {
      timeoutId = setTimeout(load, 2500)
    }

    return () => {
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      removeAdSenseScript()
    }
  }, [])

  return null
}
