import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { CalculatorClientBar } from '@/features/firm/fiscal/CalculatorClientBar'
import {
  CalculatorDisclaimer,
  CalculatorHistorySection,
  CalculatorResultPanel,
  ResultRow,
  centsToEuros,
  formatEuroFromCents,
  type FiscalCalculationRow,
} from '@/features/firm/fiscal/calculatorShared'
import { useCalculatorClient } from '@/features/firm/fiscal/useCalculatorClient'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { EuroInput } from '@/shared/design-system'
import { contabilFiscalImtApi } from '@/infrastructure/api'
import type { ImtSimulation } from '@/infrastructure/api/contabil/fiscalImt'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

type TableOpt = { code: string; label: string }
type FlatOpt = { code: string; label: string; ratePercent: number }

function simulationFromRow(row: FiscalCalculationRow): ImtSimulation {
  const meta = row.meta || {}
  return {
    calcType: row.calcType || 'imt',
    jurisdiction: 'PT',
    tax: 'IMT',
    ruleVersion: row.ruleVersion,
    regime: (meta.regime || {}) as ImtSimulation['regime'],
    input: row.input as ImtSimulation['input'],
    result: row.result as ImtSimulation['result'],
    disclaimer: String(meta.disclaimer || ''),
    source: meta.source as ImtSimulation['source'],
    limitations: meta.limitations as string[] | undefined,
  }
}

export function ImtCalculatorWorkspace({
  embedded = false,
  initialClientId,
}: { embedded?: boolean; initialClientId?: string } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-imt-catalog'],
    queryFn: () => contabilFiscalImtApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-imt-history'],
    queryFn: () => contabilFiscalImtApi.list({ limit: 40 }),
  })
  const { clientId, setClientId, hints, onHints, clientNameById } = useCalculatorClient(initialClientId)

  const pack = catalogQuery.data?.packs?.[0]
  const tables: TableOpt[] = pack?.tables || []
  const flats: FlatOpt[] = pack?.flatRates || []

  const [mode, setMode] = useState<'table' | 'flat'>('table')
  const [tableCode, setTableCode] = useState('I')
  const [flatRateCode, setFlatRateCode] = useState('rustic')
  const [euros, setEuros] = useState(0)
  const [simulation, setSimulation] = useState<ImtSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (tables.length && !tables.some((t) => t.code === tableCode)) setTableCode(tables[0].code)
  }, [tables, tableCode])
  useEffect(() => {
    if (flats.length && !flats.some((f) => f.code === flatRateCode)) setFlatRateCode(flats[0].code)
  }, [flats, flatRateCode])

  const taxableValueCents = useMemo(() => Math.round(euros * 100), [euros])

  function reopen(row: FiscalCalculationRow) {
    const input = row.input || {}
    if (input.flatRateCode) {
      setMode('flat')
      setFlatRateCode(String(input.flatRateCode))
    } else {
      setMode('table')
      setTableCode(String(input.tableCode || tableCode))
    }
    setEuros(centsToEuros(input.taxableValueCents))
    setClientId(row.clientId ? String(row.clientId) : '')
    setSimulation(simulationFromRow(row))
    toast.message('Simulação reaberta do histórico')
  }

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

  const historyItems = (historyQuery.data?.items || []) as FiscalCalculationRow[]

  return (
    <FirmModuleShell
      embedded={embedded}
      title="Calculadora de IMT"
      subtitle="Imposto Municipal sobre as Transmissões — continente 2026. Simulação — não é liquidação oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <CalculatorDisclaimer
        text={catalogQuery.data?.disclaimer}
        fallback="Use o maior entre o preço e o VPT. Não inclui Imposto do Selo nem isenções."
      />

      <CalculatorClientBar clientId={clientId} onClientIdChange={setClientId} onHints={onHints} />

      {hints ? (
        <p className="cb-calc-client-hint">
          Associe o comprador/cliente para guardar no histórico. Valor de aquisição / VPT continua manual.
        </p>
      ) : null}

      <div className="cb-calc-workspace-grid">
        <section className="cb-calc-form-panel">
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

        <CalculatorResultPanel empty={!simulation}>
          {!simulation ? (
            <p className="mt-2 text-sm text-muted-foreground">Indique o valor e calcule o IMT estimado.</p>
          ) : (
            <div className="mt-3 space-y-3">
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
              {simulation.disclaimer ? (
                <p className="text-xs leading-relaxed text-muted-foreground">{simulation.disclaimer}</p>
              ) : null}
              <p className="text-[11px] text-muted-foreground">Versão {simulation.ruleVersion}</p>
            </div>
          )}
        </CalculatorResultPanel>
      </div>

      <CalculatorHistorySection
        loading={historyQuery.isLoading}
        emptyLabel={
          clientId ? 'Sem simulações IMT guardadas para este cliente.' : 'Ainda sem simulações IMT guardadas.'
        }
        items={historyItems}
        onSelect={reopen}
        clientNameById={clientNameById}
        filterClientId={clientId || undefined}
        renderSummary={(row) => {
          const meta = row.meta || {}
          const regime = (meta.regime || {}) as { label?: string }
          return (
            <>
              {regime.label ? `${regime.label} · ` : ''}
              {formatEuroFromCents(Number(row.result?.imtCents ?? 0))}
            </>
          )
        }}
      />
    </FirmModuleShell>
  )
}
