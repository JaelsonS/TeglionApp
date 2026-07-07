import { useCallback, useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Loader2, Send, Users } from 'lucide-react'

import { AlertAttachmentsGrid } from '@/features/firm/alerts/AlertAttachments'
import type { BroadcastAttachment } from '@/features/firm/alerts/alertTypes'
import { ClientSearchSelect } from '@/features/firm/components/ClientSearchSelect'
import { FormField, UploadDropzone } from '@/shared/design-system'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { FirmBroadcast } from '@/infrastructure/api/contabil/broadcasts'
import { contabilNewsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { toast } from 'sonner'
import type { Client } from '@/shared/types/clients'
import { cn } from '@/shared/lib/utils'

export type AlertDraft = Partial<FirmBroadcast> & {
  body?: string
  attachments?: BroadcastAttachment[]
  coverUrl?: string | null
}

const PRIORITY_CHIPS = [
  { id: 'LOW', label: 'Baixa' },
  { id: 'MEDIUM', label: 'Informativo' },
  { id: 'HIGH', label: 'Importante' },
  { id: 'URGENT', label: 'Urgente' },
] as const

type Props = {
  draft: AlertDraft
  onChange: (d: AlertDraft) => void
  clients: Client[]
  categories: Array<{ id: string; label: string }>
  onSaveDraft: () => void
  onPublish: () => void
  saving: boolean
}

export function AlertComposer({ draft, onChange, clients, categories, onSaveDraft, onPublish, saving }: Props) {
  const [uploading, setUploading] = useState(false)
  const [targetClientId, setTargetClientId] = useState('')
  const selectedIds = draft.targetClientIds || []

  useEffect(() => {
    if (draft.targetType !== 'SELECTED') return
    if (selectedIds.length === 1) setTargetClientId(selectedIds[0])
  }, [draft.targetType, selectedIds])

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const res = await contabilNewsApi.uploadCover(file)
      const att: BroadcastAttachment = {
        url: res.previewUrl,
        storageKey: res.storageKey,
        name: file.name,
        mimeType: file.type,
        type: file.type.startsWith('image/') ? 'image' : 'file',
      }
      const isFirstImage = file.type.startsWith('image/') && !draft.coverUrl
      if (isFirstImage) {
        onChange({ ...draft, coverUrl: res.previewUrl, attachments: draft.attachments || [] })
      } else {
        onChange({
          ...draft,
          attachments: [...(draft.attachments || []), att],
        })
      }
    } catch (err) {
      toast.error('Não foi possível anexar', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }, [draft, onChange])

  function addSelectedClient(id: string) {
    if (!id || selectedIds.includes(id)) return
    onChange({
      ...draft,
      targetType: 'SELECTED',
      targetClientIds: [...selectedIds, id],
    })
    setTargetClientId('')
  }

  function removeAttachment(index: number) {
    if (index === -1) {
      onChange({ ...draft, coverUrl: null })
      return
    }
    const next = [...(draft.attachments || [])]
    next.splice(index, 1)
    onChange({ ...draft, attachments: next })
  }

  return (
    <div className="flex min-h-0 flex-col py-4">
      <div className="space-y-5">
        <FormField label="Título do comunicado">
          <Input
            className="cb-field-control"
            placeholder="Ex.: Prazo IVA — envio de documentos"
            value={draft.title || ''}
            onChange={(e: FormChangeEvent) => onChange({ ...draft, title: e.target.value })}
          />
        </FormField>

        <FormField label="Resumo (lista)" hint="Uma linha — aparece na lista de alertas">
          <Input
            className="cb-field-control"
            value={draft.excerpt || ''}
            onChange={(e: FormChangeEvent) => onChange({ ...draft, excerpt: e.target.value })}
          />
        </FormField>

        <div>
          <p className="cb-field-label mb-2">Prioridade</p>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_CHIPS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ ...draft, priority: p.id })}
                className={cn('cb-chip', draft.priority === p.id && 'cb-chip-active')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <FormField label="Tipo">
          <select
            className="cb-field-control"
            value={draft.category || 'AVISO'}
            onChange={(e) => onChange({ ...draft, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Mensagem">
          <textarea
            className="cb-field-control min-h-[140px] resize-y"
            placeholder="Texto completo que o cliente vê no portal…"
            value={draft.body || ''}
            onChange={(e) => onChange({ ...draft, body: e.target.value })}
          />
        </FormField>

        <div>
          <p className="cb-field-label mb-2">Anexos</p>
          <UploadDropzone
            loading={uploading}
            onFiles={(files) => void Promise.all(files.map((f) => uploadFile(f)))}
          />
          <div className="mt-3">
            <AlertAttachmentsGrid
              attachments={draft.attachments || []}
              coverUrl={draft.coverUrl}
              editable
              onRemove={removeAttachment}
            />
          </div>
        </div>

        <div>
          <p className="cb-field-label mb-2">Destinatários</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              className={cn('cb-chip', draft.targetType === 'ALL_CLIENTS' && 'cb-chip-active')}
              onClick={() => onChange({ ...draft, targetType: 'ALL_CLIENTS', targetClientIds: [] })}
            >
              <Users className="h-3.5 w-3.5" />
              Toda a carteira
            </button>
            <button
              type="button"
              className={cn('cb-chip', draft.targetType === 'SELECTED' && 'cb-chip-active')}
              onClick={() => onChange({ ...draft, targetType: 'SELECTED' })}
            >
              Clientes escolhidos
            </button>
          </div>
          {draft.targetType === 'SELECTED' ? (
            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/15 p-3">
              <ClientSearchSelect
                clients={clients.filter((c) => !selectedIds.includes(c._id))}
                value={targetClientId}
                onChange={(id) => addSelectedClient(id)}
                placeholder="Adicionar cliente (nome, NIF, email)…"
              />
              {selectedIds.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {selectedIds.map((id) => {
                    const c = clients.find((x) => x._id === id)
                    return (
                      <li
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium shadow-sm"
                      >
                        {c?.fullName || c?.name || id.slice(0, 8)}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            onChange({
                              ...draft,
                              targetClientIds: selectedIds.filter((x) => x !== id),
                            })
                          }
                        >
                          ×
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum cliente seleccionado ainda.</p>
              )}
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(draft.pinned)}
            onChange={(e) => onChange({ ...draft, pinned: e.target.checked })}
          />
          Fixar no topo do portal
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(draft.readConfirmationRequired)}
            onChange={(e) => onChange({ ...draft, readConfirmationRequired: e.target.checked })}
          />
          Pedir confirmação de leitura
        </label>
      </div>

      <div className="flex gap-2 border-t border-border/40 pt-4">
        <Button variant="outline" className="flex-1 rounded-full" disabled={saving} onClick={onSaveDraft}>
          Guardar rascunho
        </Button>
        <Button className="flex-1 rounded-full" variant="brand" disabled={saving} onClick={onPublish}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Publicar
        </Button>
      </div>
    </div>
  )
}
