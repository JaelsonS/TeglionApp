import { useCallback, useEffect, useId, useRef, useState, type MutableRefObject } from 'react'

import { getTurnstileSiteKey, isTurnstileEnabled, type TurnstileAction } from '@/shared/security/turnstile'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action?: string
      theme?: 'auto' | 'light' | 'dark'
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
      'timeout-callback'?: () => void
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_ID = 'cf-turnstile-api'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true })
      if (window.turnstile) resolve()
      return
    }
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile script failed'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export type TurnstileFieldHandle = {
  getToken: () => string
  reset: () => void
}

type Props = {
  action: TurnstileAction
  onTokenChange?: (token: string) => void
  className?: string
  /** Exposed via callback ref pattern for parents that need reset after errors. */
  fieldRef?: MutableRefObject<TurnstileFieldHandle | null>
}

/**
 * Cloudflare Turnstile Managed widget.
 * Sem sitekey: não renderiza (dev local sem Turnstile).
 */
export function TurnstileField({ action, onTokenChange, className, fieldRef }: Props) {
  const enabled = isTurnstileEnabled()
  const sitekey = getTurnstileSiteKey()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [token, setToken] = useState('')
  const reactId = useId()

  const setTokenSafe = useCallback(
    (next: string) => {
      setToken(next)
      onTokenChange?.(next)
    },
    [onTokenChange],
  )

  const reset = useCallback(() => {
    setTokenSafe('')
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch {
        /* ignore */
      }
    }
  }, [setTokenSafe])

  useEffect(() => {
    if (fieldRef) {
      fieldRef.current = {
        getToken: () => token,
        reset,
      }
    }
    return () => {
      if (fieldRef) fieldRef.current = null
    }
  }, [fieldRef, token, reset])

  useEffect(() => {
    if (!enabled || !sitekey || !containerRef.current) return

    let cancelled = false

    void (async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile) return

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null
        }

        containerRef.current.innerHTML = ''
        const id = window.turnstile.render(containerRef.current, {
          sitekey,
          action,
          theme: 'light',
          callback: (t) => {
            if (!cancelled) setTokenSafe(String(t || ''))
          },
          'expired-callback': () => {
            if (!cancelled) setTokenSafe('')
          },
          'error-callback': () => {
            if (!cancelled) setTokenSafe('')
          },
          'timeout-callback': () => {
            if (!cancelled) setTokenSafe('')
          },
        })
        widgetIdRef.current = id
      } catch {
        if (!cancelled) setTokenSafe('')
      }
    })()

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null
      }
    }
  }, [enabled, sitekey, action, setTokenSafe, reactId])

  if (!enabled) return null

  return (
    <div className={className} data-turnstile-action={action}>
      <div ref={containerRef} />
    </div>
  )
}

export { isTurnstileEnabled }
