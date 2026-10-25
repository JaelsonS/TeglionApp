import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { EuroInput } from '@/shared/design-system'
import { contabilFiscalWithholdingApi } from '@/infrastructure/api'
import type { WithholdingSimulation } from '@/infrastructure/api/contabil/fiscalWithholding'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

type TableOpt = { code: string; label: string; minDependents?: number }

export function WithholdingCalculatorWorkspace({ embedded = false }: { embedded?: boolean } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-wh-catalog'],
    queryFn: () => contabilFiscalWithholdingApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-wh-history'],
    queryFn: () => contabilFiscalWithholdingApi.list({ limit: 20 }),
  })
  const clientsQuery = useFirmClientsDirectory({ limit: 300 })

  const pack = catalogQuery.data?.packs?.[0]
  const tables: TableOpt[] = pack?.tables || []

  const [tableCode, setTableCode] = useState('I')
  const [euros, setEuros] = useState(0)
  const [dependents, setDependents] = useState(0)
  const [clientId, setClientId] = useState('')
  const [simulation, setSimulation] = useState<WithholdingSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (tables.length && !tables.some((t) => t.code === tableCode)) {
      setTableCode(tables[0].code)
    }
  }, [tables, tableCode])

  const selected = useMemo(() => tables.find((t) => t.code === tableCode), [tables, tableCode])
  const minDeps = selected?.minDependents || 0

  useEffect(() => {
    if (dependents < minDeps) setDependents(minDeps)
  }, [minDeps, dependents])

  const remunerationCents = useMemo(() => Math.round(euros * 100), [euros])

  async function runSimulate(save: boolean) {
    if (remunerationCents < 0) {
      toast.error('Indique a remuneração mensal')
      return
    }
    setBusy(true)
    try {
      const payload = {
        tableCode,
        remunerationCents,
        dependents,
        ruleVersion: pack?.version,
        clientId: clientId || undefined,
      }
      if (save) {
        const res = await contabilFiscalWithholdingApi.save(payload)
        setSimulation(res.simulation)
        toast.success('Simulação guardada no histórico')
        await qc.invalidateQueries({ queryKey: ['fiscal-wh-history'] })
      } else {
        const res = await contabilFiscalWithholdingApi.simulate(payload)
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
      title="Retenção na fonte (IRS)"
      subtitle="Tabelas I–III continente 2026 (trabalho dependente). Estimativa mensal — não é recibo oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Simulação de apoio</p>
        <p className="mt-1 text-amber-950/90">
          {catalogQuery.data?.disclaimer ||
            'Confirme a tabela e o despacho vigentes no Portal das Finanças.'}
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

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Remuneração mensal bruta</span>
            <EuroInput value={euros} onChange={setEuros} />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Dependentes</span>
            <input
              type="number"
              min={minDeps}
              max={20}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={dependents}
              onChange={(e) => setDependents(Math.max(minDeps, Number(e.target.value) || 0))}
            />
            {minDeps > 0 ? (
              <span className="text-xs text-muted-foreground">Mínimo {minDeps} nesta tabela.</span>
            ) : null}
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
            <p className="text-sm text-muted-foreground">Indique a remuneração e calcule a retenção estimada.</p>
          ) : (
            <div className="space-y-3">
              <ResultRow
                label="Retenção IRS"
                value={formatEuroFromCents(simulation.result.withholdingCents)}
                strong
              />
              <ResultRow label="Líquido (antes de SS)" value={formatEuroFromCents(simulation.result.netCents)} />
              <ResultRow
                label="Taxa marginal"
                value={`${(simulation.result.rateMilli / 1000).toLocaleString('pt-PT', {
                  maximumFractionDigits: 2,
                })} %`}
              />
              <ResultRow label="Parcela a abater" value={formatEuroFromCents(simulation.result.parcelaCents)} />
              {simulation.result.additionalCents > 0 ? (
                <ResultRow
                  label="Abatimento dependentes"
                  value={formatEuroFromCents(simulation.result.additionalCents)}
                />
              ) : null}
              <ResultRow
                label="Taxa efectiva"
                value={`${(simulation.result.effectiveBps / 100).toLocaleString('pt-PT', {
                  maximumFractionDigits: 2,
                })} %`}
              />
              {simulation.result.familyRateReduced ? (
                <p className="text-xs text-emerald-800">Aplicada redução de 1 p.p. (≥ 3 dependentes).</p>
              ) : null}
              <p className="text-xs leading-relaxed text-muted-foreground">{simulation.disclaimer}</p>
              <p className="text-[11px] text-muted-foreground">
                Tabela {simulation.table.code} · {simulation.ruleVersion}
              </p>
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
          <p className="mt-3 text-sm text-muted-foreground">Ainda sem simulações de retenção guardadas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/50">
            {(historyQuery.data?.items || []).map(
              (row: {
                id: string
                ruleVersion: string
                createdAt: string
                result: { withholdingCents?: number }
                meta?: { table?: { code?: string } }
              }) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString('pt-PT')} · Tabela{' '}
                    {row.meta?.table?.code || '?'} · {row.ruleVersion}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatEuroFromCents(row.result?.withholdingCents ?? 0)}
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
