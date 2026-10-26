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
import { contabilFiscalVatApi } from '@/infrastructure/api'
import type { VatSimulation } from '@/infrastructure/api/contabil/fiscalVat'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function simulationFromRow(row: FiscalCalculationRow): VatSimulation {
  const meta = row.meta || {}
  const rate = (meta.rate || {}) as VatSimulation['rate']
  return {
    calcType: row.calcType || 'vat_net_gross',
    jurisdiction: 'PT',
    tax: 'IVA',
    ruleVersion: row.ruleVersion,
    rate: {
      code: String(rate.code || ''),
      label: String(rate.label || ''),
      percent: Number(rate.percent || 0),
      bps: Number(rate.bps || 0),
    },
    input: row.input as VatSimulation['input'],
    result: row.result as VatSimulation['result'],
    disclaimer: String(meta.disclaimer || ''),
    source: meta.source as VatSimulation['source'],
    rounding: meta.rounding as VatSimulation['rounding'],
    limitations: meta.limitations as string[] | undefined,
  }
}

export function VatCalculatorWorkspace({
  embedded = false,
  initialClientId,
}: { embedded?: boolean; initialClientId?: string } = {}) {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-vat-catalog'],
    queryFn: () => contabilFiscalVatApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-vat-history'],
    queryFn: () => contabilFiscalVatApi.list({ limit: 40, calcType: 'vat_net_gross' }),
  })
  const { clientId, setClientId, hints, onHints, clientNameById } = useCalculatorClient(initialClientId)

  const pack = catalogQuery.data?.packs?.[0]
  const rates = pack?.rates || []

  const [direction, setDirection] = useState<'net_to_gross' | 'gross_to_net'>('net_to_gross')
  const [rateCode, setRateCode] = useState('normal')
  const [euros, setEuros] = useState(0)
  const [simulation, setSimulation] = useState<VatSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (rates.length && !rates.some((r: { code: string }) => r.code === rateCode)) {
      setRateCode(rates[0].code)
    }
  }, [rates, rateCode])

  const amountCents = useMemo(() => Math.round(euros * 100), [euros])

  function reopen(row: FiscalCalculationRow) {
    const input = row.input || {}
    const dir = input.direction === 'gross_to_net' ? 'gross_to_net' : 'net_to_gross'
    setDirection(dir)
    setRateCode(String(input.rateCode || rateCode))
    setEuros(centsToEuros(input.amountCents))
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
      const payload = {
        direction,
        amountCents,
        rateCode,
        ruleVersion: pack?.version,
        clientId: clientId || undefined,
      }
      if (save) {
        const res = await contabilFiscalVatApi.save(payload)
        setSimulation(res.simulation)
        toast.success('Simulação guardada no histórico')
        await qc.invalidateQueries({ queryKey: ['fiscal-vat-history'] })
      } else {
        const res = await contabilFiscalVatApi.simulate(payload)
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
      title="Calculadora de IVA"
      subtitle="Simulação líquido ↔ total com taxas 23 %, 13 % e 6 %. Resultado guardável e versionado — não é declaração oficial."
      bodyClassName={embedded ? 'overflow-visible' : 'overflow-auto px-4 pb-6 sm:px-5'}
    >
      <CalculatorDisclaimer
        text={catalogQuery.data?.disclaimer}
        fallback="Não substitui software certificado nem a declaração periódica de IVA."
      />

      <CalculatorClientBar clientId={clientId} onClientIdChange={setClientId} onHints={onHints} />

      {hints?.vatRegime ? (
        <p className="cb-calc-client-hint">
          Regime IVA no perfil: <strong>{hints.vatRegime}</strong>. Escolha a taxa adequada à operação;
          o valor continua manual.
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                direction === 'net_to_gross'
                  ? 'border-brand bg-brand/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground',
              )}
              onClick={() => setDirection('net_to_gross')}
            >
              Líquido → total
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm',
                direction === 'gross_to_net'
                  ? 'border-brand bg-brand/10 font-medium text-foreground'
                  : 'border-border text-muted-foreground',
              )}
              onClick={() => setDirection('gross_to_net')}
            >
              Total → líquido
            </button>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">
              {direction === 'net_to_gross' ? 'Valor líquido (sem IVA)' : 'Valor total (com IVA)'}
            </span>
            <EuroInput value={euros} onChange={setEuros} />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Taxa</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={rateCode}
              onChange={(e) => setRateCode(e.target.value)}
            >
              {rates.map((r: { code: string; label: string; percent: number }) => (
                <option key={r.code} value={r.code}>
                  {r.label} ({r.percent} %)
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

        <CalculatorResultPanel empty={!simulation}>
          {!simulation ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Indique um valor e calcule para ver a discriminação.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <ResultRow label="Líquido" value={formatEuroFromCents(simulation.result.netCents)} />
              <ResultRow
                label={`IVA (${simulation.rate.percent} %)`}
                value={formatEuroFromCents(simulation.result.vatCents)}
              />
              <ResultRow
                label="Total"
                value={formatEuroFromCents(simulation.result.grossCents)}
                strong
              />
              {simulation.disclaimer ? (
                <p className="text-xs leading-relaxed text-muted-foreground">{simulation.disclaimer}</p>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Versão {simulation.ruleVersion}
                {simulation.rounding?.description ? ` · ${simulation.rounding.description}` : ''}
              </p>
            </div>
          )}
        </CalculatorResultPanel>
      </div>

      <CalculatorHistorySection
        loading={historyQuery.isLoading}
        emptyLabel={
          clientId ? 'Sem simulações IVA guardadas para este cliente.' : 'Ainda sem simulações guardadas.'
        }
        items={historyItems}
        onSelect={reopen}
        clientNameById={clientNameById}
        filterClientId={clientId || undefined}
        renderSummary={(row) => {
          const result = row.result || {}
          const meta = row.meta || {}
          const rate = (meta.rate || {}) as { percent?: number }
          return (
            <>
              {formatEuroFromCents(Number(result.netCents || 0))} + IVA{' '}
              {rate.percent != null ? `${rate.percent}%` : ''} ={' '}
              {formatEuroFromCents(Number(result.grossCents || 0))}
            </>
          )
        }}
      />
    </FirmModuleShell>
  )
}
