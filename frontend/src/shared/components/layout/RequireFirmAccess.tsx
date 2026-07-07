import { Navigate, useLocation } from 'react-router-dom'

import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { useAuth } from '@/shared/hooks/useAuth'
import { useFirmAccess } from '@/shared/hooks/useFirmAccess'
import { isFirmSessionUser } from '@/shared/utils/authNormalize'
import { authFirmLoginUrl } from '@/shared/constants/authPaths'

/** Rotas acessíveis mesmo com trial expirado ou subscrição inactiva. */
const BILLING_ESCAPE_PREFIXES = ['/app/firm/billing']

export function RequireFirmAccess({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const firmSession = isFirmSessionUser(user)
  const { status, isLoading, hasAccess, trialEndsAt } = useFirmAccess(firmSession)

  const onBillingEscape = BILLING_ESCAPE_PREFIXES.some((p) => location.pathname.startsWith(p))

  if (!firmSession) {
    if (user?.role === 'CLIENT') {
      return <Navigate to="/app/client" replace />
    }
    return <Navigate to={authFirmLoginUrl()} replace />
  }

  if (isLoading && status == null) return <PageRouteFallback />

  if (!hasAccess && !onBillingEscape) {
    if (status === 'SUSPENDED' || status === 'CANCELED' || status === 'CANCELLED') {
      return <Navigate to="/app/firm/billing" replace />
    }
    if (status === 'PAST_DUE') {
      return <Navigate to="/app/firm/billing" replace />
    }
    if (status === 'TRIAL' && trialEndsAt && trialEndsAt <= new Date()) {
      return <Navigate to="/app/firm/billing" replace />
    }
  }

  return <>{children}</>
}
