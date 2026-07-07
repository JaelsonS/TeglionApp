import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/shared/hooks/useAuth'
import { logger } from '@/shared/utils/logger'

export function RequireClientFirmAccess({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    async function validate() {
      if (!user || user.role !== 'CLIENT' || !user.tenant?.slug) {
        if (mounted) setAllowed(false)
        return
      }
      try {
        if (mounted) setAllowed(true)
      } catch (error) {
        logger.warn('[RequireClientFirmAccess] Falha ao validar vínculo', error)
        if (mounted) setAllowed(false)
      }
    }
    void validate()
    return () => {
      mounted = false
    }
  }, [user])

  if (allowed === null) return null
  if (!allowed) return <Navigate to="/app/client/no-access" replace />

  return <>{children}</>
}
