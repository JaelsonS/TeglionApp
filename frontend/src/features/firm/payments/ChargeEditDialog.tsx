import { useEffect, useState } from 'react'
import { CheckCircle2, FileText, Loader2, Trash2 } from 'lucide-react'
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
import { Input } from '@/shared/components/ui/input'
import { contabilFeeChargesApi } from '@/infrastructure/api'
import type { FeeCharge, FeeChargeStatus } from '@/infrastructure/api/contabil/feeCharges'
import { getErrorMessage } from '@/shared/utils/errors'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import {
  formatEuroFromCents,
  isChargeOverdue,
  statusLabelPt,
  statusTone,
} from '@/features/firm/payments/paymentsFormat'
import { printInternalFeeReceipt } from '@/features/firm/payments/printInternalFeeReceipt'
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
  clientTaxId?: string | null
  paymentMethods: Array<{ id: string; label: string }>
  onSaved: () => void
}

export function ChargeEditDialog({
  open,
  onOpenChange,
  charge,
  clientName,
  clientTaxId,
  paymentMethods,
  onSaved,
}: Props) {
  const { firm, firmLogoUrl } = useFirmBranding()
  const [status, setStatus] = useState<FeeChargeStatus>('draft')
  const [method, setMethod] = useState('')
  const [euros, setEuros] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!charge) return
    setStatus(charge.status)
    setMethod(charge.paymentMethod || '')
    setEuros((charge.amountCents || 0) / 100)
    setDueDate(charge.dueDate ? String(charge.dueDate).slice(0, 10) : '')
    setNotes(charge.notes || '')
    setConfirmDelete(false)
  }, [charge])

  async function persist(next: Record<string, unknown>, successMsg: string) {
    if (!charge) return
    setSaving(true)
    try {
      await contabilFeeChargesApi.patch(charge.id, next)
      toast.success(successMsg)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function save() {
    await persist(
      {
        status,
        paymentMethod: method || null,
        amountCents: Math.round(euros * 100),
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      },
      status === 'paid' ? 'Marcado como pago' : 'Pagamento actualizado',
    )
  }

  async function markPaid() {
    await persist(
      {
        status: 'paid',
        paymentMethod: method || null,
        amountCents: Math.round(euros * 100),
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      },
      'Marcado como pago',
    )
  }

  async function removeCharge() {
    if (!charge) return
    setSaving(true)
    try {
      await contabilFeeChargesApi.patch(charge.id, { status: 'cancelled' })
      toast.success('Pagamento apagado do mapa')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  function openReceipt() {
    if (!charge) return
    const draft: FeeCharge = {
      ...charge,
      status,
      paymentMethod: method || null,
      amountCents: Math.round(euros * 100),
      dueDate: dueDate || charge.dueDate,
      notes: notes.trim() || null,
    }
    const ok = printInternalFeeReceipt({
      charge: draft,
      clientName,
      clientTaxId,
      firmName: firm?.name || 'Gabinete',
      firmLogoUrl,
      paymentMethods,
    })
    if (!ok) {
      toast.error('Permita pop-ups para imprimir o recibo interno')
    }
  }

  const overdue = charge ? isChargeOverdue(charge.status, charge.overdue) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>Avença · {charge?.yearMonth}</DialogTitle>
          <DialogDescription>
            {clientName}
            {clientTaxId ? ` · NIF ${clientTaxId}` : ''}
            {charge ? ` · ${formatEuroFromCents(charge.amountCents)}` : ''}. Controlo interno do
            gabinete — não é fatura AT.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Estado</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as FeeChargeStatus)}
              >
                {STATUSES.filter((s) => s.id !== 'cancelled').map((s) => (
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
              <span className="font-medium">Vencimento</span>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>

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

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-relaxed text-slate-700">
            <p className="font-semibold text-slate-900">Recibo interno</p>
            <p className="mt-1">
              Pode gerar um comprovativo com logo, marca d&apos;água e dados completos. Serve só
              para o gabinete — <strong>não é fatura certificada da AT</strong>.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/15 px-5 py-3 sm:flex-col sm:space-x-0">
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

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={openReceipt}
            disabled={!charge || saving}
          >
            <FileText className="mr-2 h-4 w-4" aria-hidden />
            Gerar recibo interno
          </Button>

          {confirmDelete ? (
            <div className="flex w-full flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-950">
                Apagar este mês do mapa? (fica cancelado — pode voltar a criar com «+»)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                >
                  Não
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => void removeCharge()}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                  Sim, apagar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => setConfirmDelete(true)}
              disabled={saving || !charge}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Apagar do mapa
            </Button>
          )}

          <div className="flex w-full justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Fechar
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
