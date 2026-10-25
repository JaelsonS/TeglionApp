import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
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
import {
  formatEuroFromCents,
  isChargeOverdue,
  statusLabelPt,
  statusTone,
} from '@/features/firm/payments/paymentsFormat'
import { cn } from '@/shared/lib/utils'

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

  async function persist(next: {
    status: FeeChargeStatus
    paymentMethod: string | null
    amountCents: number
    notes: string | null
  }) {
    if (!charge) return
    setSaving(true)
    try {
      await contabilFeeChargesApi.patch(charge.id, next)
      toast.success(next.status === 'paid' ? 'Marcado como pago' : 'Pagamento actualizado')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function save() {
    await persist({
      status,
      paymentMethod: method || null,
      amountCents: Math.round(euros * 100),
      notes: notes.trim() || null,
    })
  }

  async function markPaid() {
    await persist({
      status: 'paid',
      paymentMethod: method || null,
      amountCents: Math.round(euros * 100),
      notes: notes.trim() || null,
    })
  }

  const overdue = charge ? isChargeOverdue(charge.status, charge.overdue) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento · {charge?.yearMonth}</DialogTitle>
          <DialogDescription>
            {clientName}
            {charge ? ` · valor actual ${formatEuroFromCents(charge.amountCents)}` : null}. Honorários
            do gabinete — não é fatura certificada da AT.
          </DialogDescription>
        </DialogHeader>

        {charge ? (
          <div
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
              statusTone(charge.status, charge.overdue),
            )}
          >
            <span className="font-medium">{statusLabelPt(charge.status, charge.overdue)}</span>
            {overdue ? (
              <span className="text-xs font-semibold">Prioridade · cobrar</span>
            ) : null}
          </div>
        ) : null}

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

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          {status !== 'paid' ? (
            <Button
              type="button"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => void markPaid()}
              disabled={saving || !charge}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
              )}
              Marcar como pago
            </Button>
          ) : null}
          <div className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
