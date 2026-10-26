import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import '@/shared/styles/globals.css'
import '@/shared/styles/app-shell.css'
import '@/shared/styles/animations.css'
import { initSentry, Sentry } from '@/shared/lib/sentry'
import i18n from '@/i18n'
import App from '@/core/App'
import { registerSW } from 'virtual:pwa-register'
import { shouldRegisterPwa } from '@/shared/utils/pwaPolicy'
import { isPushServiceWorkerScript, PUSH_SW_URL } from '@/shared/utils/pushSetup'
import { isLightweightPublicRoute } from '@/shared/utils/publicRoutes'
import { STALE_ASSET_EVENT } from '@/shared/styles/loadContabilStyles'

const CHUNK_RECOVERY_KEY = 'teglion.chunk-recovery'

function isChunkLoadFailure(value: unknown): boolean {
  const text = String(value || '')
  // Não usar `/assets/*.js` no stack — qualquer erro de runtime nos bundles
  // casava e mascarava o crash real (ex.: tenant null) como «cache desactualizada».
  return (
    text.includes('Unable to preload CSS') ||
    text.includes('Failed to fetch dynamically imported module') ||
    text.includes('Importing a module script failed') ||
    text.includes('Loading chunk') ||
    text.includes('error loading dynamically imported module')
  )
}

async function clearRuntimeCaches(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }
  } catch {
    // noop
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {
    // noop
  }
}

function hasChunkRecoveredOnce(): boolean {
  try {
    return window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1'
  } catch {
    return false
  }
}

function markChunkRecovered(): void {
  try {
    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
  } catch {
    // noop
  }
}

/** Só limpar após boot com sucesso — limpar no reload com `__chunk_recover` causava loop. */
function clearChunkRecoveryFlag(): void {
  try {
    window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY)
  } catch {
    // noop
  }
}

function hardReloadWithChunkBust(): void {
  const next = new URL(window.location.href)
  next.searchParams.set('__chunk_recover', String(Date.now()))
  window.location.replace(next.toString())
}

function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return

  const recoverOnce = () => {
    if (hasChunkRecoveredOnce()) return
    markChunkRecovered()
    void clearRuntimeCaches().finally(() => {
      hardReloadWithChunkBust()
    })
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason
    const message = reason?.message || reason
    if (isChunkLoadFailure(message)) recoverOnce()
  })

  window.addEventListener('error', (event) => {
    const err = event as ErrorEvent
    const message = err.message || ''
    const source = err.filename || ''
    if (isChunkLoadFailure(message) || isChunkLoadFailure(source)) recoverOnce()
  })

  // ensureContabilStyles catches Vite CSS preload errors — still recover once.
  window.addEventListener(STALE_ASSET_EVENT, () => recoverOnce())
}

function isPwaEnabled(): boolean {
  const raw = String(import.meta.env.VITE_ENABLE_PWA || '').toLowerCase()
  if (raw === 'false' || raw === '0') return false
  if (raw === 'true' || raw === '1') return true
  // Em produção activa por defeito (portal cliente / app instalável).
  return Boolean(import.meta.env.PROD)
}

async function disableExistingPwaRegistrations(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations
        .filter((registration) => {
          const scriptUrl =
            registration.active?.scriptURL ||
            registration.installing?.scriptURL ||
            registration.waiting?.scriptURL
          return !isPushServiceWorkerScript(scriptUrl)
        })
        .map((registration) => registration.unregister()),
    )
  } catch {
    // noop
  }

  if (!('caches' in window)) return
  try {
    const keys = await caches.keys()
    const workboxKeys = keys.filter((key) => key.includes('workbox') || key.includes('precache'))
    await Promise.all(workboxKeys.map((key) => caches.delete(key)))
  } catch {
    // noop
  }
}

function shouldRegisterPushServiceWorker(pathname: string): boolean {
  return pathname.startsWith('/app/client') || pathname.startsWith('/app/firm')
}

function registerPushServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  void navigator.serviceWorker.register(PUSH_SW_URL, { scope: '/' }).catch(() => {
    // push opcional — a app continua sem notificações
  })
}

