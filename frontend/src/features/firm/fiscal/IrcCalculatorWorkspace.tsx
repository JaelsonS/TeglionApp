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
import { contabilFiscalIrcApi } from '@/infrastructure/api'
import type { IrcSimulation } from '@/infrastructure/api/contabil/fiscalIrc'
import { getErrorMessage } from '@/shared/utils/errors'

type Regime = { code: string; label: string }

function simulationFromRow(row: FiscalCalculationRow): IrcSimulation {
  const meta = row.meta || {}
  return {
    calcType: row.calcType || 'irc',
    jurisdiction: 'PT',
    tax: 'IRC',
    ruleVersion: row.ruleVersion,
    regime: (meta.regime || {}) as IrcSimulation['regime'],
    input: row.input as IrcSimulation['input'],
    result: row.result as IrcSimulation['result'],
    disclaimer: String(meta.disclaimer || ''),
    source: meta.source as IrcSimulation['source'],
    limitations: meta.limitations as string[] | undefined,
  }
}

export function IrcCalculatorWorkspace({
  embedded = false,
  initialClientId,
}: { embedded?: boolean; initialClientId?: string } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-irc-catalog'],
    queryFn: () => contabilFiscalIrcApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-irc-history'],
    queryFn: () => contabilFiscalIrcApi.list({ limit: 40 }),
  })
  const { clientId, setClientId, hints, onHints, clientNameById } = useCalculatorClient(initialClientId)

  const pack = catalogQuery.data?.packs?.[0]
  const regimes: Regime[] = pack?.regimes || []

  const [regimeCode, setRegimeCode] = useState('general')
  const [euros, setEuros] = useState(0)
  const [includeState, setIncludeState] = useState(true)
  const [municipalPct, setMunicipalPct] = useState(0)
  const [simulation, setSimulation] = useState<IrcSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (regimes.length && !regimes.some((r) => r.code === regimeCode)) {
      setRegimeCode(regimes[0].code)
    }
  }, [regimes, regimeCode])

  const taxableCents = useMemo(() => Math.round(euros * 100), [euros])
  const municipalDerramaBps = useMemo(() => Math.round(municipalPct * 100), [municipalPct])

  function reopen(row: FiscalCalculationRow) {
    const input = row.input || {}
    setRegimeCode(String(input.regimeCode || regimeCode))
    setEuros(centsToEuros(input.taxableCents))
    setIncludeState(input.includeStateSurcharge !== false)
    setMunicipalPct(Number(input.municipalDerramaBps || 0) / 100)
    setClientId(row.clientId ? String(row.clientId) : '')
    setSimulation(simulationFromRow(row))
    toast.message('Simulação reaberta do histórico')
  }

  async function runSimulate(save: boolean) {
    if (taxableCents < 0) {
      toast.error('Indique a matéria coletável')
      return
    }
    setBusy(true)
    try {
      const payload = {
        regimeCode,
        taxableCents,
        includeStateSurcharge: includeState,
        municipalDerramaBps,
        ruleVersion: pack?.version,
        clientId: clientId || undefined,
      }
      if (save) {
        const res = await contabilFiscalIrcApi.save(payload)
        setSimulation(res.simulation)
        toast.success('Simulação guardada no histórico')
        await qc.invalidateQueries({ queryKey: ['fiscal-irc-history'] })
      } else {
        const res = await contabilFiscalIrcApi.simulate(payload)
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
      title="Calculadora de IRC"
      subtitle="Taxa geral / PME / Interior 2026, com derrama estadual e municipal opcional. Não é Modelo 22."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <CalculatorDisclaimer
        text={catalogQuery.data?.disclaimer}
        fallback="Confirme elegibilidade PME e a taxa de derrama do município no Portal das Finanças."
      />

      <CalculatorClientBar clientId={clientId} onClientIdChange={setClientId} onHints={onHints} />

      {hints?.suggestedIrc || hints?.irsFramework ? (
        <p className="cb-calc-client-hint">
          {hints.irsFramework ? (
            <>
              Enquadramento no perfil: <strong>{hints.irsFramework}</strong>.{' '}
            </>
          ) : null}
          Matéria coletável e derrama municipal continuam manuais.
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

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Matéria coletável</span>
            <EuroInput value={euros} onChange={setEuros} />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={includeState}
              onChange={(e) => setIncludeState(e.target.checked)}
            />
            <span>Incluir derrama estadual</span>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Derrama municipal (%)</span>
            <input
              type="number"
              min={0}
              max={1.5}
              step={0.1}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={municipalPct}
              onChange={(e) => setMunicipalPct(Math.min(1.5, Math.max(0, Number(e.target.value) || 0)))}
            />
            <span className="text-xs text-muted-foreground">Máximo 1,5 %. 0 = sem derrama municipal.</span>
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
            <p className="mt-2 text-sm text-muted-foreground">Indique a matéria coletável e calcule.</p>
          ) : (
            <div className="mt-3 space-y-3">
              <ResultRow label="IRC" value={formatEuroFromCents(simulation.result.ircCents)} />
              {simulation.input.includeStateSurcharge ? (
                <ResultRow
                  label="Derrama estadual"
                  value={formatEuroFromCents(simulation.result.stateSurchargeCents)}
                />
              ) : null}
              {simulation.input.municipalDerramaBps > 0 ? (
                <ResultRow
                  label="Derrama municipal"
                  value={formatEuroFromCents(simulation.result.municipalSurchargeCents)}
                />
              ) : null}
              <ResultRow label="Total" value={formatEuroFromCents(simulation.result.totalCents)} strong />
              <ResultRow
                label="Taxa efectiva"
                value={`${(simulation.result.effectiveBps / 100).toLocaleString('pt-PT', {
                  maximumFractionDigits: 2,
                })} %`}
              />
              {simulation.result.ircParts?.length ? (
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Discriminação IRC
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {simulation.result.ircParts.map((p, i) => (
                      <li key={i} className="flex justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {formatEuroFromCents(p.baseCents)} × {(p.rateMilli / 1000).toLocaleString('pt-PT')} %
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
              <p className="text-[11px] text-muted-foreground">
                {simulation.regime.label} · {simulation.ruleVersion}
              </p>
            </div>
          )}
        </CalculatorResultPanel>
      </div>

      <CalculatorHistorySection
        loading={historyQuery.isLoading}
        emptyLabel={
          clientId ? 'Sem simulações IRC guardadas para este cliente.' : 'Ainda sem simulações IRC guardadas.'
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
              {formatEuroFromCents(Number(row.result?.totalCents ?? 0))}
            </>
          )
        }}
      />
    </FirmModuleShell>
  )
}
