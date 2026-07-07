import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { isContabilMode } from '@/shared/config/productMode'
import { authClientLoginUrl, authFirmLoginUrl } from '@/shared/constants/authPaths'
import type { Role } from '@/shared/types/auth'
import { useAuth } from '@/shared/hooks/useAuth'

export function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return null

  if (!user) {
    const isClientPath =
      location.pathname.startsWith('/app/client') || location.pathname.startsWith('/app/client')
    if (isContabilMode()) {
      return <Navigate to={isClientPath ? authClientLoginUrl() : authFirmLoginUrl()} replace />
    }
    return <Navigate to={isClientPath ? authClientLoginUrl() : authFirmLoginUrl()} replace />
  }

  const effectiveRole =
    user.role === 'FIRM_STAFF' && user.permissions.includes('firm:owner')
      ? 'FIRM_OWNER'
      : user.role

  if (!roles.includes(user.role) && !roles.includes(effectiveRole)) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
