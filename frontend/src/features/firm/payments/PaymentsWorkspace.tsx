import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2, Search, Wallet } from 'lucide-react'
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

  async function runGenerate() {
    setGenerating(true)
    try {
      const res = await contabilFeeChargesApi.generate({ yearMonth: generateMonth })
      toast.success(
        `Gerados ${res.createdCount} pagamento(s)` +
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
      title="Pagamentos (carteira)"
      subtitle="Mapa anual das avenças dos seus clientes. Isto não é o Plano Teglion nem o Stripe Connect — só o controlo interno da carteira."
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
            Gerar pagamentos
          </Button>
        </div>
      }
      bodyClassName="cb-payments-body px-4 pb-4 sm:px-5"
    >
      <div className="cb-payments-chrome shrink-0 space-y-3 pb-3">
        {data?.connect?.nudge ? (
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3 text-sm text-sky-950">
            <p className="font-medium">Recebimentos online (opcional)</p>
            <p className="mt-1 text-sky-950/90">{data.connect.nudge}</p>
            <p className="mt-2 text-xs text-sky-900/80">
              Sem Stripe continua a marcar transferências, MB Way ou numerário aqui. Se activar o Connect, a
              taxa de serviço Teglion ({data.connect.platformFeePercent}%) é diferente das taxas Stripe — o
              valor do cliente fica na conta do gabinete.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/app/firm/settings?tab=pagamentos">Receber dos clientes (Stripe)</Link>
            </Button>
          </div>
        ) : null}

        {data?.summary ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryCard label="Pago" value={formatEuroFromCents(data.summary.paidCents)} />
            <SummaryCard label="Em aberto" value={formatEuroFromCents(data.summary.openCents)} />
            <SummaryCard label="Em atraso" value={formatEuroFromCents(data.summary.overdueCents)} tone="warn" />
            <SummaryCard label="Rascunho" value={formatEuroFromCents(data.summary.draftCents)} />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <div className="cb-payments-grid-wrap cb-table-scroll min-h-0 flex-1 overflow-auto">
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
            description="Defina a avença mensal na ficha do cliente (Faturação) e use Gerar pagamentos para preencher o mês."
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
                    <th key={ym} className="px-1.5 py-2.5 text-center text-xs font-medium text-muted-foreground">
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

        <p className="mt-3 pb-2 text-xs leading-relaxed text-muted-foreground">
          Controlo interno das avenças do gabinete. Não substitui faturação certificada nem declarações à AT.
          Stripe Connect: Definições → Receber dos clientes. Assinatura Teglion: menu Plano.
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
            <h2 className="text-lg font-semibold">Gerar pagamentos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria um rascunho por cada cliente com avença activa, no mês escolhido. Clientes sem avença ou
              que já tenham o mês ficam de fora.
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
              <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)} disabled={generating}>
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

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'warn'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-card px-3 py-2.5',
        tone === 'warn' && 'border-amber-200/80 bg-amber-50/40',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
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
