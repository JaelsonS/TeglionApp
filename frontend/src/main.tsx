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
    <Sentry.ErrorBoundary fallback={<div>Ocorreu um erro inesperado. Recarregue a página.</div>}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
