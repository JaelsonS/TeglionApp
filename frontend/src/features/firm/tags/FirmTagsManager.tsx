import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { contabilInquiryTagsApi } from '@/infrastructure/api'
import type { FirmInquiryTag } from '@/infrastructure/api/contabil/inquiryTags'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { FirmTagBadge } from './FirmTagBadge'
import { SUGGESTED_TAG_COLORS } from './firmTagUtils'

type Props = {
  /** When true, hide the intro card (e.g. nested in a sheet that already has a title). */
  compact?: boolean
  onTagsChanged?: () => void
}

export function FirmTagsManager({ compact = false, onTagsChanged }: Props) {
  const qc = useQueryClient()
  const tagsQuery = useQuery({
    queryKey: ['firm-inquiry-tags'],
    queryFn: () => contabilInquiryTagsApi.list().then((r) => r.items),
  })
  const firmTags = Array.isArray(tagsQuery.data) ? tagsQuery.data : []

  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(SUGGESTED_TAG_COLORS[0])
  const [savingTag, setSavingTag] = useState(false)

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['firm-inquiry-tags'] })
    onTagsChanged?.()
  }

  const createTag = async () => {
    if (!newTagName.trim()) return
    setSavingTag(true)
    try {
      await contabilInquiryTagsApi.create({ name: newTagName.trim(), colorHex: newTagColor })
      setNewTagName('')
      toast.success('Etiqueta criada')
      await invalidate()
    } catch (err) {
      toast.error('Não foi possível criar etiqueta', { description: getErrorMessage(err) })
    } finally {
      setSavingTag(false)
    }
  }

  const removeTag = async (tag: FirmInquiryTag) => {
    if (
      !window.confirm(
        `Apagar a etiqueta “${tag.name}”? Será removida de clientes, leads, solicitações e equipa.`,
      )
    ) {
      return
    }
    try {
      await contabilInquiryTagsApi.remove(tag.id)
      toast.success('Etiqueta apagada')
      await invalidate()
    } catch (err) {
      toast.error('Erro ao apagar etiqueta', { description: getErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-5">
      {!compact ? (
        <div className="space-y-2 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-3 text-sm text-sky-950">
          <p className="font-medium text-brand">Etiquetas do escritório</p>
          <p>
            Uma lista única para marcar <strong>clientes</strong>, <strong>leads</strong>,{' '}
            <strong>solicitações</strong> e <strong>equipa</strong> (ex.: «Urgente», «VIP», «IRS 2025»).
            Não são vistas pelo cliente.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor ${c}`}
            onClick={() => setNewTagColor(c)}
            className={cn(
              'h-7 w-7 rounded-full border-2',
              newTagColor === c ? 'border-foreground' : 'border-transparent',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          className="h-10 rounded-xl"
          placeholder="Ex.: Urgente, VIP, IRS 2025…"
          value={newTagName}
          onChange={(e: FormChangeEvent) => setNewTagName(e.target.value)}
        />
        <Button
          type="button"
          className="shrink-0 rounded-full"
          disabled={savingTag || !newTagName.trim()}
          onClick={() => void createTag()}
        >
          {savingTag ? '…' : 'Criar'}
        </Button>
      </div>

      <ul className="space-y-2">
        {firmTags.map((tag) => (
          <li
            key={tag.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2"
          >
            <FirmTagBadge tag={tag} />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => void removeTag(tag)}
            >
              Apagar
            </Button>
          </li>
        ))}
        {!firmTags.length ? (
          <p className="text-sm text-muted-foreground">Ainda sem etiquetas — crie a primeira acima.</p>
        ) : null}
      </ul>
    </div>
  )
}
