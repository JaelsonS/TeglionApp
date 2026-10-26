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
import { contabilFiscalIrsApi } from '@/infrastructure/api'
import type { IrsSimulation } from '@/infrastructure/api/contabil/fiscalIrs'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function formatRateMilli(milli: number) {
  const pct = milli / 1000
  return `${pct.toLocaleString('pt-PT', { maximumFractionDigits: 3 })} %`
}

function simulationFromRow(row: FiscalCalculationRow): IrsSimulation {
  const meta = row.meta || {}
  return {
    calcType: row.calcType || 'irs_brackets',
    jurisdiction: 'PT',
    tax: 'IRS',
    ruleVersion: row.ruleVersion,
    input: row.input as IrsSimulation['input'],
    result: row.result as IrsSimulation['result'],
    disclaimer: String(meta.disclaimer || ''),
    source: meta.source as IrsSimulation['source'],
    limitations: meta.limitations as string[] | undefined,
  }
}

export function IrsCalculatorWorkspace({
  embedded = false,
  initialClientId,
}: { embedded?: boolean; initialClientId?: string } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-irs-catalog'],
    queryFn: () => contabilFiscalIrsApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-irs-history'],
    queryFn: () => contabilFiscalIrsApi.list({ limit: 40 }),
  })
  const { clientId, setClientId, hints, onHints, clientNameById } = useCalculatorClient(initialClientId)

  const pack = catalogQuery.data?.packs?.[0]

  const [euros, setEuros] = useState(0)
  const [filingStatus, setFilingStatus] = useState<'single' | 'joint'>('single')
  const [includeSolidarity, setIncludeSolidarity] = useState(true)
  const [simulation, setSimulation] = useState<IrsSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (hints?.suggestedFilingStatus) setFilingStatus(hints.suggestedFilingStatus)
  }, [hints?.clientId, hints?.suggestedFilingStatus])

  const taxableIncomeCents = useMemo(() => Math.round(euros * 100), [euros])

  function reopen(row: FiscalCalculationRow) {
    const input = row.input || {}
    setEuros(centsToEuros(input.taxableIncomeCents))
    setFilingStatus(input.filingStatus === 'joint' ? 'joint' : 'single')
    setIncludeSolidarity(input.includeSolidarity !== false)
    setClientId(row.clientId ? String(row.clientId) : '')
    setSimulation(simulationFromRow(row))
    toast.message('Simulação reaberta do histórico')
  }

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

  const historyItems = (historyQuery.data?.items || []) as FiscalCalculationRow[]

  return (
    <FirmModuleShell
      embedded={embedded}
      title="Calculadora de IRS"
      subtitle="Coleta estimada sobre rendimento coletável (escalões gerais, continente). Versionada — não é declaração oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <CalculatorDisclaimer
        text={catalogQuery.data?.disclaimer}
        fallback="Indique o rendimento coletável já determinado. Não calcula deduções nem retenções."
      />

      <CalculatorClientBar clientId={clientId} onClientIdChange={setClientId} onHints={onHints} />

      {hints?.irsFramework ? (
        <p className="cb-calc-client-hint">
          Enquadramento no perfil: <strong>{hints.irsFramework}</strong>
          {hints.spouse ? ' · tributação conjunta sugerida (cônjuge no perfil).' : '.'} Indique o coletável
          manualmente.
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
            <p className="mt-2 text-sm text-muted-foreground">
              Indique o rendimento coletável e calcule para ver a coleta estimada.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
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
          clientId
            ? 'Sem simulações IRS guardadas para este cliente.'
            : 'Ainda sem simulações IRS guardadas.'
        }
        items={historyItems}
        onSelect={reopen}
        clientNameById={clientNameById}
        filterClientId={clientId || undefined}
        renderSummary={(row) =>
          formatEuroFromCents(Number(row.result?.totalCents ?? row.result?.taxCents ?? 0))
        }
      />
    </FirmModuleShell>
  )
}
