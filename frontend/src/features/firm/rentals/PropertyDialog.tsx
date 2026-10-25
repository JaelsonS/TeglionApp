import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
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
import { Input } from '@/shared/components/ui/input'
import { contabilClientsApi, contabilRentalsApi } from '@/infrastructure/api'
import type { ClientProperty } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ClientProperty | null
  initialClient?: { id: string; displayName: string; taxId?: string | null } | null
  onSaved: () => void
}

export function PropertyDialog({
  open,
  onOpenChange,
  initial,
  initialClient,
  onSaved,
}: Props) {
  const isEdit = Boolean(initial?.id)
  const clientsQuery = useQuery({
    queryKey: ['clients-for-rentals'],
    queryFn: () => contabilClientsApi.list({ limit: 200 }),
    enabled: open && !isEdit,
  })
  const clients = useMemo(() => clientsQuery.data?.items || [], [clientsQuery.data])

  const [clientId, setClientId] = useState(initial?.clientId || initialClient?.id || '')
  const [label, setLabel] = useState(initial?.label || '')
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
    setAddressLine(initial?.addressLine || '')
    setPostalCode(initial?.postalCode || '')
    setLocality(initial?.locality || '')
    setArtigoMatricial(initial?.artigoMatricial || '')
    setNotes(initial?.notes || '')
    setConfirmDelete(false)
  }, [open, initial?.id, initialClient?.id])

  const selectedClient = useMemo(() => {
    if (isEdit && initialClient) return initialClient
    const c = clients.find((x) => x._id === clientId)
    if (!c) return null
    return {
      id: c._id,
      displayName: c.fullName || c.name || c._id,
      taxId: c.taxId || null,
    }
  }, [clients, clientId, isEdit, initialClient])

  async function save() {
    if (!isEdit && !clientId) {
      toast.error('Escolha o cliente senhorio')
      return
    }
    if (!label.trim()) {
      toast.error('Identifique o imóvel')
      return
    }
    setSaving(true)
    try {
      const payload = {
        label: label.trim(),
        addressLine: addressLine.trim() || null,
        postalCode: postalCode.trim() || null,
        locality: locality.trim() || null,
        artigoMatricial: artigoMatricial.trim() || null,
        notes: notes.trim() || null,
        status: 'active',
      }
      if (isEdit && initial) {
        await contabilRentalsApi.patchProperty(initial.id, payload)
        toast.success('Imóvel actualizado')
      } else {
        await contabilRentalsApi.createProperty({ ...payload, clientId })
        toast.success('Imóvel criado')
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
      toast.success('Imóvel apagado da lista')
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
          <DialogTitle>{isEdit ? 'Editar imóvel' : 'Novo imóvel'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualize os dados. Apagar arquiva o imóvel (sai da lista activa).'
              : 'Associe o imóvel ao cliente senhorio da carteira.'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {!isEdit ? (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Cliente (senhorio)</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">—</option>
                {clients.map((c) => {
                  const name = c.fullName || c.name || c._id
                  const nif = c.taxId ? ` · NIF ${c.taxId}` : ''
                  return (
                    <option key={c._id} value={c._id}>
                      {name}
                      {nif}
                    </option>
                  )
                })}
              </select>
            </label>
          ) : null}

          {selectedClient ? (
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
              <p className="font-medium">{selectedClient.displayName}</p>
              <p className="text-xs text-muted-foreground">NIF {selectedClient.taxId || '—'}</p>
            </div>
          ) : null}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Identificação</span>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="T2 — Rua X" />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Morada</span>
            <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Código postal</span>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Localidade</span>
              <Input value={locality} onChange={(e) => setLocality(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Artigo matricial</span>
            <Input value={artigoMatricial} onChange={(e) => setArtigoMatricial(e.target.value)} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Notas</span>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/15 px-5 py-3 sm:flex-col sm:space-x-0">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex w-full flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm text-rose-950">Apagar este imóvel da lista activa?</p>
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
                    onClick={() => void archiveProperty()}
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
                Apagar imóvel
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
