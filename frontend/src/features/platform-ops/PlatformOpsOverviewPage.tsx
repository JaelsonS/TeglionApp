import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { platformOpsApi } from '@/infrastructure/api'
import { authOpsLoginUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'
import { cn } from '@/shared/lib/utils'
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
    { label: 'Gabinetes', value: overview.data.firmsTotal, warn: false },
    {
      label: 'Novos 24h / 7d',
      value: `${overview.data.firmsNew24h ?? '—'} / ${overview.data.firmsNew7d ?? '—'}`,
      warn: (overview.data.firmsNew24h || 0) >= 5,
    },
    {
      label: 'Eventos audit (24h)',
      value: overview.data.auditEventsLast24h,
      warn: overview.data.auditEventsLast24h >= 200,
    },
    {
      label: 'Contas em lockout',
      value: overview.data.lockedAccounts == null ? '—' : overview.data.lockedAccounts,
      warn: (overview.data.lockedAccounts || 0) > 0,
    },
  ]

  const anomalies = overview.data.anomalies || []
  const recent = overview.data.recentFirms || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sessão: {me.data?.email} · ambiente {me.data?.environment} · gerado{' '}
          {new Date(overview.data.generatedAt).toLocaleString('pt-PT')}
        </p>
      </div>

      {anomalies.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Alertas / anomalias</h2>
          <ul className="space-y-2">
            {anomalies.map((a) => (
              <li
                key={a.code}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm',
                  a.severity === 'high' && 'border-destructive/40 bg-destructive/5',
                  a.severity === 'medium' && 'border-amber-500/40 bg-amber-500/5',
                  a.severity === 'low' && 'border-border/70 bg-muted/30',
                )}
              >
                {a.href ? (
                  <Link to={a.href} className="font-medium text-brand hover:underline">
                    {a.message}
                  </Link>
                ) : (
                  <span className="font-medium">{a.message}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              'rounded-2xl border bg-card px-4 py-3',
              c.warn ? 'border-amber-500/50' : 'border-border/70',
            )}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      {recent.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold">Gabinetes recentes (7d)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Modo 1A — registo livre; monitorizar e suspender/cancelar se necessário.
          </p>
          <ul className="mt-2 divide-y divide-border/50 rounded-xl border border-border/70">
            {recent.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/app/ops/firms/${f.id}`} className="font-medium text-brand hover:underline">
                    {f.name}
                  </Link>
                  {f.isNew24h ? (
                    <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
                      Novo 24h
                    </span>
                  ) : f.isNew7d ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      Novo 7d
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{f.status || '—'}</span>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(f.createdAt).toLocaleString('pt-PT')}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Onda 2 Defesa: novos gabinetes, trial/cancelar, geo-IP, abuso, Sentry. Ver{' '}
        <code>docs/product/TEGLION_CONTROL_CENTER_CHARTER.md</code>.
      </p>
    </div>
  )
}
