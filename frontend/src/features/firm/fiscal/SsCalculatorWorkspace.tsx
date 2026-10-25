import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { EuroInput } from '@/shared/design-system'
import { contabilFiscalSsApi } from '@/infrastructure/api'
import type { SsSimulation } from '@/infrastructure/api/contabil/fiscalSs'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

type Regime = {
  code: string
  label: string
  kind: string
  workerBps: number
  employerBps: number
  totalBps: number
}

export function SsCalculatorWorkspace({ embedded = false }: { embedded?: boolean } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-ss-catalog'],
    queryFn: () => contabilFiscalSsApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-ss-history'],
    queryFn: () => contabilFiscalSsApi.list({ limit: 20 }),
  })
  const clientsQuery = useFirmClientsDirectory({ limit: 300 })

  const pack = catalogQuery.data?.packs?.[0]
  const regimes: Regime[] = pack?.regimes || []

  const [regimeCode, setRegimeCode] = useState('tco_lucrativo')
  const [euros, setEuros] = useState(0)
  const [tiMode, setTiMode] = useState<'base' | 'services'>('base')
  const [clientId, setClientId] = useState('')
  const [simulation, setSimulation] = useState<SsSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (regimes.length && !regimes.some((r) => r.code === regimeCode)) {
      setRegimeCode(regimes[0].code)
    }
  }, [regimes, regimeCode])

  const selected = useMemo(
    () => regimes.find((r) => r.code === regimeCode) || null,
    [regimes, regimeCode],
  )
  const isTi = selected?.kind === 'self_employed'
  const amountCents = useMemo(() => Math.round(euros * 100), [euros])

  async function runSimulate(save: boolean) {
    if (amountCents < 0) {
      toast.error('Indique um valor')
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        regimeCode,
        ruleVersion: pack?.version,
        clientId: clientId || undefined,
      }
      if (isTi && tiMode === 'services') {
        payload.servicesCents = amountCents
      } else {
        payload.baseCents = amountCents
      }
      if (save) {
        const res = await contabilFiscalSsApi.save(payload)
        setSimulation(res.simulation)
        toast.success('Simulação guardada no histórico')
        await qc.invalidateQueries({ queryKey: ['fiscal-ss-history'] })
      } else {
        const res = await contabilFiscalSsApi.simulate(payload)
        setSimulation(res.simulation)
      }
    } catch (err) {
      toast.error('Não foi possível calcular', { description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <FirmModuleShell
      embedded={embedded}
      title="Calculadora de Segurança Social"
      subtitle="Contribuições TCO e TI com taxas 2026. Resultado guardável e versionado — não é declaração oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Simulação de apoio</p>
        <p className="mt-1 text-amber-950/90">
          {catalogQuery.data?.disclaimer ||
            'Confirme sempre o enquadramento na Segurança Social Direta.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Calculator className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Calcular</h2>
              <p className="text-xs text-muted-foreground">
                Regras {pack?.version || '…'}
                {pack?.iasCents != null
                  ? ` · IAS ${formatEuroFromCents(pack.iasCents)}`
                  : ''}
              </p>
            </div>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Regime</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={regimeCode}
              onChange={(e) => setRegimeCode(e.target.value)}
            >
              {regimes.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {isTi ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm',
                  tiMode === 'base'
                    ? 'border-brand bg-brand/10 font-medium text-foreground'
                    : 'border-border text-muted-foreground',
                )}
                onClick={() => setTiMode('base')}
              >
                Base de incidência
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm',
                  tiMode === 'services'
                    ? 'border-brand bg-brand/10 font-medium text-foreground'
                    : 'border-border text-muted-foreground',
                )}
                onClick={() => setTiMode('services')}
              >
                Prestação de serviços (70 %)
              </button>
            </div>
          ) : null}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">
              {isTi && tiMode === 'services'
                ? 'Valor da prestação de serviços'
                : isTi
                  ? 'Base de incidência'
                  : 'Remuneração ilíquida'}
            </span>
            <EuroInput value={euros} onChange={setEuros} />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Cliente (opcional)</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">— Sem cliente —</option>
              {(clientsQuery.data?.items || []).map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.displayName || c.fullName || c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={() => void runSimulate(false)} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Calcular
            </Button>
            <Button type="button" variant="outline" onClick={() => void runSimulate(true)} disabled={busy}>
              Calcular e guardar
            </Button>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Resultado</h2>
          {!simulation ? (
            <p className="text-sm text-muted-foreground">Indique um valor e calcule para ver as contribuições.</p>
          ) : (
            <div className="space-y-3">
              <ResultRow label="Base usada" value={formatEuroFromCents(simulation.result.baseCents)} />
              {simulation.result.relevantIncomeCents != null ? (
                <ResultRow
                  label="Rendimento relevante (70 %)"
                  value={formatEuroFromCents(simulation.result.relevantIncomeCents)}
                />
              ) : null}
              <ResultRow
                label={`Trabalhador (${simulation.regime.workerPercent} %)`}
                value={formatEuroFromCents(simulation.result.workerCents)}
              />
              {simulation.regime.employerPercent > 0 ? (
                <ResultRow
                  label={`Entidade (${simulation.regime.employerPercent} %)`}
                  value={formatEuroFromCents(simulation.result.employerCents)}
                />
              ) : null}
              <ResultRow
                label="Total"
                value={formatEuroFromCents(simulation.result.totalCents)}
                strong
              />
              <p className="text-xs leading-relaxed text-muted-foreground">{simulation.disclaimer}</p>
              <p className="text-[11px] text-muted-foreground">Versão {simulation.ruleVersion}</p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Histórico recente</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Cálculos guardados não mudam se as regras futuras forem actualizadas.
        </p>
        {historyQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">A carregar…</p>
        ) : (historyQuery.data?.items || []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Ainda sem simulações SS guardadas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/50">
            {(historyQuery.data?.items || []).map(
              (row: {
                id: string
                ruleVersion: string
                createdAt: string
                result: { totalCents?: number }
                meta?: { regime?: { label?: string } }
              }) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString('pt-PT')} ·{' '}
                    {row.meta?.regime?.label || row.ruleVersion}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatEuroFromCents(row.result?.totalCents ?? 0)}
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </FirmModuleShell>
  )
}

function ResultRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums text-sm', strong && 'text-base font-semibold')}>{value}</span>
    </div>
  )
}
