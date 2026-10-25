import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EmptyState } from '@/shared/design-system'
import { contabilClientsApi, contabilRentalsApi } from '@/infrastructure/api'
import type { PropertyLease, RentReceipt } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import {
  MONTH_SHORT,
  formatEuroFromCents,
  receiptTone,
} from '@/features/firm/rentals/rentalsFormat'
import { ReceiptEditDialog } from '@/features/firm/rentals/ReceiptEditDialog'

const OVERVIEW_KEY = ['rentals-overview'] as const

export function RentalsWorkspace() {
  const qc = useQueryClient()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [propertyOpen, setPropertyOpen] = useState(false)
  const [leaseFor, setLeaseFor] = useState<{ propertyId: string; label: string } | null>(null)
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
      subtitle="Contratos e recibos internos para o escritório acompanhar rendas — sem comunicação à AT."
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-[4rem] text-center text-sm font-semibold tabular-nums">{year}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPropertyOpen(true)}>
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Imóvel
          </Button>
          <Button type="button" size="sm" onClick={() => setGenerateOpen(true)}>
            Gerar recibos
          </Button>
        </div>
      }
      bodyClassName="overflow-auto px-4 pb-6 sm:px-5"
    >
      <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Registo interno</p>
        <p className="mt-1 text-amber-950/90">
          {data?.disclaimer ||
            'Recibos de renda INTERNOS para controlo do escritório. Não são recibos oficiais do Portal das Finanças nem comunicação à AT.'}
        </p>
      </div>

      {data?.summary ? (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span>Pago: {formatEuroFromCents(data.summary.paidCents)}</span>
          <span className="text-muted-foreground">·</span>
          <span>Em aberto: {formatEuroFromCents(data.summary.openCents)}</span>
          <span className="text-muted-foreground">·</span>
          <span>Atrasado: {formatEuroFromCents(data.summary.overdueCents)}</span>
          <span className="text-muted-foreground">·</span>
          <span>Rascunho: {formatEuroFromCents(data.summary.draftCents)}</span>
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar imóvel, senhorio ou inquilino…"
          className="max-w-md"
        />
      </div>

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
            <Button type="button" onClick={() => setPropertyOpen(true)}>
              Novo imóvel
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {data.rows.map((row) => (
            <section
              key={row.property.id}
              className="rounded-2xl border border-border/70 bg-background/60 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
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
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLeaseFor({ propertyId: row.property.id, label: row.property.label })
                  }
                >
                  Novo contrato
                </Button>
              </div>

              {!row.leases.length ? (
                <p className="mt-3 text-sm text-muted-foreground">Sem contratos activos.</p>
              ) : (
                <div className="mt-4 space-y-4 overflow-x-auto">
                  {row.leases.map((lease) => (
                    <LeaseRow
                      key={lease.id}
                      lease={lease}
                      monthKeys={monthKeys}
                      statusLabels={data.statusLabels}
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
              <Button type="button" onClick={runGenerate} disabled={generating}>
                {generating ? 'A gerar…' : 'Gerar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {propertyOpen ? (
        <PropertyDialog
          onClose={() => setPropertyOpen(false)}
          onSaved={async () => {
            setPropertyOpen(false)
            await qc.invalidateQueries({ queryKey: OVERVIEW_KEY })
          }}
        />
      ) : null}

      {leaseFor ? (
        <LeaseDialog
          propertyId={leaseFor.propertyId}
          propertyLabel={leaseFor.label}
          onClose={() => setLeaseFor(null)}
          onSaved={async () => {
            setLeaseFor(null)
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

function LeaseRow({
  lease,
  monthKeys,
  statusLabels,
  onEditReceipt,
}: {
  lease: PropertyLease
  monthKeys: string[]
  statusLabels: Record<string, string>
  onEditReceipt: (r: RentReceipt) => void
}) {
  const months = lease.months || {}
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-medium">{lease.tenantDisplayName}</span>
        <span className="text-muted-foreground">
          {formatEuroFromCents(lease.monthlyRentCents)}/mês · dia {lease.rentDueDay}
          {lease.status !== 'active' ? ` · ${lease.status}` : ''}
        </span>
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

function PropertyDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const clientsQuery = useQuery({
    queryKey: ['clients-for-rentals'],
    queryFn: () => contabilClientsApi.list({ limit: 200 }),
  })
  const clients = useMemo(() => clientsQuery.data?.items || [], [clientsQuery.data])
  const [clientId, setClientId] = useState('')
  const [label, setLabel] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [locality, setLocality] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!clientId || !label.trim()) {
      toast.error('Escolha o cliente e identifique o imóvel')
      return
    }
    setSaving(true)
    try {
      await contabilRentalsApi.createProperty({
        clientId,
        label: label.trim(),
        addressLine: addressLine.trim() || null,
        locality: locality.trim() || null,
      })
      toast.success('Imóvel criado')
      onSaved()
    } catch (err) {
      toast.error('Não foi possível criar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-lg">
        <h2 className="text-lg font-semibold">Novo imóvel</h2>
        <p className="mt-1 text-sm text-muted-foreground">Associado ao cliente senhorio.</p>

        <label className="mt-4 block text-sm font-medium">Cliente (senhorio)</label>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">—</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || c.fullName || c.id}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-sm font-medium">Identificação</label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="T2 — Rua X" />

        <label className="mt-3 block text-sm font-medium">Morada</label>
        <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />

        <label className="mt-3 block text-sm font-medium">Localidade</label>
        <Input value={locality} onChange={(e) => setLocality(e.target.value)} />

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'A guardar…' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function LeaseDialog({
  propertyId,
  propertyLabel,
  onClose,
  onSaved,
}: {
  propertyId: string
  propertyLabel: string
  onClose: () => void
  onSaved: () => void
}) {
  const [tenantDisplayName, setTenantDisplayName] = useState('')
  const [tenantNif, setTenantNif] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [rentEuro, setRentEuro] = useState('800')
  const [rentDueDay, setRentDueDay] = useState('1')
  const [saving, setSaving] = useState(false)

  async function save() {
    const euros = Number(String(rentEuro).replace(',', '.'))
    const due = Math.round(Number(rentDueDay))
    if (!tenantDisplayName.trim() || !Number.isFinite(euros) || euros < 0) {
      toast.error('Preencha inquilino e renda')
      return
    }
    setSaving(true)
    try {
      await contabilRentalsApi.createLease(propertyId, {
        tenantDisplayName: tenantDisplayName.trim(),
        tenantNif: tenantNif.trim() || null,
        startDate,
        monthlyRentCents: Math.round(euros * 100),
        rentDueDay: due,
        leaseType: 'habitacao',
        status: 'active',
      })
      toast.success('Contrato criado')
      onSaved()
    } catch (err) {
      toast.error('Não foi possível criar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-lg">
        <h2 className="text-lg font-semibold">Novo contrato</h2>
        <p className="mt-1 text-sm text-muted-foreground">{propertyLabel}</p>

        <label className="mt-4 block text-sm font-medium">Inquilino</label>
        <Input value={tenantDisplayName} onChange={(e) => setTenantDisplayName(e.target.value)} />

        <label className="mt-3 block text-sm font-medium">NIF inquilino</label>
        <Input value={tenantNif} onChange={(e) => setTenantNif(e.target.value)} />

        <label className="mt-3 block text-sm font-medium">Início</label>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <label className="mt-3 block text-sm font-medium">Renda mensal (€)</label>
        <Input value={rentEuro} onChange={(e) => setRentEuro(e.target.value)} inputMode="decimal" />

        <label className="mt-3 block text-sm font-medium">Dia de vencimento (1–28)</label>
        <Input value={rentDueDay} onChange={(e) => setRentDueDay(e.target.value)} inputMode="numeric" />

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'A guardar…' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
