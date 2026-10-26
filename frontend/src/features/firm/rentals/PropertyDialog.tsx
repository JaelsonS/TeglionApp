import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { contabilClientsApi, contabilRentalsApi } from '@/infrastructure/api'
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

export type PropertyDialogMode = 'office' | 'client'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: PropertyDialogMode
  initial?: ClientProperty | null
  initialClient?: { id: string; displayName: string; taxId?: string | null } | null
  onSaved: () => void
}

export function PropertyDialog({
  open,
  onOpenChange,
  mode = 'office',
  initial,
  initialClient,
  onSaved,
}: Props) {
  const isClient = mode === 'client'
  const isEdit = Boolean(initial?.id)

  const clientsQuery = useQuery({
    queryKey: ['clients-for-rentals'],
    queryFn: () => contabilClientsApi.list({ limit: 200 }),
    enabled: open && isClient && !isEdit,
  })
  const clients = useMemo(() => clientsQuery.data?.items || [], [clientsQuery.data])

  const [clientId, setClientId] = useState(initial?.clientId || initialClient?.id || '')
  const [label, setLabel] = useState(initial?.label || '')
  const [costCategory, setCostCategory] = useState(initial?.costCategory || 'arrendamento')
  const [supplierName, setSupplierName] = useState(initial?.supplierName || '')
  const [addressLine, setAddressLine] = useState(initial?.addressLine || '')
  const [postalCode, setPostalCode] = useState(initial?.postalCode || '')
  const [locality, setLocality] = useState(initial?.locality || '')
  const [artigoMatricial, setArtigoMatricial] = useState(initial?.artigoMatricial || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setClientId(initial?.clientId || initialClient?.id || '')
    setLabel(initial?.label || '')
    setCostCategory(initial?.costCategory || 'arrendamento')
    setSupplierName(initial?.supplierName || '')
    setAddressLine(initial?.addressLine || '')
    setPostalCode(initial?.postalCode || '')
    setLocality(initial?.locality || '')
    setArtigoMatricial(initial?.artigoMatricial || '')
    setNotes(initial?.notes || '')
    setConfirmDelete(false)
  }, [open, initial?.id, initialClient?.id])

  async function save() {
    if (isClient && !isEdit && !clientId) {
      toast.error('Escolha o cliente senhorio')
      return
    }
    if (!label.trim()) {
      toast.error(isClient ? 'Identifique o imóvel' : 'Identifique o contrato ou custo')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        label: label.trim(),
        addressLine: addressLine.trim() || null,
        postalCode: postalCode.trim() || null,
        locality: locality.trim() || null,
        notes: notes.trim() || null,
        status: 'active',
        scope: isClient ? 'client' : 'office',
      }
      if (isClient) {
        payload.artigoMatricial = artigoMatricial.trim() || null
        payload.costCategory = 'arrendamento'
        if (!isEdit) payload.clientId = clientId
      } else {
        payload.costCategory = costCategory
        payload.supplierName = supplierName.trim() || null
        payload.clientId = null
      }

      if (isEdit && initial) {
        await contabilRentalsApi.patchProperty(initial.id, payload)
        toast.success(isClient ? 'Imóvel actualizado' : 'Contrato actualizado')
      } else {
        await contabilRentalsApi.createProperty(payload)
        toast.success(isClient ? 'Imóvel criado' : 'Contrato criado')
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
      toast.success(isClient ? 'Imóvel apagado da lista' : 'Contrato apagado da lista')
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
                ? 'Editar imóvel do cliente'
                : 'Novo imóvel do cliente'
              : isEdit
                ? 'Editar custo / contrato'
                : 'Novo custo / contrato do gabinete'}
          </DialogTitle>
          <DialogDescription>
            {isClient
              ? 'Imóvel do cliente senhorio — registo interno do gabinete (não comunica à AT).'
              : 'Custo interno do escritório (renda, luz, software…). Separado dos arrendamentos dos clientes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {isClient && !isEdit ? (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Cliente senhorio</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={clientId}
                onChange={(e: FormChangeEvent) => setClientId(e.target.value)}
                disabled={clientsQuery.isLoading}
              >
                <option value="">Seleccione o cliente…</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.fullName || c.name || c._id}
                    {c.taxId ? ` · ${c.taxId}` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {isClient && isEdit && initialClient ? (
            <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
              Senhorio: <strong>{initialClient.displayName}</strong>
              {initialClient.taxId ? ` · NIF ${initialClient.taxId}` : ''}
            </p>
          ) : null}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{isClient ? 'Identificação do imóvel' : 'Identificação'}</span>
            <Input
              value={label}
              onChange={(e: FormChangeEvent) => setLabel(e.target.value)}
              placeholder={isClient ? 'Ex.: T2 Rua das Flores' : 'Ex.: Renda escritório, EDP, Conta X…'}
            />
          </label>

          {!isClient ? (
            <>
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
                <span className="font-medium">Fornecedor</span>
                <Input
                  value={supplierName}
                  onChange={(e: FormChangeEvent) => setSupplierName(e.target.value)}
                  placeholder="Ex.: EDP, Vodafone, senhorio…"
                />
              </label>
            </>
          ) : (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Artigo matricial (opcional)</span>
              <Input
                value={artigoMatricial}
                onChange={(e: FormChangeEvent) => setArtigoMatricial(e.target.value)}
              />
            </label>
          )}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Morada</span>
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

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/15 px-5 py-3 sm:flex-col sm:space-x-0">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex w-full flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-950">
                  {isClient ? 'Apagar este imóvel da lista activa?' : 'Apagar este contrato da lista activa?'}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" size="sm" disabled={saving} onClick={() => void archiveProperty()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-rose-700"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                Apagar da lista
              </Button>
            )
          ) : null}
          <div className="flex w-full gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button type="button" className="flex-1" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
