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
import { contabilFiscalWithholdingApi } from '@/infrastructure/api'
import type { WithholdingSimulation } from '@/infrastructure/api/contabil/fiscalWithholding'
import { getErrorMessage } from '@/shared/utils/errors'

type TableOpt = { code: string; label: string; minDependents?: number }

function simulationFromRow(row: FiscalCalculationRow): WithholdingSimulation {
  const meta = row.meta || {}
  return {
    calcType: row.calcType || 'irs_withholding',
    jurisdiction: 'PT',
    tax: 'IRS',
    ruleVersion: row.ruleVersion,
    table: (meta.table || {}) as WithholdingSimulation['table'],
    input: row.input as WithholdingSimulation['input'],
    result: row.result as WithholdingSimulation['result'],
    disclaimer: String(meta.disclaimer || ''),
    source: meta.source as WithholdingSimulation['source'],
    limitations: meta.limitations as string[] | undefined,
  }
}

export function WithholdingCalculatorWorkspace({
  embedded = false,
  initialClientId,
}: { embedded?: boolean; initialClientId?: string } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-wh-catalog'],
    queryFn: () => contabilFiscalWithholdingApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-wh-history'],
    queryFn: () => contabilFiscalWithholdingApi.list({ limit: 40 }),
  })
  const { clientId, setClientId, hints, onHints, clientNameById } = useCalculatorClient(initialClientId)

  const pack = catalogQuery.data?.packs?.[0]
  const tables: TableOpt[] = pack?.tables || []

  const [tableCode, setTableCode] = useState('I')
  const [euros, setEuros] = useState(0)
  const [dependents, setDependents] = useState(0)
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

  function reopen(row: FiscalCalculationRow) {
    const input = row.input || {}
    setTableCode(String(input.tableCode || tableCode))
    setEuros(centsToEuros(input.remunerationCents))
    setDependents(Number(input.dependents || 0))
    setClientId(row.clientId ? String(row.clientId) : '')
    setSimulation(simulationFromRow(row))
    toast.message('Simulação reaberta do histórico')
  }

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

  const historyItems = (historyQuery.data?.items || []) as FiscalCalculationRow[]

  return (
    <FirmModuleShell
      embedded={embedded}
      title="Retenção na fonte (IRS)"
      subtitle="Tabelas I–III continente 2026 (trabalho dependente). Estimativa mensal — não é recibo oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <CalculatorDisclaimer
        text={catalogQuery.data?.disclaimer}
        fallback="Confirme a tabela e o despacho vigentes no Portal das Finanças."
      />

      <CalculatorClientBar clientId={clientId} onClientIdChange={setClientId} onHints={onHints} />

      {hints ? (
        <p className="cb-calc-client-hint">
          Remuneração e dependentes não estão no perfil — indique-os manualmente.
          {hints.spouse ? ' Agregado com cônjuge no perfil (verifique a tabela correcta).' : ''}
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
              Indique a remuneração e calcule a retenção estimada.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
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
              {simulation.disclaimer ? (
                <p className="text-xs leading-relaxed text-muted-foreground">{simulation.disclaimer}</p>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Tabela {simulation.table.code} · {simulation.ruleVersion}
              </p>
            </div>
          )}
        </CalculatorResultPanel>
      </div>

      <CalculatorHistorySection
        loading={historyQuery.isLoading}
        emptyLabel={
          clientId
            ? 'Sem simulações de retenção guardadas para este cliente.'
            : 'Ainda sem simulações de retenção guardadas.'
        }
        items={historyItems}
        onSelect={reopen}
        clientNameById={clientNameById}
        filterClientId={clientId || undefined}
        renderSummary={(row) => {
          const meta = row.meta || {}
          const table = (meta.table || {}) as { code?: string }
          return (
            <>
              Tabela {table.code || '?'} ·{' '}
              {formatEuroFromCents(Number(row.result?.withholdingCents ?? 0))}
            </>
          )
        }}
      />
    </FirmModuleShell>
  )
}
