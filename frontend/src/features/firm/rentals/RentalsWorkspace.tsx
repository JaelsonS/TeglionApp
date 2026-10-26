import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EmptyState } from '@/shared/design-system'
import { contabilRentalsApi } from '@/infrastructure/api'
import type {
  ClientProperty,
  PropertyLease,
  RentReceipt,
} from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import {
  MONTH_SHORT,
  formatEuroFromCents,
  leaseHealth,
  leaseHealthLabel,
  leaseHealthTone,
  receiptLabelPt,
  receiptTone,
} from '@/features/firm/rentals/rentalsFormat'
import { ReceiptEditDialog } from '@/features/firm/rentals/ReceiptEditDialog'
import { PropertyDialog } from '@/features/firm/rentals/PropertyDialog'
import { LeaseDialog } from '@/features/firm/rentals/LeaseDialog'
import { GenerateRentReceiptsDialog } from '@/features/firm/rentals/GenerateRentReceiptsDialog'

type RentalsVariant = 'office' | 'client'

type ReceiptEditCtx = {
  receipt: RentReceipt
  propertyLabel: string
  landlordName: string
  landlordTaxId?: string | null
  tenantName: string
  tenantNif?: string | null
}

type Props = {
  /** office = custos do gabinete; client = imóveis/rendas dos clientes (módulo separado) */
  variant?: RentalsVariant
}

