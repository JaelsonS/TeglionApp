import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import {
  PRIORITY_LABELS,
  TYPE_LABELS,
  dueDateToDateInput,
  formatEurInputFromCents,
  maskEurInput,
  monthInputToPeriod,
  parseEurToCents,
  periodToMonthInput,
  type ObligationRow,
} from '@/features/firm/obligations/obligationOperational'
import { contabilObligationsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import type { ObligationPriority, ObligationStatus } from '@/shared/types/contabil'
import { getErrorMessage } from '@/shared/utils/errors'
import { toast } from 'sonner'

const STATUS_OPTIONS: { value: ObligationStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em curso' },
  { value: 'WAITING_CLIENT', label: 'Aguarda cliente' },
  { value: 'OVERDUE', label: 'Em atraso' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

export type ObligationEditValues = {
  title: string
  periodMonth: string
  dueDate: string
  priority: ObligationPriority
  status: ObligationStatus
  accountantNotes: string
  assignedStaffId: string
  amountEur: string
}

function fromObligation(ob: ObligationRow): ObligationEditValues {
  return {
    title: ob.title || '',
    periodMonth: periodToMonthInput(String(ob.period || '')),
    dueDate: dueDateToDateInput(String(ob.dueDate || '')),
    priority: (ob.priority || 'NORMAL') as ObligationPriority,
    status: (ob.status || 'PENDING') as ObligationStatus,
    accountantNotes: ob.accountantNotes || '',
    assignedStaffId: ob.assignedStaffId || '',
    amountEur:
      ob.amountCents != null && Number.isFinite(Number(ob.amountCents))
        ? formatEurInputFromCents(Number(ob.amountCents))
        : '',
  }
}

export function ObligationEditDialog({
  open,
  onOpenChange,
  obligation,
  staff,
  clientName,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  obligation: ObligationRow | null
  staff: { id: string; fullName?: string; email?: string }[]
  clientName?: string
  onSaved: () => void
}) {
  const [values, setValues] = useState<ObligationEditValues | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !obligation) {
      setValues(null)
      setError('')
      return
    }
    setValues(fromObligation(obligation))
    setError('')
  }, [open, obligation])

  if (!obligation || !values) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values || !obligation) return
    if (!values.title.trim()) {
      setError('Indique um título ou descrição curta.')
      return
    }
    const period = monthInputToPeriod(values.periodMonth)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      setError('Período inválido.')
      return
    }
    if (values.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
      setError('Prazo inválido.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const amountCents = parseEurToCents(values.amountEur)
      await contabilObligationsApi.update(obligation._id, {
        title: values.title.trim(),
        period,
        dueDate: values.dueDate || undefined,
        priority: values.priority,
        status: values.status,
        accountantNotes: values.accountantNotes.trim() || null,
        assignedStaffId: values.assignedStaffId || null,
        amountCents: amountCents ?? null,
      })
      toast.success('Obrigação actualizada')
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>Editar obrigação</DialogTitle>
          <p className="text-xs font-normal text-muted-foreground">
            Alinhado com a criação — período, prazo, valor, prioridade, responsável e notas.
          </p>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Cliente</Label>
                <p className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                  {clientName || obligation.clientName || '—'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo fiscal</Label>
                <p className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                  {TYPE_LABELS[obligation.type] || obligation.type}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-edit-amount">Valor (EUR)</Label>
                <Input
                  id="ob-edit-amount"
                  value={values.amountEur}
                  onChange={(e: FormChangeEvent) =>
                    setValues({ ...values, amountEur: maskEurInput(e.target.value) })
                  }
                  placeholder="1.250,00"
                  inputMode="decimal"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-edit-title">Título</Label>
              <Input
                id="ob-edit-title"
                value={values.title}
                onChange={(e: FormChangeEvent) => setValues({ ...values, title: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ob-edit-period">Período</Label>
                <Input
                  id="ob-edit-period"
                  type="month"
                  value={values.periodMonth}
                  onChange={(e: FormChangeEvent) => setValues({ ...values, periodMonth: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-edit-due">Prazo</Label>
                <Input
                  id="ob-edit-due"
                  type="date"
                  value={values.dueDate}
                  onChange={(e: FormChangeEvent) => setValues({ ...values, dueDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-edit-priority">Prioridade</Label>
                <select
                  id="ob-edit-priority"
                  className="h-10 w-full rounded-xl border border-input px-3 text-sm"
                  value={values.priority}
                  onChange={(e) => setValues({ ...values, priority: e.target.value as ObligationPriority })}
                >
                  {(Object.keys(PRIORITY_LABELS) as ObligationPriority[]).map((k) => (
                    <option key={k} value={k}>
                      {PRIORITY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-edit-status">Estado</Label>
                <select
                  id="ob-edit-status"
                  className="h-10 w-full rounded-xl border border-input px-3 text-sm"
                  value={values.status}
                  onChange={(e) => setValues({ ...values, status: e.target.value as ObligationStatus })}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ob-edit-staff">Responsável</Label>
                <select
                  id="ob-edit-staff"
                  className="h-10 w-full rounded-xl border border-input px-3 text-sm"
                  value={values.assignedStaffId}
                  onChange={(e) => setValues({ ...values, assignedStaffId: e.target.value })}
                >
                  <option value="">Sem responsável</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName || s.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-edit-notes">Notas internas</Label>
              <Textarea
                id="ob-edit-notes"
                rows={3}
                value={values.accountantNotes}
                onChange={(e: FormChangeEvent) => setValues({ ...values, accountantNotes: e.target.value })}
                className="rounded-xl"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
