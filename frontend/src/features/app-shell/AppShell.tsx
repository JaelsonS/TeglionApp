import { Navigate } from 'react-router-dom'

import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'
import { FIRM_APP_ROLES } from '@/shared/constants/contabilRoles'
import { authFirmLoginUrl } from '@/shared/constants/authPaths'
import type { Role } from '@/shared/types/auth'
import { useAuth } from '@/shared/hooks/useAuth'
import { isPlatformOpsUser } from '@/shared/utils/authNormalize'

/** Redireciona `/app` para o painel correcto consoante o papel. */
export function AppShell() {
  const { user, isBootstrapping } = useAuth()
  const role = user?.role ?? null

  if (isBootstrapping) return <PageRouteFallback />

  if (role === 'CLIENT') return <Navigate to="/app/client" replace />
  // Control Center AfDigital — nunca o dashboard comercial do gabinete.
  if (isPlatformOpsUser(user)) return <Navigate to="/app/ops" replace />
  if (role && FIRM_APP_ROLES.includes(role as Role)) {
    return <Navigate to="/app/firm/dashboard" replace />
  }

  return <Navigate to={authFirmLoginUrl()} replace />
}
