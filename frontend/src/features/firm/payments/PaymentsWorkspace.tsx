import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Plus,
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
  rowHealthLabel,
  rowHealthTone,
  rowPaymentHealth,
  statusLabelPt,
  statusTone,
  type RowPaymentHealth,
} from '@/features/firm/payments/paymentsFormat'
import { ChargeEditDialog } from '@/features/firm/payments/ChargeEditDialog'
import {
  ClientPaymentsDialog,
  type PaymentsMapRow,
} from '@/features/firm/payments/ClientPaymentsDialog'
import { GenerateMonthDialog } from '@/features/firm/payments/GenerateMonthDialog'

const MAP_KEY = ['fee-charges-map'] as const

type HealthFilter = 'todos' | RowPaymentHealth

export function PaymentsWorkspace() {
  const qc = useQueryClient()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('todos')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateMonth, setGenerateMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [generating, setGenerating] = useState(false)
  const [creatingKey, setCreatingKey] = useState<string | null>(null)
  const [edit, setEdit] = useState<{
    charge: FeeCharge
    clientName: string
    clientTaxId?: string | null
  } | null>(null)
  const [sheetRow, setSheetRow] = useState<PaymentsMapRow | null>(null)

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

  useEffect(() => {
    if (!sheetRow || !data?.rows) return
    const next = data.rows.find((r) => r.clientId === sheetRow.clientId)
    if (next && next !== sheetRow) setSheetRow(next)
  }, [data?.rows, sheetRow])

  const rowsWithHealth = useMemo(() => {
    return (data?.rows || []).map((row) => ({
      ...row,
      health: rowPaymentHealth(row.months),
    }))
  }, [data?.rows])

  const activeRetainerCount = useMemo(
    () =>
      rowsWithHealth.filter(
        (r) => r.billing.retainerActive && (r.billing.retainerAmountCents || 0) > 0,
      ).length,
    [rowsWithHealth],
  )

  const hasAnyCharge = useMemo(
    () => rowsWithHealth.some((r) => Object.keys(r.months || {}).length > 0),
    [rowsWithHealth],
  )

  const healthCounts = useMemo(() => {
    let overdue = 0
    let open = 0
    let ok = 0
    let empty = 0
    for (const r of rowsWithHealth) {
      if (r.health === 'overdue') overdue += 1
      else if (r.health === 'open') open += 1
      else if (r.health === 'ok') ok += 1
      else empty += 1
    }
    return { overdue, open, ok, empty, total: rowsWithHealth.length }
  }, [rowsWithHealth])

  const visibleRows = useMemo(() => {
    if (healthFilter === 'todos') return rowsWithHealth
    return rowsWithHealth.filter((r) => r.health === healthFilter)
  }, [rowsWithHealth, healthFilter])

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
        tone: 'rose' as const,
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

  function refreshMap() {
    return qc.invalidateQueries({ queryKey: MAP_KEY })
  }

  async function runGenerate() {
    setGenerating(true)
    try {
      const res = await contabilFeeChargesApi.generate({ yearMonth: generateMonth })
      if (!res.createdCount) {
        toast.message('Nada gerado', {
          description:
            activeRetainerCount === 0
              ? 'Nenhum cliente tem avença activa. Abra o cliente, defina o valor e active a avença.'
              : 'Todos os clientes com avença já têm este mês.',
        })
      } else {
        toast.success(
          `Geradas ${res.createdCount} avença(s)` +
            (res.skippedCount ? ` · ${res.skippedCount} já existiam` : ''),
        )
      }
      setGenerateOpen(false)
      await refreshMap()
    } catch (err) {
      toast.error('Não foi possível gerar', { description: getErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  async function createMonthCharge(row: PaymentsMapRow, yearMonth: string) {
    const key = `${row.clientId}:${yearMonth}`
    setCreatingKey(key)
    try {
      const amount =
        row.billing.retainerAmountCents && row.billing.retainerAmountCents > 0
          ? row.billing.retainerAmountCents
          : 15000
      const res = await contabilFeeChargesApi.create({
        clientId: row.clientId,
        yearMonth,
        amountCents: amount,
        status: 'draft',
      })
      await refreshMap()
      setEdit({
        charge: res.charge,
        clientName: row.displayName,
        clientTaxId: row.taxId,
      })
      toast.success(res.created ? 'Mês criado — ajuste o estado' : 'Mês já existia')
    } catch (err) {
      toast.error('Não foi possível criar o mês', { description: getErrorMessage(err) })
    } finally {
      setCreatingKey(null)
    }
  }

  return (
    <FirmModuleShell
      className="cb-payments-shell cb-payments-page-scroll"
      title="Pagamentos (carteira)"
      subtitle="Operação real do gabinete: quem pagou, quem deve, e acções em cada mês — sem sair da página."
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
            Gerar mês
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
              <div key={item.id} className={cn('cb-payments-kpi', `cb-payments-kpi--${item.tone}`)}>
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

      {!mapQuery.isLoading && data && !hasAnyCharge ? (
        <div className="cb-payments-empty-banner" data-testid="payments-empty-banner">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Ainda sem avenças neste mapa</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Abra um cliente, defina o valor mensal e active a avença — depois use «Gerar mês», ou
              clique em «+» numa célula para criar só esse mês.
            </p>
          </div>
          <Button type="button" onClick={() => setGenerateOpen(true)}>
            Gerar mês
          </Button>
        </div>
      ) : null}

      <div className="cb-payments-section-host">
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

          <div className="cb-payments-health-filters" role="group" aria-label="Filtrar por situação">
            <HealthChip
              active={healthFilter === 'todos'}
              onClick={() => setHealthFilter('todos')}
              label="Todos"
              count={healthCounts.total}
            />
            <HealthChip
              active={healthFilter === 'overdue'}
              onClick={() => setHealthFilter('overdue')}
              label="Inadimplentes"
              count={healthCounts.overdue}
              tone="overdue"
            />
            <HealthChip
              active={healthFilter === 'open'}
              onClick={() => setHealthFilter('open')}
              label="Em aberto"
              count={healthCounts.open}
              tone="open"
            />
            <HealthChip
              active={healthFilter === 'ok'}
              onClick={() => setHealthFilter('ok')}
              label="Adimplentes"
              count={healthCounts.ok}
              tone="ok"
            />
            <HealthChip
              active={healthFilter === 'empty'}
              onClick={() => setHealthFilter('empty')}
              label="Sem meses"
              count={healthCounts.empty}
            />
          </div>
        </div>

        <div className="cb-payments-legend" aria-hidden>
          <Legend swatch="cb-pay-cell--draft" label="Rascunho" />
          <Legend swatch="cb-pay-cell--confirmed" label="Confirmada" />
          <Legend swatch="cb-pay-cell--sent" label="Enviada" />
          <Legend swatch="cb-pay-cell--paid" label="Paga" />
          <Legend swatch="cb-pay-cell--overdue" label="Em atraso" />
          <Legend swatch="cb-pay-cell--add" label="Criar mês" />
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

          {data && rowsWithHealth.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Ainda sem clientes"
              description="Adicione clientes na carteira para controlar avenças aqui."
            />
          ) : null}

          {data && rowsWithHealth.length > 0 && visibleRows.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhum cliente neste filtro"
              description="Altere o filtro de situação ou limpe a pesquisa."
            />
          ) : null}

          {visibleRows.length > 0 ? (
            <div className="cb-payments-table-frame">
              <table className="cb-payments-table">
                <thead>
                  <tr>
                    <th className="cb-payments-client-col sticky left-0 z-10">Cliente</th>
                    {monthKeys.map((ym, i) => (
                      <th key={ym}>{MONTH_SHORT[i]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const hasRetainer =
                      row.billing.retainerActive && (row.billing.retainerAmountCents || 0) > 0
                    const retainerLabel = hasRetainer
                      ? `${formatEuroFromCents(row.billing.retainerAmountCents)}/mês`
                      : 'Definir avença'
                    return (
                      <tr
                        key={row.clientId}
                        className={cn(
                          'cb-payments-row',
                          row.health === 'overdue' && 'cb-payments-row--overdue',
                          row.health === 'ok' && 'cb-payments-row--ok',
                        )}
                      >
                        <td className="cb-payments-client-col sticky left-0 z-10">
                          <button
                            type="button"
                            className="cb-payments-client-btn"
                            onClick={() => setSheetRow(row)}
                          >
                            <span className="cb-payments-client-name">{row.displayName}</span>
                            <span className="cb-payments-client-meta">
                              {row.taxId || 'Sem NIF'} · {retainerLabel}
                            </span>
                            <span className="cb-payments-client-actions">
                              <span className={cn(rowHealthTone(row.health))}>
                                {rowHealthLabel(row.health)}
                              </span>
                              <span className="cb-payments-client-open">Abrir →</span>
                            </span>
                          </button>
                        </td>
                        {monthKeys.map((ym) => {
                          const cell = row.months[ym]
                          const key = `${row.clientId}:${ym}`
                          const busy = creatingKey === key
                          return (
                            <td key={ym}>
                              {cell ? (
                                <button
                                  type="button"
                                  className={cn(statusTone(cell.status, cell.overdue))}
                                  onClick={() =>
                                    setEdit({
                                      charge: cell,
                                      clientName: row.displayName,
                                      clientTaxId: row.taxId,
                                    })
                                  }
                                  title={`${statusLabelPt(cell.status, cell.overdue)} · clicar para editar`}
                                >
                                  <span className="cb-pay-cell-amount">
                                    {formatEuroFromCents(cell.amountCents).replace('\u00a0', ' ')}
                                  </span>
                                  <span className="cb-pay-cell-status">
                                    {statusLabelPt(cell.status, cell.overdue)}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="cb-pay-cell cb-pay-cell--add"
                                  disabled={busy}
                                  onClick={() => void createMonthCharge(row, ym)}
                                  title="Criar avença deste mês"
                                >
                                  {busy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                  ) : (
                                    <>
                                      <Plus className="h-3.5 w-3.5" aria-hidden />
                                      <span className="cb-pay-cell-status">Criar</span>
                                    </>
                                  )}
                                </button>
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
          Clique no cliente (linha) para avença e meses · clique numa célula colorida para marcar pago
          · «+» cria o mês. Controlo interno — não substitui faturação AT.
          {data?.connect?.nudge ? (
            <>
              {' '}
              <Link
                to="/app/firm/settings?tab=pagamentos"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                Receber online
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <ClientPaymentsDialog
        open={Boolean(sheetRow)}
        onOpenChange={(o) => {
          if (!o) setSheetRow(null)
        }}
        row={sheetRow}
        year={year}
        monthKeys={monthKeys}
        onEditCharge={(charge, clientName) =>
          setEdit({ charge, clientName, clientTaxId: sheetRow?.taxId })
        }
        onCreateMonth={(yearMonth) => {
          if (!sheetRow) return
          void createMonthCharge(sheetRow, yearMonth)
        }}
        creatingYearMonth={
          sheetRow && creatingKey?.startsWith(`${sheetRow.clientId}:`)
            ? creatingKey.split(':')[1]
            : null
        }
        onBillingSaved={() => void refreshMap()}
      />

      <ChargeEditDialog
        open={Boolean(edit)}
        onOpenChange={(o) => {
          if (!o) setEdit(null)
        }}
        charge={edit?.charge || null}
        clientName={edit?.clientName || ''}
        clientTaxId={edit?.clientTaxId}
        paymentMethods={data?.paymentMethods || []}
        onSaved={() => void refreshMap()}
      />

      <GenerateMonthDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        yearMonth={generateMonth}
        onYearMonthChange={setGenerateMonth}
        activeRetainerCount={activeRetainerCount}
        generating={generating}
        onGenerate={() => void runGenerate()}
      />
    </FirmModuleShell>
  )
}

function HealthChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  tone?: 'overdue' | 'open' | 'ok'
}) {
  return (
    <button
      type="button"
      className={cn(
        'cb-payments-health-chip',
        active && 'cb-payments-health-chip--active',
        tone && `cb-payments-health-chip--${tone}`,
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="cb-payments-health-chip-count">{count}</span>
    </button>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="cb-payments-legend-item">
      <span className={cn('cb-payments-legend-swatch', swatch)} aria-hidden />
      {label}
    </span>
  )
}
