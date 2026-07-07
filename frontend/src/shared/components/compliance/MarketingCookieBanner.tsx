import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'

const CONSENT_ACCEPTED = 'accepted'
const CONSENT_REJECTED = 'rejected'
const ANON_CONSENT_KEY = 'cookieConsent:anonymous'

const COPY = {
  title: 'Cookies',
  description:
    'Usamos cookies para melhorar a experiência e medir visitas ao blog. Pode aceitar ou rejeitar; cookies essenciais mantêm o site a funcionar.',
  linkLabel: 'Política de Cookies',
  accept: 'Aceitar cookies',
  reject: 'Rejeitar',
} as const

/** Banner leve para landing/blog — sem AuthContext nem API. */
export function MarketingCookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cached = window.localStorage.getItem(ANON_CONSENT_KEY)
    if (cached === CONSENT_ACCEPTED || cached === CONSENT_REJECTED) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  const accept = () => {
    window.localStorage.setItem(ANON_CONSENT_KEY, CONSENT_ACCEPTED)
    setVisible(false)
  }

  const reject = () => {
    window.localStorage.setItem(ANON_CONSENT_KEY, CONSENT_REJECTED)
    setVisible(false)
  }

  if (!visible) return null

  return (
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
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full" onClick={reject}>
            {COPY.reject}
          </Button>
          <Button className="rounded-full text-white" onClick={accept}>
            {COPY.accept}
          </Button>
        </div>
      </div>
    </div>
  )
}
