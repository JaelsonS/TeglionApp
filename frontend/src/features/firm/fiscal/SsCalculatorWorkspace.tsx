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
import { contabilFiscalSsApi } from '@/infrastructure/api'
import type { SsSimulation } from '@/infrastructure/api/contabil/fiscalSs'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

type Regime = {
  code: string
  label: string
  kind: string
  workerBps: number
  employerBps: number
  totalBps: number
}

function simulationFromRow(row: FiscalCalculationRow): SsSimulation {
  const meta = row.meta || {}
  return {
    calcType: row.calcType || 'ss_contributions',
    jurisdiction: 'PT',
    tax: 'SS',
    ruleVersion: row.ruleVersion,
    regime: (meta.regime || {}) as SsSimulation['regime'],
    input: row.input as SsSimulation['input'],
    result: row.result as SsSimulation['result'],
    disclaimer: String(meta.disclaimer || ''),
    source: meta.source as SsSimulation['source'],
    limitations: meta.limitations as string[] | undefined,
  }
}

export function SsCalculatorWorkspace({
  embedded = false,
  initialClientId,
}: { embedded?: boolean; initialClientId?: string } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-ss-catalog'],
    queryFn: () => contabilFiscalSsApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-ss-history'],
    queryFn: () => contabilFiscalSsApi.list({ limit: 40 }),
  })
  const { clientId, setClientId, hints, onHints, clientNameById } = useCalculatorClient(initialClientId)

  const pack = catalogQuery.data?.packs?.[0]
  const regimes: Regime[] = pack?.regimes || []

  const [regimeCode, setRegimeCode] = useState('tco_lucrativo')
  const [euros, setEuros] = useState(0)
  const [tiMode, setTiMode] = useState<'base' | 'services'>('base')
  const [simulation, setSimulation] = useState<SsSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (regimes.length && !regimes.some((r) => r.code === regimeCode)) {
      setRegimeCode(regimes[0].code)
    }
  }, [regimes, regimeCode])

  useEffect(() => {
    if (!hints?.suggestedSsTi) return
    if (regimes.some((r) => r.code === 'ti_geral')) setRegimeCode('ti_geral')
  }, [hints?.clientId, hints?.suggestedSsTi, regimes])

  const selected = useMemo(
    () => regimes.find((r) => r.code === regimeCode) || null,
    [regimes, regimeCode],
  )
  const isTi = selected?.kind === 'self_employed'
  const amountCents = useMemo(() => Math.round(euros * 100), [euros])

  function reopen(row: FiscalCalculationRow) {
    const input = row.input || {}
    setRegimeCode(String(input.regimeCode || regimeCode))
    if (input.servicesCents != null && Number(input.servicesCents) > 0) {
      setTiMode('services')
      setEuros(centsToEuros(input.servicesCents))
    } else {
      setTiMode('base')
      setEuros(centsToEuros(input.baseCents))
    }
    setClientId(row.clientId ? String(row.clientId) : '')
    setSimulation(simulationFromRow(row))
    toast.message('Simulação reaberta do histórico')
  }

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

  const historyItems = (historyQuery.data?.items || []) as FiscalCalculationRow[]

  return (
    <FirmModuleShell
      embedded={embedded}
      title="Calculadora de Segurança Social"
      subtitle="Contribuições TCO e TI com taxas 2026. Resultado guardável e versionado — não é declaração oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <CalculatorDisclaimer
        text={catalogQuery.data?.disclaimer}
        fallback="Confirme sempre o enquadramento na Segurança Social Direta."
      />

      <CalculatorClientBar clientId={clientId} onClientIdChange={setClientId} onHints={onHints} />

      {hints?.suggestedSsTi ? (
        <p className="cb-calc-client-hint">
          Perfil sugere trabalhador independente
          {hints.ssOneYearExemption ? ' · isenção 1.º ano marcada no perfil (confirme elegibilidade)' : ''}.
          Regime TI pré-seleccionado; indique a base ou a prestação manualmente.
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
                {pack?.iasCents != null ? ` · IAS ${formatEuroFromCents(pack.iasCents)}` : ''}
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
              Indique um valor e calcule para ver as contribuições.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
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
          clientId ? 'Sem simulações SS guardadas para este cliente.' : 'Ainda sem simulações SS guardadas.'
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
