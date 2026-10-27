import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { platformOpsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { getErrorMessage } from '@/shared/utils/errors'

const DRILLS = [
  {
    code: 'DRILL_START',
    title: '1. Começar drill',
    what: 'Marca no painel que estás a fazer testes. Aparece um alerta suave no Overview.',
    expect: 'Alerta [Lab] Drill red-team em curso',
    realAction: null as null | { label: string; to: string },
  },
  {
    code: 'SIMULATE_LOCKOUT_ALERT',
    title: '2. Simular alerta de lockout',
    what: 'Acende no Overview o mesmo tipo de aviso que verias com contas bloqueadas — sem bloquear ninguém de verdade.',
    expect: 'Alerta high [Lab] Simulação: lockout',
    realAction: {
      label: 'Depois testa de verdade em Logins',
      to: '/app/ops/logins',
    },
  },
  {
    code: 'SIMULATE_REGISTER_BURST',
    title: '3. Simular burst de registos',
    what: 'Simula o aviso de muitos gabinetes novos. Para o teste real: regista um gabinete em /auth/firm/register e vê o badge Novo.',
    expect: 'Alerta [Lab] burst de registos',
    realAction: { label: 'Ver gabinetes recentes', to: '/app/ops/firms' },
  },
  {
    code: 'SIMULATE_AUTHZ_SPIKE',
    title: '4. Simular spike authz',
    what: 'Simula muitos acessos recusados. No teste real, tenta APIs ops sem MFA / com outro email.',
    expect: 'Alerta medium [Lab] spike authz',
    realAction: { label: 'Abrir Audit', to: '/app/ops/audit' },
  },
] as const

const REAL_STEPS = [
  {
    title: 'Lockout real',
    body: 'Numa conta de teste (não a ops), falha o login 5+ vezes. Volta ao Overview — deve aparecer LOCKOUTS / LOGIN_FAIL_SPIKE. Limpa em Logins.',
    to: '/app/ops/logins',
  },
  {
    title: 'Gabinete novo (modo 1A)',
    body: 'Regista um escritório de teste. Sem bloqueio no cadastro. No Center: badge Novo + podes Suspender ou Cancelar.',
    to: '/app/ops/firms',
  },
  {
    title: 'Denylist IP',
    body: 'Bloqueia um IP público de teste (nunca o teu). Pedidos desse IP à API → 403. Remove depois.',
    to: '/app/ops/denylist',
  },
  {
    title: 'Sentry',
    body: 'Erros reais já vão para o Sentry (DSN). Aqui no painel a lista precisa de token API — vê a página Sentry.',
    to: '/app/ops/sentry',
  },
] as const

export function PlatformOpsSecurityLabPage() {
  const qc = useQueryClient()

  const signals = useQuery({
    queryKey: ['platform-ops', 'security-lab'],
    queryFn: () => platformOpsApi.securityLabSignals(),
    refetchInterval: 15_000,
  })

  const emit = useMutation({
    mutationFn: (code: string) => platformOpsApi.securityLabEmit({ code }),
    onSuccess: (res) => {
      toast.success(`Sinal ${res.signal} enviado — abre o Overview.`)
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ShieldAlert className="h-5 w-5 text-brand" aria-hidden />
          Laboratório de defesa
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Só em <strong>staging</strong>. Botões seguros que acendem alertas no Overview para treinares
          o painel. Os testes «a sério» (lockout, denylist) estão explicados em baixo — nunca contra
          produção.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
        <p className="font-medium">Como usar</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
          <li>Clica num botão de simulação abaixo.</li>
          <li>
            Abre o{' '}
            <Link to="/app/ops" className="text-brand hover:underline">
              Overview
            </Link>{' '}
            — o alerta com prefixo [Lab] deve aparecer.
          </li>
          <li>Depois faz o teste real correspondente (Logins / Gabinetes / Denylist).</li>
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DRILLS.map((d) => (
          <div key={d.code} className="flex flex-col rounded-xl border border-border/70 bg-card p-4">
            <h2 className="text-sm font-semibold">{d.title}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.what}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Esperado: <span className="font-medium text-foreground">{d.expect}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={emit.isPending}
                onClick={() => emit.mutate(d.code)}
              >
                {emit.isPending ? 'A enviar…' : 'Acender no painel'}
              </Button>
              {d.realAction ? (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link to={d.realAction.to}>{d.realAction.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold">Testes reais (staging)</h2>
        <ul className="mt-2 space-y-2">
          {REAL_STEPS.map((s) => (
            <li key={s.title} className="rounded-xl border border-border/70 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-muted-foreground">{s.body}</p>
                </div>
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link to={s.to}>Abrir</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Sinais recentes (24h)</h2>
        {signals.isLoading ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
          </p>
        ) : signals.isError ? (
          <p className="mt-2 text-sm text-destructive">{getErrorMessage(signals.error)}</p>
        ) : (signals.data?.items || []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Ainda sem sinais. Clica num botão acima.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border/50 rounded-xl border border-border/70">
            {signals.data!.items.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
                <span className="font-mono text-xs">{row.signal}</span>
                <time className="text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString('pt-PT')}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
