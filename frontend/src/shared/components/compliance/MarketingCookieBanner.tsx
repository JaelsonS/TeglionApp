import { useEffect, useState } from 'react'
import { Cookie } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CookiePreferencesDialog } from '@/shared/components/compliance/CookiePreferencesDialog'
import { Button } from '@/shared/components/ui/button'
import {
  hasStoredCookieConsent,
  OPEN_COOKIE_PREFS_EVENT,
  readCookiePrefs,
  updateGtagConsent,
  writeCookiePrefs,
  type CookiePrefs,
} from '@/shared/utils/cookieConsent'
import { loadAdSenseScript, loadThirdPartyScripts } from '@/shared/utils/thirdPartyScripts'
import { ensureContabilStyles } from '@/shared/styles/loadContabilStyles'
import { cn } from '@/shared/lib/utils'

const COPY = {
  title: 'Cookies',
  description:
    'Usamos cookies para melhorar a experiência e medir visitas. Pode aceitar, rejeitar ou escolher categorias; cookies essenciais mantêm o site a funcionar.',
  linkLabel: 'Política de Cookies',
  accept: 'Aceitar cookies',
  reject: 'Rejeitar',
  manage: 'Gerir',
} as const

function applyTrackers(prefs: CookiePrefs) {
  updateGtagConsent({ analytics: prefs.analytics, advertising: prefs.advertising })
  if (prefs.analytics) {
    loadThirdPartyScripts().catch(() => {})
  }
  if (prefs.advertising) {
    loadAdSenseScript().catch(() => {})
  }
}

/** Banner leve para landing/blog — sem AuthContext nem API. */
export function MarketingCookieBanner() {
  const [bannerVisible, setBannerVisible] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [hasChoice, setHasChoice] = useState(false)
  const [prefs, setPrefs] = useState<CookiePrefs>({
    essential: true,
    analytics: false,
    advertising: false,
  })

  useEffect(() => {
    const stored = hasStoredCookieConsent()
    setHasChoice(stored)
    if (stored) {
      const current = readCookiePrefs()
      setPrefs(current)
      applyTrackers(current)
      setBannerVisible(false)
      return
    }
    const timer = window.setTimeout(() => setBannerVisible(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    function onOpen() {
      ensureContabilStyles()
      setPrefs(readCookiePrefs())
      setPrefsOpen(true)
      setBannerVisible(false)
    }
    window.addEventListener(OPEN_COOKIE_PREFS_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_COOKIE_PREFS_EVENT, onOpen)
  }, [])

  function persist(next: CookiePrefs) {
    writeCookiePrefs(next)
    applyTrackers(next)
    setPrefs(next)
    setHasChoice(true)
    setBannerVisible(false)
    setPrefsOpen(false)
  }

  const accept = () => persist({ essential: true, analytics: true, advertising: true })
  const reject = () => persist({ essential: true, analytics: false, advertising: false })
  const save = () => persist(prefs)

  return (
    <>
      {bannerVisible ? (
        <div
          data-testid="cookie-banner"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background no-print"
          role="dialog"
          aria-labelledby="marketing-cookie-title"
          aria-describedby="marketing-cookie-description"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-foreground">
              <h2 id="marketing-cookie-title" className="sr-only">
                {COPY.title}
              </h2>
              <p id="marketing-cookie-description">
                {COPY.description}{' '}
                <Link to="/cookies" className="text-teal-700 underline hover:text-teal-600">
                  {COPY.linkLabel}
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  ensureContabilStyles()
                  setPrefsOpen(true)
                }}
              >
                {COPY.manage}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={reject}>
                {COPY.reject}
              </Button>
              <Button className="rounded-full text-white" onClick={accept}>
                {COPY.accept}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {hasChoice && !bannerVisible ? (
        <button
          type="button"
          data-testid="cookie-prefs-icon"
          className={cn(
            'fixed z-40 flex h-8 w-8 items-center justify-center rounded-full',
            'bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-[max(0.75rem,env(safe-area-inset-left,0px))]',
            'border border-slate-300/80 bg-white text-slate-500 shadow-sm',
            'transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          )}
          aria-label="Gerir cookies"
          title="Cookies"
          onClick={() => {
            ensureContabilStyles()
            setPrefs(readCookiePrefs())
            setPrefsOpen(true)
          }}
        >
          <Cookie className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}

      <CookiePreferencesDialog
        open={prefsOpen}
        prefs={prefs}
        onPrefsChange={setPrefs}
        onSave={save}
        onAcceptAll={accept}
        onReject={reject}
        onClose={() => setPrefsOpen(false)}
      />
    </>
  )
}
