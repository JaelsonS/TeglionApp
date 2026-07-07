import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { consentsApi } from '@/infrastructure/api'
import { APP_LOCALE } from '@/shared/i18n/appLocale'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'
import { loadThirdPartyScripts } from '@/shared/utils/thirdPartyScripts'

const CONSENT_ACCEPTED = 'accepted'
const CONSENT_REJECTED = 'rejected'
const ANON_CONSENT_KEY = 'cookieConsent:anonymous'

const COOKIE_BANNER_COPY = {
  title: 'Cookies',
  description:
    'Usamos cookies para manter a sessão e melhorar a experiência. Pode aceitar ou rejeitar; cookies essenciais podem ser necessários para login.',
  linkLabel: 'Política de Cookies',
  accept: 'Aceitar cookies',
  reject: 'Rejeitar',
  error: 'Não foi possível registar o consentimento de cookies',
} as const

function getCacheKey(userId: string) {
  return `cookieConsent:${userId}`
}

function updateGtagConsent(granted: boolean) {
  if (typeof window === 'undefined') return
  const gtag = (window as any).gtag
  if (typeof gtag !== 'function') return

  gtag('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  })
}

export function CookieBanner() {
  const { user, isAuthenticated, isBootstrapping } = useAuth()
  const { t } = useTranslation('common')
  const copy = COOKIE_BANNER_COPY
  const location = useLocation()
  const isAppRoute = location.pathname.startsWith('/app')
  const isMarketingRoute =
    location.pathname === '/' || location.pathname === '/blog' || location.pathname.startsWith('/blog/')

  const userId = user?.id
  const cacheKey = useMemo(() => (userId ? getCacheKey(userId) : ANON_CONSENT_KEY), [userId])

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isMarketingRoute || isAppRoute) return
    if (isBootstrapping) return
    if (!cacheKey) return

    const cached = window.localStorage.getItem(cacheKey)
    if (cached === CONSENT_ACCEPTED || cached === CONSENT_REJECTED) {
      if (isMarketingRoute) {
        updateGtagConsent(cached === CONSENT_ACCEPTED)
        if (cached === CONSENT_ACCEPTED) {
          loadThirdPartyScripts().catch(() => {})
        }
      }
      setVisible(false)
      return
    }

    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        if (isAuthenticated && userId) {
          const res = await consentsApi.getCookies()
          if (cancelled) return

          if (res?.accepted) {
            if (isMarketingRoute) {
              updateGtagConsent(true)
              loadThirdPartyScripts().catch(() => {})
            }
            window.localStorage.setItem(cacheKey, CONSENT_ACCEPTED)
            setVisible(false)
            return
          }
        }

        setVisible(true)
      } catch {
        
        if (!cancelled) setVisible(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isBootstrapping, userId, cacheKey])

  const accept = async () => {
    if (!cacheKey) return

    setLoading(true)
    try {
      if (isAuthenticated && userId) {
        await consentsApi.acceptCookies({ version: '1.0', locale: APP_LOCALE })
      }
      if (isMarketingRoute) {
        updateGtagConsent(true)
        loadThirdPartyScripts().catch(() => {})
      }
      window.localStorage.setItem(cacheKey, CONSENT_ACCEPTED)
      setVisible(false)
    } catch (err) {
      toast.error(copy.error, {
        description: getErrorMessage(err),
      })
    } finally {
      setLoading(false)
    }
  }

  const reject = () => {
    if (!cacheKey) return
    window.localStorage.setItem(cacheKey, CONSENT_REJECTED)
    updateGtagConsent(false)
    setVisible(false)
  }

  if (!isMarketingRoute || isAppRoute || !visible) return null

  return (
    <div
      data-testid="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background no-print"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-foreground">
          <h2 id="cookie-banner-title" className="sr-only">{copy.title}</h2>
          <p id="cookie-banner-description">
            {copy.description}{' '}
            <Link to="/cookies" className="text-teal-700 hover:text-teal-600 underline dark:text-teal-200 dark:hover:text-teal-100">
              {copy.linkLabel}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-testid="cookie-banner-reject"
            className="rounded-full"
            onClick={reject}
            disabled={loading}
          >
            {copy.reject}
          </Button>
          <Button
            data-testid="cookie-banner-accept"
            className="rounded-full text-white"
            onClick={accept}
            disabled={loading}
          >
            {loading ? t('loading') : copy.accept}
          </Button>
        </div>
      </div>
    </div>
  )
}