function loadGoogleFonts() {
  if (document.querySelector('link[data-teglion-fonts]')) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  link.setAttribute('data-teglion-fonts', '1')
  document.head.appendChild(link)
}

if (typeof window !== 'undefined') {
  installChunkLoadRecovery()
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has('__chunk_recover')) {
      url.searchParams.delete('__chunk_recover')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
  } catch {
    /* ignore */
  }
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
  if (w.requestIdleCallback) {
    w.requestIdleCallback(() => loadGoogleFonts(), { timeout: 2500 })
  } else {
    window.setTimeout(loadGoogleFonts, 1500)
  }
}

if (typeof window !== 'undefined' && !isLightweightPublicRoute(window.location.pathname)) {
  // Prefer ensureContabilStyles (catch + stale-asset recovery) over a bare import.
  void import('@/shared/styles/loadContabilStyles').then((m) => m.ensureContabilStyles())
}

const bootSentry = () => {
  try {
    initSentry()
  } catch {
    // noop
  }
}

if (import.meta.env.PROD && typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(() => bootSentry(), { timeout: 5000 })
} else {
  bootSentry()
}

if (import.meta.env.PROD && !isPwaEnabled() && typeof window !== 'undefined') {
  void disableExistingPwaRegistrations()
}

if (typeof window !== 'undefined' && shouldRegisterPushServiceWorker(window.location.pathname)) {
  if (document.readyState === 'complete') {
    registerPushServiceWorker()
  } else {
    window.addEventListener('load', registerPushServiceWorker, { once: true })
  }
}

if (import.meta.env.PROD && isPwaEnabled() && 'serviceWorker' in navigator && shouldRegisterPwa(window.location.pathname)) {
  const registerPwa = () => {
    try {
      const updateSW = registerSW({
        immediate: false,
        onNeedRefresh() {
          void updateSW(true).catch(() => {
            // ignore InvalidStateError ao reclamar clients
          })
        },
        onRegisteredSW(_url, registration) {
          registration?.update().catch(() => {})
        },
        onRegisterError() {
          // SW falhou — a app continua em modo rede
        },
      })
    } catch {
      // ignore
    }
  }

  if (document.readyState === 'complete') {
    registerPwa()
  } else {
    window.addEventListener('load', registerPwa, { once: true })
  }
}

const app = (
  <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => {
        const message = error instanceof Error ? error.message : String(error || '')
        const isChunk = isChunkLoadFailure(message)
        if (isChunk && typeof window !== 'undefined' && !hasChunkRecoveredOnce()) {
          markChunkRecovered()
          void clearRuntimeCaches().finally(() => {
            hardReloadWithChunkBust()
          })
          return <div>A actualizar a aplicação…</div>
        }
        return (
          <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
            <p style={{ marginTop: 0 }}>
              {isChunk
                ? 'A versão em cache ficou desactualizada após um deploy. Limpe a cache e recarregue.'
                : 'Ocorreu um erro inesperado. Recarregue a página.'}
            </p>
            {!isChunk && message ? (
              <pre
                style={{
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: '#f4f4f5',
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                {message.slice(0, 500)}
              </pre>
            ) : null}
            <button
              type="button"
              onClick={() => {
                void clearRuntimeCaches().finally(() => {
                  clearChunkRecoveryFlag()
                  const next = new URL(window.location.href)
                  next.searchParams.delete('__chunk_recover')
                  window.location.replace(`${next.pathname}${next.search}${next.hash}` || '/')
                })
              }}
            >
              Limpar cache e recarregar
            </button>
            {!isChunk ? (
              <button type="button" style={{ marginLeft: 8 }} onClick={resetError}>
                Tentar novamente
              </button>
            ) : null}
          </div>
        )
      }}
    >
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Sentry.ErrorBoundary>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app,
)

/** Boot OK → libertar a flag para um próximo deploy poder recuperar uma vez. */
if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    clearChunkRecoveryFlag()
  }, 8_000)
}
