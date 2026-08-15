import { useCallback, useEffect, useId, useRef, useState, type MutableRefObject } from 'react'

import { getTurnstileSiteKey, isTurnstileEnabled, type TurnstileAction } from '@/shared/security/turnstile'

type TurnstileApi = {
  ready: (cb: () => void) => void
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action?: string
      theme?: 'auto' | 'light' | 'dark'
      appearance?: 'always' | 'execute' | 'interaction-only'
      retry?: 'auto' | 'never'
      'refresh-expired'?: 'auto' | 'manual' | 'never'
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
  const [status, setStatus] = useState<'idle' | 'ready' | 'error'>('idle')
  const [retryTick, setRetryTick] = useState(0)
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
    setStatus('idle')

    void (async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile) return

        await new Promise<void>((resolve) => {
          if (!window.turnstile) {
            resolve()
            return
          }
          if (typeof window.turnstile.ready === 'function') {
            window.turnstile.ready(() => resolve())
            return
          }
          resolve()
        })
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
          retry: 'auto',
          'refresh-expired': 'auto',
          callback: (t) => {
            if (!cancelled) {
              setStatus('ready')
              setTokenSafe(String(t || ''))
            }
          },
          'expired-callback': () => {
            if (!cancelled) {
              setStatus('idle')
              setTokenSafe('')
            }
          },
          'error-callback': () => {
            if (!cancelled) {
              setStatus('error')
              setTokenSafe('')
            }
          },
          'timeout-callback': () => {
            if (!cancelled) {
              setStatus('error')
              setTokenSafe('')
            }
          },
        })
        widgetIdRef.current = id
      } catch {
        if (!cancelled) {
          setStatus('error')
          setTokenSafe('')
        }
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
  }, [enabled, sitekey, action, setTokenSafe, reactId, retryTick])

  if (!enabled) return null

  return (
    <div className={className} data-turnstile-action={action}>
      <div ref={containerRef} />
      {status === 'error' ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-destructive">
          <span>A verificação não concluiu. Actualize ou tente de novo.</span>
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => {
              setTokenSafe('')
              setRetryTick((n) => n + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
    </div>
  )
}

export { isTurnstileEnabled }
