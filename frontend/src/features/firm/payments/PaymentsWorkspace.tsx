import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EmptyState } from '@/shared/design-system'
import { contabilFeeChargesApi } from '@/infrastructure/api'
import type { FeeCharge } from '@/infrastructure/api/contabil/feeCharges'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import {
  MONTH_SHORT,
  formatEuroFromCents,
  statusTone,
} from '@/features/firm/payments/paymentsFormat'
import { ChargeEditDialog } from '@/features/firm/payments/ChargeEditDialog'

const MAP_KEY = ['fee-charges-map'] as const

export function PaymentsWorkspace() {
  const qc = useQueryClient()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateMonth, setGenerateMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [generating, setGenerating] = useState(false)
  const [edit, setEdit] = useState<{ charge: FeeCharge; clientName: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const mapQuery = useQuery({
    queryKey: [...MAP_KEY, year, qDebounced],
    queryFn: () => contabilFeeChargesApi.map({ year, q: qDebounced || undefined }),
  })

  const data = mapQuery.data
  const monthKeys = data?.months || []

  const kpis = useMemo(() => {
    const s = data?.summary
    if (!s) return []
    return [
      {
        id: 'paid',
        label: 'Pago',
        value: formatEuroFromCents(s.paidCents),
        tone: 'emerald' as const,
        icon: Wallet,
      },
      {
        id: 'open',
        label: 'Em aberto',
        value: formatEuroFromCents(s.openCents),
        tone: 'brand' as const,
        icon: FileText,
      },
      {
        id: 'overdue',
        label: 'Em atraso',
        value: formatEuroFromCents(s.overdueCents),
        tone: 'amber' as const,
        icon: AlertTriangle,
      },
      {
        id: 'draft',
        label: 'Rascunho',
        value: formatEuroFromCents(s.draftCents),
        tone: 'muted' as const,
        icon: FileText,
      },
    ]
  }, [data?.summary])

  async function runGenerate() {
    setGenerating(true)
    try {
      const res = await contabilFeeChargesApi.generate({ yearMonth: generateMonth })
      toast.success(
        `Geradas ${res.createdCount} avença(s)` +
          (res.skippedCount ? ` · ${res.skippedCount} já existiam` : ''),
      )
      setGenerateOpen(false)
      await qc.invalidateQueries({ queryKey: MAP_KEY })
    } catch (err) {
      toast.error('Não foi possível gerar', { description: getErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <FirmModuleShell
      className="cb-payments-shell cb-payments-page-scroll"
      title="Pagamentos (carteira)"
      subtitle="Mapa anual das avenças dos clientes — controlo interno do gabinete."
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-[4rem] text-center text-sm font-semibold tabular-nums">{year}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" size="sm" onClick={() => setGenerateOpen(true)}>
            Gerar avenças do mês
          </Button>
        </div>
      }
      bodyClassName="gap-0 cb-payments-body"
    >
      {kpis.length > 0 ? (
        <div className="cb-payments-kpi-strip" data-testid="payments-kpi-strip">
          {kpis.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className={cn('cb-payments-kpi', `cb-payments-kpi--${item.tone}`)}
              >
                <span className="cb-payments-kpi-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="cb-payments-kpi-value">{item.value}</p>
                  <p className="cb-payments-kpi-label">{item.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <p className="cb-payments-section-lead" data-testid="payments-section-lead">
        <span className="cb-payments-section-lead-title">Mapa de avenças</span>
        Controlo interno do que os clientes pagam ao gabinete — não é Stripe Connect nem o Plano
        Teglion.{' '}
        <Link
          to="/app/firm/settings?tab=pagamentos"
          className="font-medium text-brand underline-offset-2 hover:underline"
        >
          Receber online
        </Link>
        {' · '}
        <Link to="/app/firm/billing" className="font-medium text-brand underline-offset-2 hover:underline">
          Plano Teglion
        </Link>
      </p>

      <div className="cb-payments-section-host">
        {data?.connect?.nudge ? (
          <p className="cb-payments-stripe-hint">
            {data.connect.nudge}{' '}
            <Link
              to="/app/firm/settings?tab=pagamentos"
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              Abrir Definições →
            </Link>
          </p>
        ) : null}

        <div className="cb-payments-toolbar">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Pesquisar nome ou NIF"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Pesquisar cliente"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Legend swatch="bg-muted" label="Rascunho" />
            <Legend swatch="bg-sky-100" label="Confirmada" />
            <Legend swatch="bg-violet-100" label="Enviada" />
            <Legend swatch="bg-emerald-100" label="Paga" />
          </div>
        </div>

        <div className="cb-payments-grid-wrap cb-table-scroll">
          {mapQuery.isLoading ? (
            <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar mapa…
            </div>
          ) : null}

          {mapQuery.isError ? (
            <p className="py-8 text-sm text-destructive">{getErrorMessage(mapQuery.error)}</p>
          ) : null}

          {data && data.rows.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Ainda sem clientes neste mapa"
              description="Defina a avença mensal na ficha do cliente (Faturação) e use «Gerar avenças do mês» para preencher o período."
            />
          ) : null}

          {data && data.rows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="cb-payments-client-col sticky left-0 z-10 bg-muted/30 px-3 py-2.5 font-medium">
                      Cliente
                    </th>
                    {monthKeys.map((ym, i) => (
                      <th
                        key={ym}
                        className="px-1.5 py-2.5 text-center text-xs font-medium text-muted-foreground"
                      >
                        {MONTH_SHORT[i]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => {
                    const retainerLabel =
                      row.billing.retainerActive && row.billing.retainerAmountCents != null
                        ? `${formatEuroFromCents(row.billing.retainerAmountCents)}/mês`
                        : 'sem avença activa'
                    const clientTitle = `${row.displayName}${row.taxId ? ` · ${row.taxId}` : ''} · ${retainerLabel}`
                    return (
                      <tr key={row.clientId} className="border-b border-border/40 last:border-0">
                        <td className="cb-payments-client-col sticky left-0 z-10 bg-card px-3 py-2 align-middle">
                          <Link
                            to={`/app/firm/clients/${row.clientId}?section=billing`}
                            className="block truncate font-medium text-foreground hover:text-brand hover:underline"
                            title={clientTitle}
                          >
                            {row.displayName}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground" title={clientTitle}>
                            {row.taxId || '—'} · {retainerLabel}
                          </p>
                        </td>
                        {monthKeys.map((ym) => {
                          const cell = row.months[ym]
                          return (
                            <td key={ym} className="px-1 py-1.5 text-center align-middle">
                              {cell ? (
                                <button
                                  type="button"
                                  className={cn(
                                    'mx-auto block w-full max-w-[4.5rem] rounded-md border px-1 py-1.5 text-[11px] font-medium tabular-nums transition hover:opacity-90',
                                    statusTone(cell.status, cell.overdue),
                                  )}
                                  onClick={() => setEdit({ charge: cell, clientName: row.displayName })}
                                  title={data.statusLabels[cell.status] || cell.status}
                                >
                                  {formatEuroFromCents(cell.amountCents).replace('\u00a0', ' ')}
                                </button>
                              ) : (
                                <span className="inline-block text-xs text-muted-foreground/50">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <p className="cb-payments-foot">
          Controlo interno das avenças do gabinete. Não substitui faturação certificada nem declarações à
          AT. Stripe Connect: Definições → Receber dos clientes. Assinatura Teglion: menu Plano.
        </p>
      </div>

      <ChargeEditDialog
        open={Boolean(edit)}
        onOpenChange={(o) => {
          if (!o) setEdit(null)
        }}
        charge={edit?.charge || null}
        clientName={edit?.clientName || ''}
        paymentMethods={data?.paymentMethods || []}
        onSaved={() => void qc.invalidateQueries({ queryKey: MAP_KEY })}
      />

      {generateOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
          >
            <h2 className="text-lg font-semibold">Gerar avenças do mês</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria um rascunho por cada cliente com avença activa, no mês escolhido. Clientes sem avença
              ou que já tenham o mês ficam de fora.
            </p>
            <label className="mt-4 block space-y-1.5 text-sm">
              <span className="font-medium">Mês</span>
              <Input
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenerateOpen(false)}
                disabled={generating}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={() => void runGenerate()} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A gerar…
                  </>
                ) : (
                  'Gerar'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </FirmModuleShell>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-sm', swatch)} aria-hidden />
      {label}
    </span>
  )
}
