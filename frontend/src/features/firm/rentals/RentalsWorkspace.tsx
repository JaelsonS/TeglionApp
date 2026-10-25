import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

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
  receiptTone,
} from '@/features/firm/rentals/rentalsFormat'
import { ReceiptEditDialog } from '@/features/firm/rentals/ReceiptEditDialog'
import { PropertyDialog } from '@/features/firm/rentals/PropertyDialog'
import { LeaseDialog } from '@/features/firm/rentals/LeaseDialog'

const OVERVIEW_KEY = ['rentals-overview'] as const

export function RentalsWorkspace() {
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
  const [generateMonth, setGenerateMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [generating, setGenerating] = useState(false)
  const [edit, setEdit] = useState<{ receipt: RentReceipt; title: string } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const overviewQuery = useQuery({
    queryKey: [...OVERVIEW_KEY, year, qDebounced],
    queryFn: () => contabilRentalsApi.overview({ year, q: qDebounced || undefined }),
  })

  const data = overviewQuery.data
  const monthKeys = data?.months || []

  async function runGenerate() {
    setGenerating(true)
    try {
      const res = await contabilRentalsApi.generateReceipts({ yearMonth: generateMonth })
      toast.success(
        `Gerados ${res.createdCount} recibo(s)` +
          (res.skippedCount ? ` · ${res.skippedCount} ignorados` : ''),
      )
      setGenerateOpen(false)
      await qc.invalidateQueries({ queryKey: OVERVIEW_KEY })
    } catch (err) {
      toast.error('Não foi possível gerar', { description: getErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <FirmModuleShell
      title="Imóveis e rendas"
      subtitle="Contratos e recibos de renda dos clientes do gabinete — registo interno. Não substitui o Portal das Finanças nem comunicação à AT."
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
            Imóvel
          </Button>
          <Button type="button" size="sm" onClick={() => setGenerateOpen(true)}>
            Gerar recibos
          </Button>
        </div>
      }
      bodyClassName="cb-rentals-body px-4 pb-4 sm:px-5"
    >
      <div className="cb-rentals-chrome shrink-0 space-y-3 pb-3">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Registo interno do gabinete</p>
          <p className="mt-1 text-amber-950/90">
            {data?.disclaimer ||
              'Recibos de renda INTERNOS para controlo. Não são recibos oficiais do Portal das Finanças nem comunicação à AT.'}
          </p>
        </div>

        {data?.summary ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryChip label="Pago" value={formatEuroFromCents(data.summary.paidCents)} />
            <SummaryChip label="Em aberto" value={formatEuroFromCents(data.summary.openCents)} />
            <SummaryChip label="Atrasado" value={formatEuroFromCents(data.summary.overdueCents)} warn />
            <SummaryChip label="Rascunho" value={formatEuroFromCents(data.summary.draftCents)} />
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar imóvel, senhorio ou inquilino…"
            className="max-w-md"
            aria-label="Procurar imóveis"
          />
        </div>
      </div>

      <div className="cb-rentals-list min-h-0 flex-1 overflow-auto">
        {overviewQuery.isLoading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
          </div>
        ) : overviewQuery.isError ? (
          <p className="py-8 text-sm text-destructive">Não foi possível carregar os imóveis.</p>
        ) : !data?.rows?.length ? (
          <EmptyState
            icon={Building2}
            title="Ainda sem imóveis"
            description="Adicione um imóvel do cliente (senhorio), crie o contrato com o inquilino e gere os recibos do mês."
            action={
              <Button type="button" onClick={() => setPropertyEdit({})}>
                Novo imóvel
              </Button>
            }
          />
        ) : (
          <div className="space-y-4 pb-4">
            {data.rows.map((row) => (
              <section
                key={row.property.id}
                className="rounded-2xl border border-border/70 bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">{row.property.label}</h2>
                    <p className="text-sm text-muted-foreground">
                      Senhorio: {row.client.displayName}
                      {row.client.taxId ? ` · NIF ${row.client.taxId}` : ''}
                    </p>
                    {(row.property.addressLine || row.property.locality) && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[row.property.addressLine, row.property.postalCode, row.property.locality]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {row.property.artigoMatricial ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Artigo matricial: {row.property.artigoMatricial}
                      </p>
                    ) : null}
                    {row.property.status && row.property.status !== 'active' ? (
                      <p className="mt-1 text-xs font-medium text-amber-800">
                        Estado: {row.property.status}
                      </p>
                    ) : null}
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
                      Editar imóvel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLeaseEdit({ propertyId: row.property.id, label: row.property.label })
                      }
                    >
                      Novo contrato
                    </Button>
                  </div>
                </div>

                {!row.leases.length ? (
                  <p className="mt-3 text-sm text-muted-foreground">Sem contratos. Crie um para gerar recibos.</p>
                ) : (
                  <div className="mt-4 space-y-4 overflow-x-auto">
                    {row.leases.map((lease) => (
                      <LeaseRow
                        key={lease.id}
                        lease={lease}
                        monthKeys={monthKeys}
                        statusLabels={data.statusLabels}
                        onEditLease={() =>
                          setLeaseEdit({
                            propertyId: row.property.id,
                            label: row.property.label,
                            lease,
                          })
                        }
                        onEditReceipt={(receipt) =>
                          setEdit({
                            receipt,
                            title: `${row.property.label} · ${lease.tenantDisplayName}`,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {generateOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Gerar recibos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria rascunhos para contratos activos no mês escolhido (ignora os que já existem).
            </p>
            <label className="mt-4 block text-sm font-medium">Mês (AAAA-MM)</label>
            <Input
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              placeholder="2026-10"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void runGenerate()} disabled={generating}>
                {generating ? 'A gerar…' : 'Gerar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {propertyEdit ? (
        <PropertyDialog
          initial={propertyEdit.property}
          initialClient={propertyEdit.client}
          onClose={() => setPropertyEdit(null)}
          onSaved={async () => {
            setPropertyEdit(null)
            await qc.invalidateQueries({ queryKey: OVERVIEW_KEY })
          }}
        />
      ) : null}

      {leaseEdit ? (
        <LeaseDialog
          propertyId={leaseEdit.propertyId}
          propertyLabel={leaseEdit.label}
          initial={leaseEdit.lease}
          onClose={() => setLeaseEdit(null)}
          onSaved={async () => {
            setLeaseEdit(null)
            await qc.invalidateQueries({ queryKey: OVERVIEW_KEY })
          }}
        />
      ) : null}

      {edit ? (
        <ReceiptEditDialog
          receipt={edit.receipt}
          title={edit.title}
          paymentMethods={data?.paymentMethods || []}
          onClose={() => setEdit(null)}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: OVERVIEW_KEY })
          }}
        />
      ) : null}
    </FirmModuleShell>
  )
}

function SummaryChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-card px-3 py-2.5',
        warn && 'border-amber-200/80 bg-amber-50/40',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function LeaseRow({
  lease,
  monthKeys,
  statusLabels,
  onEditLease,
  onEditReceipt,
}: {
  lease: PropertyLease
  monthKeys: string[]
  statusLabels: Record<string, string>
  onEditLease: () => void
  onEditReceipt: (r: RentReceipt) => void
}) {
  const months = lease.months || {}
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="font-medium">{lease.tenantDisplayName}</span>
          <span className="text-muted-foreground">
            {formatEuroFromCents(lease.monthlyRentCents)}/mês · dia {lease.rentDueDay}
            {lease.tenantNif ? ` · NIF ${lease.tenantNif}` : ''}
            {lease.status !== 'active' ? ` · ${lease.status}` : ''}
          </span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onEditLease}>
          <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
          Editar contrato
        </Button>
      </div>
      <div className="inline-grid min-w-max grid-cols-12 gap-1">
        {monthKeys.map((ym, i) => {
          const cell = months[ym]
          return (
            <button
              key={ym}
              type="button"
              disabled={!cell}
              onClick={() => cell && onEditReceipt(cell)}
              title={
                cell
                  ? `${ym}: ${statusLabels[cell.status] || cell.status}${cell.overdue ? ' (atrasado)' : ''}`
                  : ym
              }
              className={cn(
                'flex h-14 w-14 flex-col items-center justify-center rounded-lg border text-[10px] leading-tight',
                cell
                  ? receiptTone(cell.status, cell.overdue)
                  : 'border-dashed border-border/60 text-muted-foreground/70',
                cell && 'cursor-pointer hover:ring-2 hover:ring-brand/30',
              )}
            >
              <span className="font-medium">{MONTH_SHORT[i]}</span>
              <span className="tabular-nums">
                {cell ? formatEuroFromCents(cell.amountCents).replace(/\s/g, '') : '—'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
