import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileArchive, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { FormChangeEvent } from '@/shared/types/react-events'
import type { ChangeEvent } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { contabilClientsApi, contabilSaftApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatBytes } from '@/features/firm/saft/saftFormat'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  disclaimer: string
  maxBytes?: number
  onImported: () => void
}

export function SaftUploadDialog({
  open,
  onOpenChange,
  disclaimer,
  maxBytes = 25 * 1024 * 1024,
  onImported,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [clientId, setClientId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const clientsQuery = useQuery({
    queryKey: ['clients-for-saft'],
    queryFn: () => contabilClientsApi.list({ limit: 200 }),
    enabled: open,
  })
  const clients = useMemo(() => clientsQuery.data?.items || [], [clientsQuery.data])

  useEffect(() => {
    if (!open) return
    setClientId('')
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [open])

  async function submit() {
    if (!file) {
      toast.error('Escolha um ficheiro .xml ou .zip')
      return
    }
    if (file.size > maxBytes) {
      toast.error(`Ficheiro demasiado grande (máx. ${formatBytes(maxBytes)})`)
      return
    }
    setUploading(true)
    try {
      const res = await contabilSaftApi.importFile(file, clientId || undefined)
      if (res.duplicate) {
        toast.message('Este ficheiro já tinha sido importado', {
          description: res.item.companyName || res.item.originalFilename,
        })
      } else {
        toast.success('SAF-T lido', {
          description: `${res.item.companyName || 'Empresa'} · ${res.item.fiscalYear || '—'}`,
        })
      }
      onImported()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível ler o SAF-T', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-2 border-b border-border/60 px-5 py-4 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <FileArchive className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <DialogTitle>Carregar SAF-T</DialogTitle>
              <DialogDescription className="mt-1">
                Exporte o SAF-T PT no software certificado do cliente e carregue .xml ou .zip.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            {disclaimer}
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Cliente da carteira (opcional)</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={clientId}
              onChange={(e: FormChangeEvent) => setClientId(e.target.value)}
              disabled={uploading}
            >
              <option value="">— Sem associação —</option>
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

          <div className="space-y-1.5 text-sm">
            <span className="font-medium">Ficheiro</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xml,.zip,application/xml,text/xml,application/zip"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand/40 bg-brand/5 px-4 py-6 text-center transition hover:bg-brand/10"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-5 w-5 text-brand" aria-hidden />
              {file ? (
                <>
                  <span className="font-medium text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-brand">Escolher .xml ou .zip</span>
                  <span className="text-xs text-muted-foreground">Máx. {formatBytes(maxBytes)}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/15 px-5 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={uploading || !file}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A ler…
              </>
            ) : (
              'Importar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
