import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'

import { getTurnstileSiteKey, isTurnstileEnabled, type TurnstileAction } from '@/shared/security/turnstile'

type TurnstileApi = {
  ready: (cb: () => void) => void
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action?: string
      theme?: 'auto' | 'light' | 'dark'
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
const READY_TIMEOUT_MS = 12_000

let scriptPromise: Promise<void> | null = null

/** Carrega a API Turnstile sem ficar pendurado se o <script> já tiver carregado. */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.turnstile) {
        resolve()
        return true
      }
      return false
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      if (finish()) return
      const onLoad = () => {
        if (!finish()) {
          // Script disparou load mas global ainda não — espera um tick.
          window.setTimeout(() => {
            if (!finish()) reject(new Error('Turnstile API missing after script load'))
          }, 0)
        }
      }
      existing.addEventListener('load', onLoad, { once: true })
      existing.addEventListener(
        'error',
        () => {
          scriptPromise = null
          reject(new Error('Turnstile script failed'))
        },
        { once: true },
      )
      // Script já completo (load passado): poll curto pela global.
      let polls = 0
      const timer = window.setInterval(() => {
        polls += 1
        if (finish() || polls > 40) {
          window.clearInterval(timer)
          if (!window.turnstile) {
            scriptPromise = null
            reject(new Error('Turnstile script present but API unavailable'))
          }
        }
      }, 50)
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      if (!finish()) {
        window.setTimeout(() => {
          if (!finish()) {
            scriptPromise = null
            reject(new Error('Turnstile API missing after script load'))
          }
        }, 0)
      }
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile script failed'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

function waitForTurnstileReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.turnstile) {
      reject(new Error('Turnstile API missing'))
      return
    }
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const timer = window.setTimeout(() => {
      // ready() por vezes não dispara; a API já está utilizável.
      done()
    }, READY_TIMEOUT_MS)
    try {
      if (typeof window.turnstile.ready === 'function') {
        window.turnstile.ready(() => {
          window.clearTimeout(timer)
          done()
        })
        return
      }
    } catch {
      /* fall through */
    }
    window.clearTimeout(timer)
    done()
  })
}

export type TurnstileFieldHandle = {
  getToken: () => string
  reset: () => void
}

type Props = {
  action: TurnstileAction
  onTokenChange?: (token: string) => void
  className?: string
  fieldRef?: MutableRefObject<TurnstileFieldHandle | null>
}

/**
 * Cloudflare Turnstile Managed widget.
 * Sem sitekey: não renderiza (dev local).
 *
 * Importante: não re-montar o widget quando o parent re-renderiza
 * (onTokenChange via ref). Remount a meio do challenge dispara error-callback.
 */
export function TurnstileField({ action, onTokenChange, className, fieldRef }: Props) {
  const enabled = isTurnstileEnabled()
  const sitekey = getTurnstileSiteKey()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const tokenRef = useRef('')
  const onTokenChangeRef = useRef(onTokenChange)
  const [status, setStatus] = useState<'idle' | 'ready' | 'error'>('idle')
  const [retryTick, setRetryTick] = useState(0)
  const autoRetryRef = useRef(0)

  onTokenChangeRef.current = onTokenChange

  const publishToken = useCallback((next: string) => {
    tokenRef.current = next
    onTokenChangeRef.current?.(next)
  }, [])

  const reset = useCallback(() => {
    publishToken('')
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch {
        /* ignore */
      }
    }
  }, [publishToken])

  useEffect(() => {
    if (fieldRef) {
      fieldRef.current = {
        getToken: () => tokenRef.current,
        reset,
      }
    }
    return () => {
      if (fieldRef) fieldRef.current = null
    }
  }, [fieldRef, reset])

  useEffect(() => {
    if (!enabled || !sitekey) return

    const container = containerRef.current
    if (!container) return

    let cancelled = false
    setStatus('idle')
    publishToken('')

    void (async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile) return

        await waitForTurnstileReady()
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
            if (cancelled) return
            autoRetryRef.current = 0
            setStatus('ready')
            publishToken(String(t || ''))
          },
          'expired-callback': () => {
            if (cancelled) return
            setStatus('idle')
            publishToken('')
          },
          'error-callback': () => {
            if (cancelled) return
            // Remount/race no Managed mode dispara error transitório —
            // uma auto-retry antes de mostrar falha ao utilizador.
            if (autoRetryRef.current < 1) {
              autoRetryRef.current += 1
              window.setTimeout(() => {
                if (!cancelled) setRetryTick((n) => n + 1)
              }, 400)
              return
            }
            setStatus('error')
            publishToken('')
          },
          'timeout-callback': () => {
            if (cancelled) return
            if (autoRetryRef.current < 1) {
              autoRetryRef.current += 1
              window.setTimeout(() => {
                if (!cancelled) setRetryTick((n) => n + 1)
              }, 400)
              return
            }
            setStatus('error')
            publishToken('')
          },
        })
        widgetIdRef.current = id
      } catch {
        if (!cancelled) {
          setStatus('error')
          publishToken('')
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
    // onTokenChange deliberadamente fora — vai por ref para não destruir o widget.
  }, [enabled, sitekey, action, retryTick, publishToken])

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
              autoRetryRef.current = 0
              publishToken('')
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
