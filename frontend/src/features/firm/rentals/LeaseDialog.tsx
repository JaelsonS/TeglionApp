import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { contabilRentalsApi } from '@/infrastructure/api'
import type { PropertyLease } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'

type Props = {
  propertyId: string
  propertyLabel: string
  initial?: PropertyLease | null
  onClose: () => void
  onSaved: () => void
}

export function LeaseDialog({ propertyId, propertyLabel, initial, onClose, onSaved }: Props) {
  const isEdit = Boolean(initial?.id)
  const [tenantDisplayName, setTenantDisplayName] = useState(initial?.tenantDisplayName || '')
  const [tenantNif, setTenantNif] = useState(initial?.tenantNif || '')
  const [tenantEmail, setTenantEmail] = useState(initial?.tenantEmail || '')
  const [tenantPhone, setTenantPhone] = useState(initial?.tenantPhone || '')
  const [startDate, setStartDate] = useState(
    initial?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  )
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) || '')
  const [rentEuro, setRentEuro] = useState(
    initial ? String((initial.monthlyRentCents / 100).toFixed(2)) : '800',
  )
  const [rentDueDay, setRentDueDay] = useState(String(initial?.rentDueDay ?? 1))
  const [leaseType, setLeaseType] = useState(initial?.leaseType || 'habitacao')
  const [status, setStatus] = useState(initial?.status || 'active')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    const euros = Number(String(rentEuro).replace(',', '.'))
    const due = Math.round(Number(rentDueDay))
    if (!tenantDisplayName.trim() || !Number.isFinite(euros) || euros < 0) {
      toast.error('Preencha inquilino e renda')
      return
    }
    if (!Number.isFinite(due) || due < 1 || due > 28) {
      toast.error('Dia de vencimento entre 1 e 28')
      return
    }
    setSaving(true)
    try {
      const payload = {
        tenantDisplayName: tenantDisplayName.trim(),
        tenantNif: tenantNif.trim() || null,
        tenantEmail: tenantEmail.trim() || null,
        tenantPhone: tenantPhone.trim() || null,
        startDate,
        endDate: endDate.trim() || null,
        monthlyRentCents: Math.round(euros * 100),
        rentDueDay: due,
        leaseType,
        status,
        notes: notes.trim() || null,
      }
      if (isEdit && initial) {
        await contabilRentalsApi.patchLease(initial.id, payload)
        toast.success('Contrato actualizado')
      } else {
        await contabilRentalsApi.createLease(propertyId, payload)
        toast.success('Contrato criado')
      }
      onSaved()
    } catch (err) {
      toast.error(isEdit ? 'Não foi possível guardar' : 'Não foi possível criar', {
        description: getErrorMessage(err),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold">{isEdit ? 'Editar contrato' : 'Novo contrato'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{propertyLabel}</p>

        <label className="mt-4 block text-sm font-medium">Inquilino</label>
        <Input value={tenantDisplayName} onChange={(e) => setTenantDisplayName(e.target.value)} />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">NIF inquilino</label>
            <Input value={tenantNif} onChange={(e) => setTenantNif(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefone</label>
            <Input value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} />
          </div>
        </div>

        <label className="mt-3 block text-sm font-medium">Email</label>
        <Input
          type="email"
          value={tenantEmail}
          onChange={(e) => setTenantEmail(e.target.value)}
          placeholder="opcional"
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Início</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Fim (opcional)</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Renda mensal (€)</label>
            <Input value={rentEuro} onChange={(e) => setRentEuro(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="block text-sm font-medium">Dia vencimento (1–28)</label>
            <Input value={rentDueDay} onChange={(e) => setRentDueDay(e.target.value)} inputMode="numeric" />
          </div>
        </div>

        <label className="mt-3 block text-sm font-medium">Tipo de contrato</label>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={leaseType}
          onChange={(e) => setLeaseType(e.target.value)}
        >
          <option value="habitacao">Habitação</option>
          <option value="comercio">Comércio</option>
          <option value="outro">Outro</option>
        </select>

        <label className="mt-3 block text-sm font-medium">Estado</label>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">Activo</option>
          <option value="ended">Terminado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <label className="mt-3 block text-sm font-medium">Notas</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? 'A guardar…' : isEdit ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
