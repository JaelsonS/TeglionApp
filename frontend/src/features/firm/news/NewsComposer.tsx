import { useCallback, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

import { FormField, UploadDropzone } from '@/shared/design-system'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { contabilNewsApi } from '@/infrastructure/api'
import type { NewsArticle } from '@/shared/types/contabil'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

export type NewsDraft = Partial<NewsArticle> & {
  coverStorageKey?: string | null
}

type Props = {
  draft: NewsDraft
  onChange: (d: NewsDraft) => void
  onSaveDraft: () => void
  onPublish: () => void
  saving: boolean
}

export function NewsComposer({ draft, onChange, onSaveDraft, onPublish, saving }: Props) {
  const [uploading, setUploading] = useState(false)

  const uploadCover = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const res = await contabilNewsApi.uploadCover(file)
        onChange({
          ...draft,
          coverStorageKey: res.storageKey,
          coverUrl: res.previewUrl,
        })
      } catch (err) {
        toast.error('Não foi possível carregar a capa', { description: getErrorMessage(err) })
      } finally {
        setUploading(false)
      }
    },
    [draft, onChange],
  )

  return (
    <div className="flex min-h-0 flex-col space-y-5 py-4">
      <FormField label="Título">
        <Input
          value={draft.title || ''}
          onChange={(e: FormChangeEvent) => onChange({ ...draft, title: e.target.value })}
          placeholder="Ex.: Novidades fiscais de Julho"
          className="rounded-xl"
          required
        />
      </FormField>

      <FormField label="Resumo">
        <Input
          value={draft.excerpt || ''}
          onChange={(e: FormChangeEvent) => onChange({ ...draft, excerpt: e.target.value })}
          placeholder="Uma linha para a lista do portal"
          className="rounded-xl"
        />
      </FormField>

      <FormField label="Conteúdo">
        <textarea
          value={draft.body || ''}
          onChange={(e: FormChangeEvent) => onChange({ ...draft, body: e.target.value })}
          rows={12}
          className="cb-field-control min-h-[200px] w-full rounded-xl px-3 py-2 text-sm"
          placeholder="Texto completo da notícia…"
          required
        />
      </FormField>

      <FormField label="Categoria">
        <Input
          value={draft.category || ''}
          onChange={(e: FormChangeEvent) => onChange({ ...draft, category: e.target.value })}
          placeholder="Ex.: Fiscalidade"
          className="rounded-xl"
        />
      </FormField>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Capa (opcional)</p>
        {draft.coverUrl ? (
          <div className="relative mb-3 overflow-hidden rounded-xl border border-border">
            <img src={draft.coverUrl} alt="" className="max-h-40 w-full object-cover" />
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-1 text-xs font-medium"
              onClick={() => onChange({ ...draft, coverUrl: null, coverStorageKey: null })}
            >
              Remover
            </button>
          </div>
        ) : null}
        <UploadDropzone
          loading={uploading}
          multiple={false}
          onFiles={(files) => {
            const file = files[0]
            if (file) void uploadCover(file)
          }}
          accept="image/*"
          label={uploading ? 'A carregar…' : 'Arrastar imagem ou clicar'}
          hint="JPG, PNG ou WebP"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="rounded border-border"
          checked={Boolean(draft.isFeatured)}
          onChange={(e) => onChange({ ...draft, isFeatured: e.target.checked })}
        />
        Destacar no início do portal do cliente
      </label>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" className="rounded-full" disabled={saving} onClick={onSaveDraft}>
          Guardar rascunho
        </Button>
        <Button type="button" className="rounded-full" disabled={saving} onClick={onPublish}>
          {saving ? <Loader2 className={cn('mr-1.5 h-4 w-4 animate-spin')} /> : <Send className="mr-1.5 h-4 w-4" />}
          Publicar
        </Button>
      </div>
    </div>
  )
}
