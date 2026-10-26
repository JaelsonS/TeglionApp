/**
 * Só contas platformOps usam /app/ops. Outras sessões firm vêem instrução + sair para login ops.
 */
import { Outlet } from 'react-router-dom'

import { AuthBootstrapFallback } from '@/shared/components/layout/AuthBootstrapFallback'
import { authOpsLoginUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'
import { isPlatformOpsUser } from '@/shared/utils/authNormalize'

export function PlatformOpsAccessGate() {
  const { user, logout, isBootstrapping } = useAuth()

  if (isBootstrapping) return <AuthBootstrapFallback />

  if (!isPlatformOpsUser(user)) {
    const email = String(user?.email || '').trim()
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Sem acesso ao Control Center</p>
        <p className="mt-2 text-muted-foreground">
          A sessão actual{email ? (
            <>
              {' '}
              (<span className="font-mono text-foreground">{email}</span>)
            </>
          ) : null}{' '}
          não é a conta allowlist do operador. Termine sessão e entre em{' '}
          <span className="font-mono text-foreground">/auth/ops/login</span> com o email autorizado.
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">código: PLATFORM_OPS_FORBIDDEN</p>
        <button
          type="button"
          className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          onClick={() => {
            void logout().finally(() => {
              window.location.assign(authOpsLoginUrl())
            })
          }}
        >
          Sair e abrir login do Control Center
        </button>
      </div>
    )
  }

  return <Outlet />
}
