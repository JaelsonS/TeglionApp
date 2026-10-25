import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { EuroInput } from '@/shared/design-system'
import { contabilFeeChargesApi } from '@/infrastructure/api'
import type { FeeCharge, FeeChargeStatus } from '@/infrastructure/api/contabil/feeCharges'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatEuroFromCents } from '@/features/firm/payments/paymentsFormat'

const STATUSES: Array<{ id: FeeChargeStatus; label: string }> = [
  { id: 'draft', label: 'Rascunho' },
  { id: 'confirmed', label: 'Confirmada' },
  { id: 'sent', label: 'Enviada' },
  { id: 'paid', label: 'Paga' },
  { id: 'cancelled', label: 'Cancelada' },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  charge: FeeCharge | null
  clientName: string
  paymentMethods: Array<{ id: string; label: string }>
  onSaved: () => void
}

export function ChargeEditDialog({
  open,
  onOpenChange,
  charge,
  clientName,
  paymentMethods,
  onSaved,
}: Props) {
  const [status, setStatus] = useState<FeeChargeStatus>('draft')
  const [method, setMethod] = useState('')
  const [euros, setEuros] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!charge) return
    setStatus(charge.status)
    setMethod(charge.paymentMethod || '')
    setEuros((charge.amountCents || 0) / 100)
    setNotes(charge.notes || '')
  }, [charge])

  async function save() {
    if (!charge) return
    setSaving(true)
    try {
      await contabilFeeChargesApi.patch(charge.id, {
        status,
        paymentMethod: method || null,
        amountCents: Math.round(euros * 100),
        notes: notes.trim() || null,
      })
      toast.success('Pagamento actualizado')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento · {charge?.yearMonth}</DialogTitle>
          <DialogDescription>
            {clientName}
            {charge ? ` · valor actual ${formatEuroFromCents(charge.amountCents)}` : null}
            . Honorários do gabinete — não é fatura certificada da AT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Estado</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as FeeChargeStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Valor</span>
            <EuroInput value={euros} onChange={setEuros} />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Método</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Notas</span>
            <textarea
              className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              placeholder="Opcional"
            />
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving || !charge}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A guardar…
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
