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
import type { ClientProperty } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'

const COST_CATEGORIES = [
  { id: 'arrendamento', label: 'Arrendamento / renda do escritório' },
  { id: 'luz', label: 'Electricidade' },
  { id: 'gas', label: 'Gás' },
  { id: 'agua', label: 'Água' },
  { id: 'software', label: 'Software / licenças' },
  { id: 'telecom', label: 'Telecomunicações' },
  { id: 'seguro', label: 'Seguros' },
  { id: 'outro', label: 'Outro' },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ClientProperty | null
  initialClient?: { id: string; displayName: string; taxId?: string | null } | null
  onSaved: () => void
}

export function PropertyDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const isEdit = Boolean(initial?.id)

  const [label, setLabel] = useState(initial?.label || '')
  const [costCategory, setCostCategory] = useState(initial?.costCategory || 'arrendamento')
  const [supplierName, setSupplierName] = useState(initial?.supplierName || '')
  const [addressLine, setAddressLine] = useState(initial?.addressLine || '')
  const [postalCode, setPostalCode] = useState(initial?.postalCode || '')
  const [locality, setLocality] = useState(initial?.locality || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setLabel(initial?.label || '')
    setCostCategory(initial?.costCategory || 'arrendamento')
    setSupplierName(initial?.supplierName || '')
    setAddressLine(initial?.addressLine || '')
    setPostalCode(initial?.postalCode || '')
    setLocality(initial?.locality || '')
    setNotes(initial?.notes || '')
    setConfirmDelete(false)
  }, [open, initial?.id])

  async function save() {
    if (!label.trim()) {
      toast.error('Identifique o contrato ou custo')
      return
    }
    setSaving(true)
    try {
      const payload = {
        label: label.trim(),
        costCategory,
        supplierName: supplierName.trim() || null,
        addressLine: addressLine.trim() || null,
        postalCode: postalCode.trim() || null,
        locality: locality.trim() || null,
        notes: notes.trim() || null,
        status: 'active',
        clientId: null,
      }
      if (isEdit && initial) {
        await contabilRentalsApi.patchProperty(initial.id, payload)
        toast.success('Contrato actualizado')
      } else {
        await contabilRentalsApi.createProperty(payload)
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

  async function archiveProperty() {
    if (!initial) return
    setSaving(true)
    try {
      await contabilRentalsApi.patchProperty(initial.id, { status: 'archived' })
      toast.success('Contrato removido da lista')
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
          <DialogTitle>{isEdit ? 'Editar contrato / custo' : 'Novo contrato / custo'}</DialogTitle>
          <DialogDescription>
            Renda do escritório, luz, gás, água, software e outros custos do gabinete. Depois defina o
            valor mensal e gere o mapa do ano.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Categoria</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={costCategory}
              onChange={(e: FormChangeEvent) => setCostCategory(e.target.value)}
            >
              {COST_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Identificação</span>
            <Input
              value={label}
              onChange={(e: FormChangeEvent) => setLabel(e.target.value)}
              placeholder="Ex.: Renda Rua X · Escritório"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Fornecedor</span>
            <Input
              value={supplierName}
              onChange={(e: FormChangeEvent) => setSupplierName(e.target.value)}
              placeholder="Ex.: EDP, Vodafone, senhorio…"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Morada / referência (opcional)</span>
            <Input value={addressLine} onChange={(e: FormChangeEvent) => setAddressLine(e.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Código postal</span>
              <Input value={postalCode} onChange={(e: FormChangeEvent) => setPostalCode(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Localidade</span>
              <Input value={locality} onChange={(e: FormChangeEvent) => setLocality(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Notas</span>
            <Input value={notes} onChange={(e: FormChangeEvent) => setNotes(e.target.value)} />
          </label>
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border/60 bg-muted/20 px-5 py-3 sm:flex-row sm:justify-between">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <span className="text-xs text-rose-700">Remover da lista activa?</span>
                <Button type="button" variant="destructive" size="sm" disabled={saving} onClick={() => void archiveProperty()}>
                  Confirmar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rose-700"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                Apagar
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Fechar
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
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
