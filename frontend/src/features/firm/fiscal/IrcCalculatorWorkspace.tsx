import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { EuroInput } from '@/shared/design-system'
import { contabilFiscalIrcApi } from '@/infrastructure/api'
import type { IrcSimulation } from '@/infrastructure/api/contabil/fiscalIrc'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

type Regime = { code: string; label: string }

export function IrcCalculatorWorkspace() {
  const qc = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['fiscal-irc-catalog'],
    queryFn: () => contabilFiscalIrcApi.catalog(),
    staleTime: 10 * 60_000,
  })
  const historyQuery = useQuery({
    queryKey: ['fiscal-irc-history'],
    queryFn: () => contabilFiscalIrcApi.list({ limit: 20 }),
  })
  const clientsQuery = useFirmClientsDirectory({ limit: 300 })

  const pack = catalogQuery.data?.packs?.[0]
  const regimes: Regime[] = pack?.regimes || []

  const [regimeCode, setRegimeCode] = useState('general')
  const [euros, setEuros] = useState(0)
  const [includeState, setIncludeState] = useState(true)
  const [municipalPct, setMunicipalPct] = useState(0)
  const [clientId, setClientId] = useState('')
  const [simulation, setSimulation] = useState<IrcSimulation | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (regimes.length && !regimes.some((r) => r.code === regimeCode)) {
      setRegimeCode(regimes[0].code)
    }
  }, [regimes, regimeCode])

  const taxableCents = useMemo(() => Math.round(euros * 100), [euros])
  const municipalDerramaBps = useMemo(() => Math.round(municipalPct * 100), [municipalPct])

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

  return (
    <FirmModuleShell
      title="Calculadora de IRC"
      subtitle="Taxa geral / PME / Interior 2026, com derrama estadual e municipal opcional. Não é Modelo 22."
      bodyClassName="overflow-auto px-4 pb-6 sm:px-5"
    >
      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Simulação de apoio</p>
        <p className="mt-1 text-amber-950/90">
          {catalogQuery.data?.disclaimer ||
            'Confirme elegibilidade PME e a taxa de derrama do município no Portal das Finanças.'}
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
            <p className="text-sm text-muted-foreground">Indique a matéria coletável e calcule.</p>
          ) : (
            <div className="space-y-3">
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
              <p className="text-xs leading-relaxed text-muted-foreground">{simulation.disclaimer}</p>
              <p className="text-[11px] text-muted-foreground">
                {simulation.regime.label} · {simulation.ruleVersion}
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Histórico recente</h2>
        {historyQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">A carregar…</p>
        ) : (historyQuery.data?.items || []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Ainda sem simulações IRC guardadas.</p>
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
