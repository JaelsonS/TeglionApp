import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { contabilClientsApi, contabilRentalsApi } from '@/infrastructure/api'
import type { ClientProperty } from '@/infrastructure/api/contabil/rentals'
import { getErrorMessage } from '@/shared/utils/errors'

type Props = {
  initial?: ClientProperty | null
  initialClient?: { id: string; displayName: string; taxId?: string | null } | null
  onClose: () => void
  onSaved: () => void
}

export function PropertyDialog({ initial, initialClient, onClose, onSaved }: Props) {
  const isEdit = Boolean(initial?.id)
  const clientsQuery = useQuery({
    queryKey: ['clients-for-rentals'],
    queryFn: () => contabilClientsApi.list({ limit: 200 }),
    enabled: !isEdit,
  })
  const clients = useMemo(() => clientsQuery.data?.items || [], [clientsQuery.data])

  const [clientId, setClientId] = useState(initial?.clientId || initialClient?.id || '')
  const [label, setLabel] = useState(initial?.label || '')
  const [addressLine, setAddressLine] = useState(initial?.addressLine || '')
  const [postalCode, setPostalCode] = useState(initial?.postalCode || '')
  const [locality, setLocality] = useState(initial?.locality || '')
  const [artigoMatricial, setArtigoMatricial] = useState(initial?.artigoMatricial || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [status, setStatus] = useState(initial?.status || 'active')
  const [saving, setSaving] = useState(false)

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
        status,
      }
      if (isEdit && initial) {
        await contabilRentalsApi.patchProperty(initial.id, payload)
        toast.success('Imóvel actualizado')
      } else {
        await contabilRentalsApi.createProperty({ ...payload, clientId })
        toast.success('Imóvel criado')
      }
      onSaved()
    } catch (err) {
      toast.error(isEdit ? 'Não foi possível guardar' : 'Não foi possível criar', {
        description: getErrorMessage(err),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold">{isEdit ? 'Editar imóvel' : 'Novo imóvel'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? 'Actualize os dados do imóvel. O senhorio não muda aqui — altere o cliente na ficha se necessário.'
            : 'Associe o imóvel ao cliente senhorio da carteira.'}
        </p>

        {!isEdit ? (
          <>
            <label className="mt-4 block text-sm font-medium">Cliente (senhorio)</label>
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              aria-label="Cliente senhorio"
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
          </>
        ) : null}

        {selectedClient ? (
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
            <p className="font-medium text-foreground">{selectedClient.displayName}</p>
            <p className="text-xs text-muted-foreground">
              NIF {selectedClient.taxId || '—'} · dados da ficha do cliente
            </p>
          </div>
        ) : null}

        <label className="mt-3 block text-sm font-medium">Identificação</label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="T2 — Rua X" />

        <label className="mt-3 block text-sm font-medium">Morada</label>
        <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Código postal</label>
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1000-001" />
          </div>
          <div>
            <label className="block text-sm font-medium">Localidade</label>
            <Input value={locality} onChange={(e) => setLocality(e.target.value)} />
          </div>
        </div>

        <label className="mt-3 block text-sm font-medium">Artigo matricial</label>
        <Input
          value={artigoMatricial}
          onChange={(e) => setArtigoMatricial(e.target.value)}
          placeholder="Opcional"
        />

        <label className="mt-3 block text-sm font-medium">Notas internas</label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />

        {isEdit ? (
          <>
            <label className="mt-3 block text-sm font-medium">Estado</label>
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Activo</option>
              <option value="archived">Arquivado</option>
            </select>
          </>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? 'A guardar…' : isEdit ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
