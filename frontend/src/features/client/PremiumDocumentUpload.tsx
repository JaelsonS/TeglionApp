import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Archive, FileText, ImageIcon, Tag, Upload, X } from 'lucide-react'

import { Progress } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'

const CATEGORIES = [
  'Faturas de compra',
  'Faturas de venda',
  'Extratos bancários',
  'Recibos de vencimento',
  'Contratos',
  'Declarações',
  'Comprovativo de pagamento',
  'Outro',
]

export type UploadMeta = {
  title: string
  description: string
  observations: string
  category: string
  tags: string
}

type FilePreview = {
  file: File
  url: string
  id: string
}

type Props = {
  uploading: boolean
  uploadProgress?: number
  onUpload: (files: File[], meta: UploadMeta) => void
}

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < 800_000) return file
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 1920
      let { width, height } = img
      if (width > max || height > max) {
        const ratio = Math.min(max / width, max / height)
        width *= ratio
        height *= ratio
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}

export function PremiumDocumentUpload({ uploading, uploadProgress = 0, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [meta, setMeta] = useState<UploadMeta>({
    title: '',
    description: '',
    observations: '',
    category: '',
    tags: '',
  })

  const addFiles = useCallback(async (list: FileList | File[]) => {
    const arr = Array.from(list).slice(0, 10)
    const next: FilePreview[] = []
    for (const file of arr) {
      const processed = await compressImageIfNeeded(file)
      next.push({
        file: processed,
        url: URL.createObjectURL(processed),
        id: `${Date.now()}-${Math.random()}`,
      })
    }
    setPreviews((p) => [...p, ...next].slice(0, 10))
    if (!meta.title && next[0]) {
      setMeta((m) => ({ ...m, title: next[0].file.name.replace(/\.[^.]+$/, '') }))
    }
  }, [meta.title])

  const removePreview = (id: string) => {
    setPreviews((p) => {
      const item = p.find((x) => x.id === id)
      if (item?.url) URL.revokeObjectURL(item.url)
      return p.filter((x) => x.id !== id)
    })
  }

  const handleSubmit = () => {
    if (!previews.length || uploading) return
    onUpload(
      previews.map((p) => p.file),
      meta,
    )
  }

  const clearAll = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url))
    setPreviews([])
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-5">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cb-upload-zone group relative p-10 transition-all duration-200',
          dragOver && 'cb-upload-zone-active scale-[1.01]',
          uploading && 'pointer-events-none opacity-60',
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-transform group-hover:scale-105">
          <Upload className="h-7 w-7" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Arraste ficheiros ou clique para selecionar</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, imagens (JPG, PNG) ou ZIP · até 10 ficheiros · máx. 10 MB cada</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.zip,application/zip"
          capture="environment"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files)
          }}
        />
      </div>

      {uploading ? (
        <Progress value={uploadProgress || 30} label="A enviar documentos…" />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="cb-field-label">Descrição do documento</span>
          <input
            type="text"
            value={meta.title}
            onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
            placeholder="Ex.: Faturas de março 2026"
            className="cb-field-control"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">Categoria</span>
          <select
            value={meta.category}
            onChange={(e) => setMeta((m) => ({ ...m, category: e.target.value }))}
            className="cb-field-control"
          >
            <option value="">Selecionar categoria</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1 text-xs font-medium text-slate-600">
            <Tag className="h-3 w-3" /> Etiquetas
          </span>
          <input
            type="text"
            value={meta.tags}
            onChange={(e) => setMeta((m) => ({ ...m, tags: e.target.value }))}
            placeholder="IVA, março, compras (separadas por vírgula)"
            className="cb-field-control"
          />
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Observações</span>
          <textarea
            value={meta.observations}
            onChange={(e) => setMeta((m) => ({ ...m, observations: e.target.value }))}
            rows={2}
            placeholder="Informação adicional para o seu contabilista…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      <AnimatePresence>
        {previews.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pré-visualização ({previews.length})</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {previews.map((p) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {p.file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : p.file.type.includes('zip') ? (
                        <Archive className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <p className="truncate text-xs font-medium text-slate-700">{p.file.name}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                      onClick={() => removePreview(p.id)}
                      aria-label="Remover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {p.file.type.startsWith('image/') ? (
                    <img src={p.url} alt="" className="max-h-36 w-full object-contain bg-slate-50" />
                  ) : p.file.type === 'application/pdf' ? (
                    <iframe title="PDF" src={p.url} className="h-36 w-full bg-slate-50" />
                  ) : (
                    <p className="px-3 py-6 text-center text-xs text-slate-500">Ficheiro pronto a enviar</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={handleSubmit}
                className="cb-btn-primary disabled:opacity-50"
              >
                {uploading ? 'A enviar…' : `Enviar ${previews.length} documento${previews.length > 1 ? 's' : ''}`}
              </button>
              <button
                type="button"
                className="cb-btn-secondary"
                onClick={clearAll}
              >
                Limpar
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
