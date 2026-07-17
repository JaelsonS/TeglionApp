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
import { isLightweightPublicRoute } from '@/shared/utils/publicRoutes'

const CHUNK_RECOVERY_KEY = 'teglion.chunk-recovery'

function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return

  const shouldRecover = (value: unknown): boolean => {
    const text = String(value || '')
    return (
      text.includes('Failed to fetch dynamically imported module') ||
      text.includes('Importing a module script failed') ||
      text.includes('Loading chunk') ||
      text.includes('/assets/')
    )
  }

  const clearRuntimeCaches = async () => {
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

  const hardReloadWithBust = () => {
    const next = new URL(window.location.href)
    next.searchParams.set('__chunk_recover', String(Date.now()))
    window.location.replace(next.toString())
  }

  const recoverOnce = () => {
    try {
      if (window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1') return
      window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
    } catch {
      // noop
    }
    void clearRuntimeCaches().finally(() => {
      hardReloadWithBust()
    })
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason
    const message = reason?.message || reason
    if (shouldRecover(message)) recoverOnce()
  })

  window.addEventListener('error', (event) => {
    const err = event as ErrorEvent
    const message = err.message || ''
    const source = err.filename || ''
    if (shouldRecover(message) || shouldRecover(source)) recoverOnce()
  })

  try {
    if (new URL(window.location.href).searchParams.has('__chunk_recover')) {
      window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY)
    }
  } catch {
    // noop
  }
}

function isPwaEnabled(): boolean {
  return String(import.meta.env.VITE_ENABLE_PWA || '').toLowerCase() === 'true'
}

async function disableExistingPwaRegistrations(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
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
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }
  if (w.requestIdleCallback) {
    w.requestIdleCallback(() => loadGoogleFonts(), { timeout: 2500 })
  } else {
    window.setTimeout(loadGoogleFonts, 1500)
  }
}

if (typeof window !== 'undefined' && !isLightweightPublicRoute(window.location.pathname)) {
  void import('@/shared/styles/contabil.css')
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

if (import.meta.env.PROD && !isPwaEnabled()) {
  void disableExistingPwaRegistrations()
}

if (import.meta.env.PROD && isPwaEnabled() && 'serviceWorker' in navigator && shouldRegisterPwa(window.location.pathname)) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true)
    },
    onRegisteredSW(_url, registration) {
      registration?.update().catch(() => { })
    },
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => {
        const message = error instanceof Error ? error.message : String(error || '')
        const isChunk =
          message.includes('Failed to fetch dynamically imported module') ||
          message.includes('Importing a module script failed') ||
          message.includes('Loading chunk')
        if (isChunk && typeof window !== 'undefined') {
          try {
            if (window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) !== '1') {
              window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
              const next = new URL(window.location.href)
              next.searchParams.set('__chunk_recover', String(Date.now()))
              window.location.replace(next.toString())
              return <div>A actualizar a aplicação…</div>
            }
          } catch {
            // fall through
          }
        }
        return (
          <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <p>Ocorreu um erro inesperado. Recarregue a página.</p>
            <button type="button" onClick={resetError}>
              Tentar novamente
            </button>
          </div>
        )
      }}
    >
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
