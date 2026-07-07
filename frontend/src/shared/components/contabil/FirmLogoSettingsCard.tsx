import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { contabilFirmApi } from '@/infrastructure/api'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { getErrorMessage } from '@/shared/utils/errors'

const MAX_LOGO_MB = 3

export function FirmLogoSettingsCard({ readOnly = false }: { readOnly?: boolean }) {
  const { firm, firmLogoUrl, refresh } = useFirmBranding()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const displayUrl = previewUrl || firmLogoUrl
  const hasLogo = Boolean(displayUrl)

  const onPick = () => {
    if (readOnly) return
    inputRef.current?.click()
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      toast.error(`Imagem até ${MAX_LOGO_MB} MB`)
      return
    }
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setUploading(true)
    try {
      const res = (await contabilFirmApi.uploadFirmLogo(file)) as { logoUrl?: string }
      const next = res.logoUrl || localPreview
      setPreviewUrl(next)
      await refresh({ force: true })
      emitAppDataChanged({ scope: 'branding' })
      toast.success('Logótipo actualizado — já visível no portal e na barra lateral.')
    } catch (err) {
      setPreviewUrl(null)
      toast.error('Não foi possível guardar o logótipo', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
      if (localPreview.startsWith('blob:')) URL.revokeObjectURL(localPreview)
    }
  }

  const onRemove = async () => {
    if (readOnly || !hasLogo) return
    setRemoving(true)
    try {
      await contabilFirmApi.removeFirmLogo()
      setPreviewUrl(null)
      if (inputRef.current) inputRef.current.value = ''
      await refresh({ force: true })
      emitAppDataChanged({ scope: 'branding' })
      toast.success('Logótipo removido.')
    } catch (err) {
      toast.error('Não foi possível remover o logótipo', { description: getErrorMessage(err) })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className="cb-settings-logo-card rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Logótipo do escritório</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {readOnly
          ? 'Apenas o dono do escritório pode alterar o logótipo.'
          : 'Aparece de imediato no menu, login do cliente e portal. Recomendado: imagem quadrada (PNG ou WebP).'}
      </p>

      <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30">
          {displayUrl ? (
            <img src={displayUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={uploading || removing || readOnly}
              onClick={onPick}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A enviar…
                </>
              ) : (
                'Escolher imagem'
              )}
            </Button>
            {hasLogo && !readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={uploading || removing}
                onClick={() => void onRemove()}
              >
                {removing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A remover…
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover logótipo
                  </>
                )}
              </Button>
            ) : null}
          </div>
          {firm?.name ? (
            <p className="text-xs text-muted-foreground">
              Escritório: <strong>{firm.name}</strong>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
