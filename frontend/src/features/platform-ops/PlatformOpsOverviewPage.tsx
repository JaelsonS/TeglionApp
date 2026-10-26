import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { platformOpsApi } from '@/infrastructure/api'
import { authOpsLoginUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsOverviewPage() {
  const { user, logout } = useAuth()
  const me = useQuery({ queryKey: ['platform-ops', 'me'], queryFn: () => platformOpsApi.me() })
  const overview = useQuery({
    queryKey: ['platform-ops', 'overview'],
    queryFn: () => platformOpsApi.overview(),
    refetchInterval: 60_000,
  })

  if (me.isError || overview.isError) {
    const err = me.error || overview.error
    const code = String(
      (err as { response?: { data?: { code?: string } } })?.response?.data?.code || '',
    ).toUpperCase()
    const sessionEmail = String(user?.email || '').trim()
    const hint =
      code === 'PLATFORM_OPS_MFA_REQUIRED'
        ? 'Active a autenticação de dois factores (Definições → Segurança) com a conta allowlist e volte a entrar.'
        : code === 'PLATFORM_OPS_DISABLED'
          ? 'No Render staging defina PLATFORM_OPS_ENABLED=true e faça redeploy.'
          : code === 'PLATFORM_OPS_ALLOWLIST_EMPTY' || code === 'PLATFORM_OPS_ALLOWLIST_INVALID'
            ? 'PLATFORM_OPS_EMAIL_ALLOWLIST deve ter exactamente 1 email (ex.: afdigitalweb.st@gmail.com).'
            : code === 'PLATFORM_OPS_FORBIDDEN'
              ? `A sessão${sessionEmail ? ` (${sessionEmail})` : ''} não está na allowlist do Render. Confirme PLATFORM_OPS_EMAIL_ALLOWLIST=afdigitalweb.st@gmail.com, saia e entre em /auth/ops/login.`
              : 'Confirme: (1) login ops com o email allowlist, (2) MFA activo, (3) PLATFORM_OPS_ENABLED=true no Render.'

    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">Sem acesso ao Control Center</p>
        <p className="mt-1 text-muted-foreground">{getErrorMessage(err)}</p>
        <p className="mt-2 text-muted-foreground">{hint}</p>
        {code ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">código: {code}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3">
          {code === 'PLATFORM_OPS_MFA_REQUIRED' ? (
            <Link to="/app/firm/settings" className="text-brand underline-offset-2 hover:underline">
              Abrir Definições / MFA
            </Link>
          ) : null}
          <button
            type="button"
            className="text-brand underline-offset-2 hover:underline"
            onClick={() => {
              void logout().finally(() => {
                window.location.assign(authOpsLoginUrl())
              })
            }}
          >
            Sair e entrar no Control Center
          </button>
        </div>
      </div>
    )
  }

  if (me.isLoading || overview.isLoading || !overview.data) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar overview…
      </p>
    )
  }

  const cards = [
    { label: 'Gabinetes', value: overview.data.firmsTotal },
    { label: 'Utilizadores firm activos', value: overview.data.activeFirmUsers },
    { label: 'Eventos audit (24h)', value: overview.data.auditEventsLast24h },
    {
      label: 'Contas em lockout',
      value: overview.data.lockedAccounts == null ? '—' : overview.data.lockedAccounts,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sessão: {me.data?.email} · ambiente {me.data?.environment} · gerado{' '}
          {new Date(overview.data.generatedAt).toLocaleString('pt-PT')}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Onda 0: leitura de sinais existentes (audit + lockouts). Próximo: filtros, anomalias e aprovação de
        registo. Documentação em <code>docs/product/TEGLION_CONTROL_CENTER_CHARTER.md</code>.
      </p>
    </div>
  )
}
