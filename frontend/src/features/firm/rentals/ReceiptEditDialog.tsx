import { useEffect, useState } from 'react'
import { CheckCircle2, FileText, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { FormChangeEvent } from '@/shared/types/react-events'

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
import { contabilRentalsApi } from '@/infrastructure/api'
import type { RentReceipt, RentReceiptStatus } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import {
  formatEuroFromCents,
  isReceiptOverdue,
  receiptLabelPt,
  receiptTone,
} from '@/features/firm/rentals/rentalsFormat'
import { printInternalRentReceipt } from '@/features/firm/rentals/printInternalRentReceipt'
import { cn } from '@/shared/lib/utils'

const STATUSES: Array<{ id: RentReceiptStatus; label: string }> = [
  { id: 'draft', label: 'Rascunho' },
  { id: 'issued', label: 'Emitido (interno)' },
  { id: 'paid', label: 'Pago' },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: RentReceipt | null
  propertyLabel: string
  landlordName: string
  landlordTaxId?: string | null
  tenantName: string
  tenantNif?: string | null
  paymentMethods: Array<{ id: string; label: string }>
  onSaved: () => void
}

export function ReceiptEditDialog({
  open,
  onOpenChange,
  receipt,
  propertyLabel,
  landlordName,
  landlordTaxId,
  tenantName,
  tenantNif,
  paymentMethods,
  onSaved,
}: Props) {
  const { firm, firmLogoUrl } = useFirmBranding()
  const [status, setStatus] = useState<RentReceiptStatus>('draft')
  const [euros, setEuros] = useState(0)
  const [method, setMethod] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!receipt) return
    setStatus(receipt.status)
    setEuros((receipt.amountCents || 0) / 100)
    setMethod(receipt.paymentMethod || '')
    setDueDate(receipt.dueDate ? String(receipt.dueDate).slice(0, 10) : '')
    setNotes(receipt.notes || '')
    setConfirmDelete(false)
  }, [receipt])

  async function persist(next: Record<string, unknown>, msg: string) {
    if (!receipt) return
    setSaving(true)
    try {
      await contabilRentalsApi.patchReceipt(receipt.id, next)
      toast.success(msg)
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
        amountCents: Math.round(euros * 100),
        paymentMethod: method || null,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      },
      status === 'paid' ? 'Marcado como pago' : 'Recibo actualizado',
    )
  }

  async function markPaid() {
    await persist(
      {
        status: 'paid',
        amountCents: Math.round(euros * 100),
        paymentMethod: method || null,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      },
      'Marcado como pago',
    )
  }

  async function removeReceipt() {
    if (!receipt) return
    setSaving(true)
    try {
      await contabilRentalsApi.patchReceipt(receipt.id, { status: 'cancelled' })
      toast.success('Recibo apagado do mapa')
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
    if (!receipt) return
    const draft: RentReceipt = {
      ...receipt,
      status,
      amountCents: Math.round(euros * 100),
      paymentMethod: method || null,
      dueDate: dueDate || receipt.dueDate,
      notes: notes.trim() || null,
    }
    const ok = printInternalRentReceipt({
      receipt: draft,
      propertyLabel,
      landlordName,
      landlordTaxId,
      tenantName,
      tenantNif,
      firmName: firm?.name || 'Gabinete',
      firmLogoUrl,
      paymentMethods,
    })
    if (!ok) {
      toast.error('Não foi possível preparar o recibo interno')
      return
    }
    toast.message('Recibo interno pronto', {
      description: 'Use a caixa de impressão. Não é documento oficial AT.',
    })
  }

  const overdue = receipt ? isReceiptOverdue(receipt.status, receipt.overdue) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>Recibo · {receipt?.yearMonth}</DialogTitle>
          <DialogDescription>
            {propertyLabel} · {tenantName}
            {receipt ? ` · ${formatEuroFromCents(receipt.amountCents)}` : ''}. Controlo interno —
            não é recibo AT.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {receipt ? (
            <div
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
                receiptTone(receipt.status, receipt.overdue),
              )}
            >
              <span className="font-medium">{receiptLabelPt(receipt.status, receipt.overdue)}</span>
              {overdue ? <span className="text-xs font-semibold">Prioridade · cobrar</span> : null}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Estado</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e: FormChangeEvent) => setStatus(e.target.value as RentReceiptStatus)}
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
                onChange={(e: FormChangeEvent) => setMethod(e.target.value)}
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
              <Input type="date" value={dueDate} onChange={(e: FormChangeEvent) => setDueDate(e.target.value)} />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Notas</span>
            <textarea
              className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(e: FormChangeEvent) => setNotes(e.target.value)}
              maxLength={2000}
              placeholder="Opcional"
            />
          </label>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/15 px-5 py-3 sm:flex-col sm:space-x-0">
          {status !== 'paid' ? (
            <Button
              type="button"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => void markPaid()}
              disabled={saving || !receipt}
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
            disabled={!receipt || saving}
          >
            <FileText className="mr-2 h-4 w-4" aria-hidden />
            Gerar recibo interno
          </Button>

          {confirmDelete ? (
            <div className="flex w-full flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-950">Apagar este recibo do mapa?</p>
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
                  onClick={() => void removeReceipt()}
                  disabled={saving}
                >
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
              disabled={saving || !receipt}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Apagar do mapa
            </Button>
          )}

          <div className="flex w-full justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Fechar
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving || !receipt}>
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
