import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { contabilRentalsApi } from '@/infrastructure/api'
import type { RentReceipt, RentReceiptStatus } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatEuroFromCents } from '@/features/firm/rentals/rentalsFormat'

const STATUSES: Array<{ id: RentReceiptStatus; label: string }> = [
  { id: 'draft', label: 'Rascunho' },
  { id: 'issued', label: 'Emitido (interno)' },
  { id: 'paid', label: 'Pago' },
  { id: 'cancelled', label: 'Cancelado' },
]

type Props = {
  receipt: RentReceipt
  title: string
  paymentMethods: Array<{ id: string; label: string }>
  onClose: () => void
  onSaved: () => void
}

export function ReceiptEditDialog({ receipt, title, paymentMethods, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<RentReceiptStatus>(receipt.status)
  const [amountEuro, setAmountEuro] = useState(String(((receipt.amountCents || 0) / 100).toFixed(2)))
  const [method, setMethod] = useState(receipt.paymentMethod || '')
  const [notes, setNotes] = useState(receipt.notes || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const euros = Number(String(amountEuro).replace(',', '.'))
      if (!Number.isFinite(euros) || euros < 0) {
        toast.error('Valor inválido')
        return
      }
      await contabilRentalsApi.patchReceipt(receipt.id, {
        status,
        amountCents: Math.round(euros * 100),
        paymentMethod: method || null,
        notes: notes || null,
      })
      toast.success('Recibo actualizado')
      onSaved()
      onClose()
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {receipt.yearMonth} · actual {formatEuroFromCents(receipt.amountCents)}
        </p>
        <p className="mt-2 text-xs text-amber-900/90">
          Controlo interno do gabinete — não é recibo oficial AT.
        </p>

        <label className="mt-4 block text-sm font-medium">Estado</label>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as RentReceiptStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-sm font-medium">Valor (€)</label>
        <Input value={amountEuro} onChange={(e) => setAmountEuro(e.target.value)} inputMode="decimal" />

        <label className="mt-3 block text-sm font-medium">Método</label>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="">—</option>
          {paymentMethods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <label className="mt-3 block text-sm font-medium">Notas</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
