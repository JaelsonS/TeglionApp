import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { EuroInput } from '@/shared/design-system'
import { contabilFiscalIrsApi } from '@/infrastructure/api'
import type { IrsSimulation } from '@/infrastructure/api/contabil/fiscalIrs'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

function formatRateMilli(milli: number) {
  const pct = milli / 1000
  return `${pct.toLocaleString('pt-PT', { maximumFractionDigits: 3 })} %`
}

export function IrsCalculatorWorkspace({ embedded = false }: { embedded?: boolean } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-irs-catalog'],
    queryFn: () => contabilFiscalIrsApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-irs-history'],
    queryFn: () => contabilFiscalIrsApi.list({ limit: 20 }),
  })
  const clientsQuery = useFirmClientsDirectory({ limit: 300 })

  const pack = catalogQuery.data?.packs?.[0]

  const [euros, setEuros] = useState(0)
  const [filingStatus, setFilingStatus] = useState<'single' | 'joint'>('single')
  const [includeSolidarity, setIncludeSolidarity] = useState(true)
  const [clientId, setClientId] = useState('')
  const [simulation, setSimulation] = useState<IrsSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  const taxableIncomeCents = useMemo(() => Math.round(euros * 100), [euros])

  async function runSimulate(save: boolean) {
    if (taxableIncomeCents < 0) {
      toast.error('Indique o rendimento coletável')
      return
    }
    setBusy(true)
    try {
      const payload = {
        taxableIncomeCents,
        filingStatus,
        includeSolidarity,
        ruleVersion: pack?.version,
        clientId: clientId || undefined,
      }
      if (save) {
        const res = await contabilFiscalIrsApi.save(payload)
        setSimulation(res.simulation)
        toast.success('Simulação guardada no histórico')
        await qc.invalidateQueries({ queryKey: ['fiscal-irs-history'] })
      } else {
        const res = await contabilFiscalIrsApi.simulate(payload)
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
      title="Calculadora de IRS"
      subtitle="Coleta estimada sobre rendimento coletável (escalões gerais, continente). Versionada — não é declaração oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Simulação de apoio</p>
        <p className="mt-1 text-amber-950/90">
          {catalogQuery.data?.disclaimer ||
            'Indique o rendimento coletável já determinado. Não calcula deduções nem retenções.'}
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
                {pack?.source?.label ? ` · ${pack.source.label}` : ''}
              </p>
            </div>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Rendimento coletável anual</span>
            <EuroInput value={euros} onChange={setEuros} />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                filingStatus === 'single'
                  ? 'border-brand bg-brand/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground',
              )}
              onClick={() => setFilingStatus('single')}
            >
              Não casado / separado
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                filingStatus === 'joint'
                  ? 'border-brand bg-brand/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground',
              )}
              onClick={() => setFilingStatus('joint')}
            >
              Tributação conjunta
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={includeSolidarity}
              onChange={(e) => setIncludeSolidarity(e.target.checked)}
            />
            <span>Incluir taxa adicional de solidariedade (art. 68.º-A)</span>
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
            <p className="text-sm text-muted-foreground">
              Indique o rendimento coletável e calcule para ver a coleta estimada.
            </p>
          ) : (
            <div className="space-y-3">
              <ResultRow label="Coleta (escalões)" value={formatEuroFromCents(simulation.result.taxCents)} />
              {simulation.input.includeSolidarity ? (
                <ResultRow
                  label="Solidariedade"
                  value={formatEuroFromCents(simulation.result.solidarityCents)}
                />
              ) : null}
              <ResultRow
                label="Total estimado"
                value={formatEuroFromCents(simulation.result.totalCents)}
                strong
              />
              <ResultRow
                label="Taxa efectiva"
                value={`${(simulation.result.effectiveBps / 100).toLocaleString('pt-PT', {
                  maximumFractionDigits: 2,
                })} %`}
              />
              {simulation.result.parts?.length ? (
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Discriminação
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {simulation.result.parts.map((p, i) => (
                      <li key={`${p.kind}-${i}`} className="flex justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {formatEuroFromCents(p.baseCents)} × {formatRateMilli(p.rateMilli)}
                        </span>
                        <span className="tabular-nums">{formatEuroFromCents(p.taxCents)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
          <p className="mt-3 text-sm text-muted-foreground">Ainda sem simulações IRS guardadas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/50">
            {(historyQuery.data?.items || []).map(
              (row: {
                id: string
                ruleVersion: string
                createdAt: string
                result: { totalCents?: number; taxCents?: number }
              }) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString('pt-PT')} · {row.ruleVersion}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatEuroFromCents(row.result?.totalCents ?? row.result?.taxCents ?? 0)}
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
