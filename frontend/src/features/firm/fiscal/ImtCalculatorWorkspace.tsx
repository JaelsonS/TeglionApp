import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { EuroInput } from '@/shared/design-system'
import { contabilFiscalImtApi } from '@/infrastructure/api'
import type { ImtSimulation } from '@/infrastructure/api/contabil/fiscalImt'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

type TableOpt = { code: string; label: string }
type FlatOpt = { code: string; label: string; ratePercent: number }

export function ImtCalculatorWorkspace({ embedded = false }: { embedded?: boolean } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-imt-catalog'],
    queryFn: () => contabilFiscalImtApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-imt-history'],
    queryFn: () => contabilFiscalImtApi.list({ limit: 20 }),
  })
  const clientsQuery = useFirmClientsDirectory({ limit: 300 })

  const pack = catalogQuery.data?.packs?.[0]
  const tables: TableOpt[] = pack?.tables || []
  const flats: FlatOpt[] = pack?.flatRates || []

  const [mode, setMode] = useState<'table' | 'flat'>('table')
  const [tableCode, setTableCode] = useState('I')
  const [flatRateCode, setFlatRateCode] = useState('rustic')
  const [euros, setEuros] = useState(0)
  const [clientId, setClientId] = useState('')
  const [simulation, setSimulation] = useState<ImtSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (tables.length && !tables.some((t) => t.code === tableCode)) setTableCode(tables[0].code)
  }, [tables, tableCode])
  useEffect(() => {
    if (flats.length && !flats.some((f) => f.code === flatRateCode)) setFlatRateCode(flats[0].code)
  }, [flats, flatRateCode])

  const taxableValueCents = useMemo(() => Math.round(euros * 100), [euros])

  async function runSimulate(save: boolean) {
    if (taxableValueCents < 0) {
      toast.error('Indique o valor tributável')
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        taxableValueCents,
        ruleVersion: pack?.version,
        clientId: clientId || undefined,
      }
      if (mode === 'flat') payload.flatRateCode = flatRateCode
      else payload.tableCode = tableCode

      if (save) {
        const res = await contabilFiscalImtApi.save(payload)
        setSimulation(res.simulation)
        toast.success('Simulação guardada no histórico')
        await qc.invalidateQueries({ queryKey: ['fiscal-imt-history'] })
      } else {
        const res = await contabilFiscalImtApi.simulate(payload)
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
      title="Calculadora de IMT"
      subtitle="Imposto Municipal sobre as Transmissões — continente 2026. Simulação — não é liquidação oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Simulação de apoio</p>
        <p className="mt-1 text-amber-950/90">
          {catalogQuery.data?.disclaimer ||
            'Use o maior entre o preço e o VPT. Não inclui Imposto do Selo nem isenções.'}
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
              <p className="text-xs text-muted-foreground">Regras {pack?.version || '…'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                mode === 'table'
                  ? 'border-brand bg-brand/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground',
              )}
              onClick={() => setMode('table')}
            >
              Habitação (tabelas)
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                mode === 'flat'
                  ? 'border-brand bg-brand/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground',
              )}
              onClick={() => setMode('flat')}
            >
              Taxa fixa
            </button>
          </div>

          {mode === 'table' ? (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Tabela</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={tableCode}
                onChange={(e) => setTableCode(e.target.value)}
              >
                {tables.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code} — {t.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Tipo</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={flatRateCode}
                onChange={(e) => setFlatRateCode(e.target.value)}
              >
                {flats.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.label} ({f.ratePercent} %)
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Valor sobre que incide o IMT</span>
            <EuroInput value={euros} onChange={setEuros} />
            <span className="text-xs text-muted-foreground">Maior entre preço e valor patrimonial tributário.</span>
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
            <p className="text-sm text-muted-foreground">Indique o valor e calcule o IMT estimado.</p>
          ) : (
            <div className="space-y-3">
              <ResultRow label="IMT" value={formatEuroFromCents(simulation.result.imtCents)} strong />
              <ResultRow
                label={simulation.result.flat ? 'Taxa única' : 'Taxa marginal'}
                value={`${(simulation.result.rateMilli / 1000).toLocaleString('pt-PT', {
                  maximumFractionDigits: 2,
                })} %`}
              />
              {!simulation.result.flat && simulation.result.parcelaCents > 0 ? (
                <ResultRow
                  label="Parcela a abater"
                  value={formatEuroFromCents(simulation.result.parcelaCents)}
                />
              ) : null}
              <ResultRow
                label="Taxa efectiva"
                value={`${(simulation.result.effectiveBps / 100).toLocaleString('pt-PT', {
                  maximumFractionDigits: 2,
                })} %`}
              />
              <p className="text-xs text-muted-foreground">{simulation.regime.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{simulation.disclaimer}</p>
              <p className="text-[11px] text-muted-foreground">Versão {simulation.ruleVersion}</p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Histórico recente</h2>
        {historyQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">A carregar…</p>
        ) : (historyQuery.data?.items || []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Ainda sem simulações IMT guardadas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/50">
            {(historyQuery.data?.items || []).map(
              (row: {
                id: string
                ruleVersion: string
                createdAt: string
                result: { imtCents?: number }
                meta?: { regime?: { label?: string } }
              }) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString('pt-PT')} ·{' '}
                    {row.meta?.regime?.label || row.ruleVersion}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatEuroFromCents(row.result?.imtCents ?? 0)}
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
