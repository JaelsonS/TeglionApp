import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
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
import { Input } from '@/shared/components/ui/input'
import { contabilRentalsApi } from '@/infrastructure/api'
import type { PropertyLease } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  propertyLabel: string
  /** office = custos gabinete; client = contrato inquilino do cliente */
  variant?: 'office' | 'client'
  initial?: PropertyLease | null
  onSaved: () => void
}

export function LeaseDialog({
  open,
  onOpenChange,
  propertyId,
  propertyLabel,
  variant = 'office',
  initial,
  onSaved,
}: Props) {
  const isClient = variant === 'client'
  const isEdit = Boolean(initial?.id)
  const [tenantDisplayName, setTenantDisplayName] = useState('')
  const [tenantNif, setTenantNif] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [rentEuro, setRentEuro] = useState('800')
  const [rentDueDay, setRentDueDay] = useState('1')
  const [leaseType, setLeaseType] = useState('habitacao')
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setTenantDisplayName(initial?.tenantDisplayName || '')
    setTenantNif(initial?.tenantNif || '')
    setTenantEmail(initial?.tenantEmail || '')
    setTenantPhone(initial?.tenantPhone || '')
    setStartDate(initial?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setEndDate(initial?.endDate?.slice(0, 10) || '')
    setRentEuro(initial ? String((initial.monthlyRentCents / 100).toFixed(2)) : isClient ? '800' : '100')
    setRentDueDay(String(initial?.rentDueDay ?? 1))
    setLeaseType(initial?.leaseType || (isClient ? 'habitacao' : 'outro'))
    setStatus(initial?.status || 'active')
    setNotes(initial?.notes || '')
    setConfirmDelete(false)
  }, [open, initial?.id, isClient])

  async function save() {
    const euros = Number(String(rentEuro).replace(',', '.'))
    const due = Math.round(Number(rentDueDay))
    if (!tenantDisplayName.trim() || !Number.isFinite(euros) || euros < 0) {
      toast.error(isClient ? 'Preencha o inquilino e a renda mensal' : 'Preencha a descrição e o valor mensal')
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
      onOpenChange(false)
    } catch (err) {
      toast.error(isEdit ? 'Não foi possível guardar' : 'Não foi possível criar', {
        description: getErrorMessage(err),
      })
    } finally {
      setSaving(false)
    }
  }

  async function cancelLease() {
    if (!initial) return
    setSaving(true)
    try {
      await contabilRentalsApi.patchLease(initial.id, { status: 'cancelled' })
      toast.success('Contrato apagado')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>
            {isClient
              ? isEdit
                ? 'Editar contrato de arrendamento'
                : 'Novo contrato de arrendamento'
              : isEdit
                ? 'Editar plano mensal'
                : 'Plano de pagamento mensal'}
          </DialogTitle>
          <DialogDescription>
            {isClient
              ? `${propertyLabel} — inquilino e renda mensal (registo interno do cliente).`
              : `${propertyLabel} — valor e vencimento deste custo do gabinete (controlo interno).`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{isClient ? 'Inquilino' : 'Descrição / fornecedor'}</span>
            <Input
              value={tenantDisplayName}
              onChange={(e: FormChangeEvent) => setTenantDisplayName(e.target.value)}
              placeholder={isClient ? 'Nome do inquilino' : 'Ex.: EDP, arrendamento, Conta X…'}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">NIF (opcional)</span>
              <Input value={tenantNif} onChange={(e: FormChangeEvent) => setTenantNif(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Telefone</span>
              <Input value={tenantPhone} onChange={(e: FormChangeEvent) => setTenantPhone(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Email</span>
            <Input type="email" value={tenantEmail} onChange={(e: FormChangeEvent) => setTenantEmail(e.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Início</span>
              <Input type="date" value={startDate} onChange={(e: FormChangeEvent) => setStartDate(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Fim</span>
              <Input type="date" value={endDate} onChange={(e: FormChangeEvent) => setEndDate(e.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">{isClient ? 'Renda mensal (€)' : 'Valor mensal (€)'}</span>
              <Input value={rentEuro} onChange={(e: FormChangeEvent) => setRentEuro(e.target.value)} inputMode="decimal" />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Dia vencimento</span>
              <Input value={rentDueDay} onChange={(e: FormChangeEvent) => setRentDueDay(e.target.value)} inputMode="numeric" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Tipo</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={leaseType}
                onChange={(e: FormChangeEvent) => setLeaseType(e.target.value)}
              >
                {isClient ? (
                  <>
                    <option value="habitacao">Habitação</option>
                    <option value="comercio">Comércio</option>
                    <option value="outro">Outro</option>
                  </>
                ) : (
                  <>
                    <option value="outro">Custo / contrato gabinete</option>
                    <option value="comercio">Comércio / escritório</option>
                    <option value="habitacao">Habitação (legado)</option>
                  </>
                )}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Estado</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(e: FormChangeEvent) => setStatus(e.target.value)}
              >
                <option value="active">Activo</option>
                <option value="ended">Terminado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Notas</span>
            <Input value={notes} onChange={(e: FormChangeEvent) => setNotes(e.target.value)} />
          </label>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/15 px-5 py-3 sm:flex-col sm:space-x-0">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex w-full flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-950">Apagar / cancelar este contrato?</p>
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
                    onClick={() => void cancelLease()}
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
                disabled={saving}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                Apagar contrato
              </Button>
            )
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
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A guardar…
                </>
              ) : isEdit ? (
                'Guardar'
              ) : (
                'Criar'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
