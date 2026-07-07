import { useEffect, useState } from 'react'

import { GoogleAuthButton } from '@/shared/components/auth/GoogleAuthButton'
import { getGoogleAuthStartUrl } from '@/infrastructure/api'
import { api } from '@/infrastructure/http/apiClient'
import { cn } from '@/shared/lib/utils'

type SsoStatus = { google: boolean; providers: string[] }

export function AuthEasySignIn({
  mode,
  countryCode = 'PT',
  className,
}: {
  mode: 'login' | 'register'
  countryCode?: string
  className?: string
}) {
  const [sso, setSso] = useState<SsoStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void api
      .get<SsoStatus>('/auth/sso/status')
      .then((res) => {
        if (!cancelled) setSso(res.data)
      })
      .catch(() => {
        if (!cancelled) setSso({ google: false, providers: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const googleEnabled = sso?.google === true
  const googleLabel = mode === 'register' ? 'Continuar com Google' : 'Entrar com Google'
  const googleHref = getGoogleAuthStartUrl({
    intent: mode === 'register' ? 'register' : 'login',
    countryCode: mode === 'register' ? countryCode : undefined,
  })

  return (
    <div className={cn('space-y-3', className)}>
      <GoogleAuthButton href={googleHref} label={googleLabel} disabled={sso !== null && !googleEnabled} />
    </div>
  )
}
