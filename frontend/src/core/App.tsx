import { BrowserRouter, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import { Sentry } from '@/shared/lib/sentry'
import { ContabilAppRouter } from '@/shared/components/layout/ContabilAppRouter'
import { AppProviders, RouteCookieBanner, RouteToaster } from '@/shared/components/layout/AppProviders'
import i18n from '@/i18n'
import { APP_LOCALE_STORAGE_KEY, normalizeAppLocale } from '@/shared/i18n/appLocale'
import {
  applyAuthThemeToDocument,
  AUTH_THEME_STORAGE_KEY,
  pathnameUsesAuthTheme,
} from '@/features/authThemeDocument'

function RouteThemeSync() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const path = location.pathname
    if (path === '/') return

    if (pathnameUsesAuthTheme(path)) {
      try {
        const stored = window.localStorage.getItem(AUTH_THEME_STORAGE_KEY)
        applyAuthThemeToDocument(stored === 'dark' ? 'dark' : 'light')
      } catch {
        applyAuthThemeToDocument('light')
      }
      return
    }

    const root = document.documentElement
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }, [location.pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!location.pathname.startsWith('/app')) return

    if (Sentry) {
      Sentry.setTag('route.path', location.pathname)
      Sentry.setExtra('route.search', location.search)
      Sentry.setExtra('route.href', `${window.location.origin}${location.pathname}${location.search}`)
    }

    try {
      const langFromQuery = new URLSearchParams(location.search).get('lang')
      const stored = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)
      const nextLocale = langFromQuery
        ? normalizeAppLocale(langFromQuery)
        : stored
          ? normalizeAppLocale(stored)
          : 'pt-PT'
      if (i18n.language !== nextLocale) {
        void i18n.changeLanguage(nextLocale)
      }
      document.documentElement.lang = nextLocale
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, nextLocale)
    } catch {
      // noop
    }

    const selectors = [
      'script[src*="googletagmanager.com/gtag/js"]',
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    ]

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        try {
          if (typeof (node as Element).remove === 'function') {
            ; (node as Element).remove()
            return
          }
          const parent = node.parentNode
          if (parent && parent.contains(node)) {
            parent.removeChild(node)
          }
        } catch {
          // noop
        }
      })
    })
  }, [location.pathname, location.search])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteThemeSync />
      <AppProviders>
        <div data-testid="app-root" className="notranslate min-h-screen bg-background text-foreground" translate="no">
          <ContabilAppRouter />
          <RouteCookieBanner />
          <RouteToaster />
        </div>
      </AppProviders>
    </BrowserRouter>
  )
}