export function RentalsWorkspace({ variant = 'office' }: Props) {
  const isClient = variant === 'client'
  const OVERVIEW_KEY = isClient ? (['client-rentals-overview'] as const) : (['rentals-overview'] as const)
  const qc = useQueryClient()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [propertyEdit, setPropertyEdit] = useState<{
    property?: ClientProperty | null
    client?: { id: string; displayName: string; taxId?: string | null } | null
  } | null>(null)
  const [leaseEdit, setLeaseEdit] = useState<{
    propertyId: string
    label: string
    lease?: PropertyLease | null
  } | null>(null)
  const [fromYearMonth, setFromYearMonth] = useState(() => `${new Date().getFullYear()}-01`)
  const [toYearMonth, setToYearMonth] = useState(() => `${new Date().getFullYear()}-12`)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setFromYearMonth(`${year}-01`)
    setToYearMonth(`${year}-12`)
  }, [year])
  const [creatingKey, setCreatingKey] = useState<string | null>(null)
  const [edit, setEdit] = useState<ReceiptEditCtx | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const overviewQuery = useQuery({
    queryKey: [...OVERVIEW_KEY, year, qDebounced, variant],
    queryFn: () =>
      contabilRentalsApi.overview({
        year,
        q: qDebounced || undefined,
        scope: variant,
      }),
  })

  const data = overviewQuery.data
  const monthKeys = data?.months || []

  const activeLeaseCount = useMemo(() => {
    let n = 0
    for (const row of data?.rows || []) {
      for (const lease of row.leases || []) {
        if (lease.status === 'active') n += 1
      }
    }
    return n
  }, [data?.rows])

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

  function refresh() {
    return qc.invalidateQueries({ queryKey: OVERVIEW_KEY })
  }

  function eachYearMonth(from: string, to: string): string[] {
    if (!/^\d{4}-\d{2}$/.test(from) || !/^\d{4}-\d{2}$/.test(to) || from > to) return []
    const out: string[] = []
    let [y, m] = from.split('-').map(Number)
    const [ty, tm] = to.split('-').map(Number)
    while (y < ty || (y === ty && m <= tm)) {
      out.push(`${y}-${String(m).padStart(2, '0')}`)
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
    }
    return out
  }

  async function runGenerate() {
    const months = eachYearMonth(fromYearMonth, toYearMonth)
    if (!months.length) {
      toast.error('Intervalo inválido', { description: 'Verifique De / Até.' })
      return
    }
    setGenerating(true)
    try {
      let createdCount = 0
      let skippedCount = 0
      for (const yearMonth of months) {
        const res = await contabilRentalsApi.generateReceipts({ yearMonth, scope: variant })
        createdCount += res.createdCount || 0
        skippedCount += res.skippedCount || 0
      }
      if (!createdCount) {
        toast.message('Nada aplicado', {
          description:
            activeLeaseCount === 0
              ? isClient
                ? 'Sem contratos activos. Crie um imóvel e um contrato de arrendamento primeiro.'
                : 'Sem contratos activos. Crie um custo/contrato primeiro.'
              : 'Todos os contratos elegíveis já têm estes meses no mapa.',
        })
      } else {
        toast.success(
          `Aplicados ${createdCount} rascunho(s)` +
            (skippedCount ? ` · ${skippedCount} já existentes/fora do contrato` : ''),
        )
      }
      setGenerateOpen(false)
      await refresh()
    } catch (err) {
      toast.error('Não foi possível aplicar o mapa', { description: getErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  async function createMonthReceipt(lease: PropertyLease, yearMonth: string, ctx: Omit<ReceiptEditCtx, 'receipt'>) {
    const key = `${lease.id}:${yearMonth}`
    setCreatingKey(key)
    try {
      const res = await contabilRentalsApi.createReceipt({
        leaseId: lease.id,
        yearMonth,
        amountCents: lease.monthlyRentCents,
        status: 'draft',
      })
      await refresh()
      setEdit({ ...ctx, receipt: res.receipt })
      toast.success(res.created ? 'Mês criado — ajuste o estado' : 'Mês já existia')
    } catch (err) {
      toast.error('Não foi possível criar o mês', { description: getErrorMessage(err) })
    } finally {
      setCreatingKey(null)
    }
  }

  return (
    <FirmModuleShell
      className="cb-rentals-shell cb-rentals-page-scroll"
      title={isClient ? 'Arrendamentos dos clientes' : 'Custos do gabinete'}
      subtitle={
        isClient
          ? 'Imóveis e contratos de arrendamento dos seus clientes (senhorio → inquilino) — mapa mensal de rendas interno.'
          : 'Renda do escritório, luz, gás, água, software e outros contratos do gabinete — mapa mensal de quem pagou e o que está em aberto.'
      }
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-[4rem] text-center text-sm font-semibold tabular-nums">{year}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPropertyEdit({})}>
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            {isClient ? 'Imóvel' : 'Contrato / custo'}
          </Button>
          <Button type="button" size="sm" onClick={() => setGenerateOpen(true)}>
            {isClient ? 'Gerar recibos' : 'Configurar custos'}
          </Button>
        </div>
      }
      bodyClassName="gap-0 cb-rentals-body"
    >
      {kpis.length > 0 ? (
        <div className="cb-rentals-kpi-strip" data-testid="rentals-kpi-strip">
          {kpis.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className={cn('cb-rentals-kpi', `cb-rentals-kpi--${item.tone}`)}>
                <span className="cb-rentals-kpi-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="cb-rentals-kpi-value">{item.value}</p>
                  <p className="cb-rentals-kpi-label">{item.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <p className="cb-rentals-section-lead">
        <span className="cb-rentals-section-lead-title">
          {isClient ? 'Mapa de rendas dos clientes' : 'Mapa de custos do gabinete'}
        </span>
        {isClient
          ? 'Recibos internos por cliente — não substituem o Portal das Finanças nem comunicação à AT. Clique numa célula para editar ou marcar como pago.'
          : 'Controlo interno de arrendamento, utilities e licenças do escritório. Separado dos arrendamentos dos clientes. Clique numa célula para editar ou marcar como pago.'}
      </p>

      <div className="cb-rentals-section-host">
        <div className="cb-rentals-toolbar">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={q}
              onChange={(e: FormChangeEvent) => setQ(e.target.value)}
              placeholder={
                isClient
                  ? 'Procurar imóvel, senhorio ou inquilino…'
                  : 'Procurar contrato, fornecedor ou categoria…'
              }
              aria-label={isClient ? 'Procurar arrendamentos' : 'Procurar custos do gabinete'}
            />
          </div>
          <div className="cb-rentals-legend" aria-hidden>
            <Legend swatch="cb-rent-cell--draft" label="Rascunho" />
            <Legend swatch="cb-rent-cell--issued" label="Emitido" />
            <Legend swatch="cb-rent-cell--paid" label="Pago" />
            <Legend swatch="cb-rent-cell--overdue" label="Em atraso" />
            <Legend swatch="cb-rent-cell--add" label="Criar mês" />
          </div>
        </div>

        <div className="cb-rentals-list">
          {overviewQuery.isLoading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
            </div>
          ) : overviewQuery.isError ? (
            <p className="py-8 text-sm text-destructive">
              {isClient
                ? 'Não foi possível carregar os imóveis.'
                : 'Não foi possível carregar os contratos.'}
            </p>
          ) : !data?.rows?.length ? (
            <EmptyState
              icon={Building2}
              title={isClient ? 'Ainda sem imóveis de clientes' : 'Ainda sem custos do gabinete'}
              description={
                isClient
                  ? 'Adicione um imóvel do cliente (senhorio), crie o contrato com o inquilino e gere os recibos do mês.'
                  : 'Registe a renda do escritório, luz, gás, água, software ou outro contrato — depois gere os meses no mapa.'
              }
              action={
                <Button type="button" onClick={() => setPropertyEdit({})}>
                  {isClient ? 'Novo imóvel' : 'Novo contrato / custo'}
                </Button>
              }
            />
          ) : (
            <div className="space-y-4 pb-2">
              {data.rows.map((row) => (
                <section key={row.property.id} className="cb-rentals-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold tracking-tight">{row.property.label}</h2>
                      <p className="text-sm text-muted-foreground">
                        {isClient
                          ? `Senhorio: ${row.client.displayName}`
                          : `Fornecedor / titular: ${row.client?.displayName || 'Gabinete'}`}
                        {row.client.taxId ? ` · NIF ${row.client.taxId}` : ''}
                      </p>
                      {(row.property.addressLine || row.property.locality) && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {[row.property.addressLine, row.property.postalCode, row.property.locality]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPropertyEdit({ property: row.property, client: row.client })
                        }
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                        Editar / apagar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLeaseEdit({ propertyId: row.property.id, label: row.property.label })
                        }
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
                        {isClient ? 'Contrato' : 'Plano mensal'}
                      </Button>
                    </div>
                  </div>

                  {!(row.leases || []).filter((l) => l.status !== 'cancelled').length ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {isClient
                        ? 'Sem contrato activo. Adicione o inquilino e a renda mensal.'
                        : 'Sem plano mensal. Defina valor e vencimento para controlar os meses no mapa.'}
                    </p>
                  ) : (
                    <div className="mt-4 space-y-5">
                      {(row.leases || [])
                        .filter((l) => l.status !== 'cancelled')
                        .map((lease) => {
                        const health = leaseHealth(lease.months)
                        const ctx = {
                          propertyLabel: row.property.label,
                          landlordName: row.client.displayName,
                          landlordTaxId: row.client.taxId,
                          tenantName: lease.tenantDisplayName,
                          tenantNif: lease.tenantNif,
                        }
                        return (
                          <div key={lease.id}>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">{lease.tenantDisplayName}</span>
                                <span className={cn(leaseHealthTone(health))}>
                                  {leaseHealthLabel(health)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatEuroFromCents(lease.monthlyRentCents)}/mês · dia{' '}
                                  {lease.rentDueDay}
                                  {lease.tenantNif ? ` · NIF ${lease.tenantNif}` : ''}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setLeaseEdit({
                                    propertyId: row.property.id,
                                    label: row.property.label,
                                    lease,
                                  })
                                }
                              >
                                <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                                Editar / apagar
                              </Button>
                            </div>
                            <div className="cb-rentals-months">
                              {monthKeys.map((ym, i) => {
                                const cell = lease.months?.[ym]
                                const key = `${lease.id}:${ym}`
                                const busy = creatingKey === key
                                return cell ? (
                                  <button
                                    key={ym}
                                    type="button"
                                    className={cn(receiptTone(cell.status, cell.overdue))}
                                    onClick={() => setEdit({ ...ctx, receipt: cell })}
                                    title={receiptLabelPt(cell.status, cell.overdue)}
                                  >
                                    <span className="cb-rent-cell-month">{MONTH_SHORT[i]}</span>
                                    <span className="cb-rent-cell-amount">
                                      {formatEuroFromCents(cell.amountCents).replace('\u00a0', ' ')}
                                    </span>
                                    <span className="cb-rent-cell-status">
                                      {receiptLabelPt(cell.status, cell.overdue)}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    key={ym}
                                    type="button"
                                    className="cb-rent-cell cb-rent-cell--add"
                                    disabled={busy || lease.status !== 'active'}
                                    onClick={() => void createMonthReceipt(lease, ym, ctx)}
                                    title="Criar recibo deste mês"
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                    ) : (
                                      <>
                                        <span className="cb-rent-cell-month">{MONTH_SHORT[i]}</span>
                                        <Plus className="h-3.5 w-3.5" aria-hidden />
                                        <span className="cb-rent-cell-status">Criar</span>
                                      </>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        <p className="cb-rentals-foot">
          {isClient
            ? 'Registo interno de arrendamentos dos clientes. Não substitui recibos oficiais AT nem o Portal das Finanças.'
            : 'Controlo interno de custos do gabinete — separado dos arrendamentos dos clientes. Não substitui facturas oficiais nem declarações à AT.'}
        </p>
      </div>

      <GenerateRentReceiptsDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        year={year}
        fromYearMonth={fromYearMonth}
        toYearMonth={toYearMonth}
        onFromYearMonthChange={setFromYearMonth}
        onToYearMonthChange={setToYearMonth}
        activeLeaseCount={activeLeaseCount}
        generating={generating}
        onGenerate={() => void runGenerate()}
      />

      <PropertyDialog
        open={Boolean(propertyEdit)}
        onOpenChange={(o: boolean) => {
          if (!o) setPropertyEdit(null)
        }}
        mode={variant}
        initial={propertyEdit?.property}
        initialClient={
          propertyEdit?.client && propertyEdit.client.id !== 'office'
            ? propertyEdit.client
            : null
        }
        onSaved={() => void refresh()}
      />

      <LeaseDialog
        open={Boolean(leaseEdit)}
        onOpenChange={(o: boolean) => {
          if (!o) setLeaseEdit(null)
        }}
        variant={variant}
        propertyId={leaseEdit?.propertyId || ''}
        propertyLabel={leaseEdit?.label || ''}
        initial={leaseEdit?.lease}
        onSaved={() => void refresh()}
      />

      <ReceiptEditDialog
        open={Boolean(edit)}
        onOpenChange={(o: boolean) => {
          if (!o) setEdit(null)
        }}
        receipt={edit?.receipt || null}
        propertyLabel={edit?.propertyLabel || ''}
        landlordName={edit?.landlordName || ''}
        landlordTaxId={edit?.landlordTaxId}
        tenantName={edit?.tenantName || ''}
        tenantNif={edit?.tenantNif}
        paymentMethods={data?.paymentMethods || []}
        onSaved={() => void refresh()}
      />
    </FirmModuleShell>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="cb-rentals-legend-item">
      <span className={cn('cb-rentals-legend-swatch', swatch)} aria-hidden />
      {label}
    </span>
  )
}
