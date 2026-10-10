import { useRef, useState } from 'react'
import { ImageIcon, Loader2, Pencil } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  ImagePositionFrame,
  ImagePositionZoomSlider,
  type ImagePosition,
} from '@/shared/components/media/ImagePositionEditor'
import { UploadDropzone } from '@/shared/design-system/UploadDropzone'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import type { AccountingService } from '@/shared/types/contabil'
import { getErrorMessage } from '@/shared/utils/errors'
import { servicePositionedImageStyle } from '@/shared/utils/servicePositionedImageStyle'

const DEFAULT_POSITION: ImagePosition = { focusX: 50, focusY: 50, zoom: 1 }

type ServiceImageSource = Pick<
  AccountingService,
  'id' | 'name' | 'imageUrl' | 'imageStorageKey' | 'imageOriginalUrl' | 'imageFocusX' | 'imageFocusY' | 'imageZoom'
>

async function invalidateServiceCatalogQueries(queryClient: ReturnType<typeof useQueryClient>, firmSlug?: string) {
  await queryClient.invalidateQueries({ queryKey: ['contabil-accounting-services'] })
  if (firmSlug) {
    await queryClient.invalidateQueries({ queryKey: ['public-firm-services-preview', firmSlug] })
  } else {
    await queryClient.invalidateQueries({ queryKey: ['public-firm-services-preview'] })
  }
}

/** Imagem do catálogo (cartão + página do serviço) — grava directo na API de serviços. */
export function ServiceCatalogImageField({
  service,
  firmSlug,
  layout = 'block',
}: {
  service: ServiceImageSource
  firmSlug?: string
  /** inline = fila compacta na página pública; block = bloco com dropzone */
  layout?: 'inline' | 'block'
}) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [savingFrame, setSavingFrame] = useState(false)
  const [repositioning, setRepositioning] = useState(false)
  const [draftPosition, setDraftPosition] = useState<ImagePosition>(DEFAULT_POSITION)

  const imageUrl = service.imageUrl || null
  const hasImage = Boolean(imageUrl)

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const res = await contabilAccountingServicesApi.uploadImage(file)
      await contabilAccountingServicesApi.patch(service.id, {
        imageStorageKey: res.storageKey,
        imageOriginalUrl: res.storageKey,
        imageFocusX: 50,
        imageFocusY: 50,
        imageZoom: 1,
      })
      await invalidateServiceCatalogQueries(queryClient, firmSlug)
      toast.success('Imagem guardada — actualize o preview se necessário')
    } catch (err) {
      toast.error('Não foi possível carregar a imagem', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async () => {
    setUploading(true)
    try {
      await contabilAccountingServicesApi.patch(service.id, {
        imageStorageKey: null,
        imageOriginalUrl: null,
        imageFocusX: null,
        imageFocusY: null,
        imageZoom: null,
      })
      await invalidateServiceCatalogQueries(queryClient, firmSlug)
      setRepositioning(false)
      toast.success('Imagem removida')
    } catch (err) {
      toast.error('Não foi possível remover', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  const beginReposition = () => {
    setDraftPosition({
      focusX: service.imageFocusX ?? 50,
      focusY: service.imageFocusY ?? 50,
      zoom: service.imageZoom ?? 1,
    })
    setRepositioning(true)
  }

  const confirmReposition = async () => {
    setSavingFrame(true)
    try {
      const patch: Record<string, unknown> = {
        imageFocusX: draftPosition.focusX,
        imageFocusY: draftPosition.focusY,
        imageZoom: draftPosition.zoom,
      }
      if (!service.imageOriginalUrl && service.imageStorageKey) {
        patch.imageOriginalUrl = service.imageStorageKey
      }
      await contabilAccountingServicesApi.patch(service.id, patch)
      await invalidateServiceCatalogQueries(queryClient, firmSlug)
      setRepositioning(false)
      toast.success('Enquadramento guardado')
    } catch (err) {
      toast.error('Não foi possível guardar o enquadramento', { description: getErrorMessage(err) })
    } finally {
      setSavingFrame(false)
    }
  }

  if (layout === 'inline') {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-muted/30">
            {hasImage && !repositioning ? (
              <img
                src={imageUrl!}
                alt=""
                className="h-full w-full object-cover"
                style={servicePositionedImageStyle(service)}
              />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground/50" aria-hidden />
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadFile(file)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-[11px]"
            disabled={uploading || savingFrame}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Imagem'}
          </Button>
          {hasImage ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[11px]"
                disabled={uploading || savingFrame}
                onClick={() => (repositioning ? setRepositioning(false) : beginReposition())}
              >
                <Pencil className="mr-1 h-3 w-3" aria-hidden />
                {repositioning ? 'Fechar' : 'Enquadrar'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[11px] text-destructive"
                disabled={uploading}
                onClick={() => void removeImage()}
              >
                Remover
              </Button>
            </>
          ) : null}
        </div>
        {repositioning && imageUrl ? (
          <div className="w-full min-w-[min(100%,280px)] space-y-2 rounded-lg border border-brand/25 bg-background p-2">
            <ImagePositionFrame
              imageUrl={imageUrl}
              position={draftPosition}
              onChange={setDraftPosition}
              className="h-32 w-full"
            />
            <ImagePositionZoomSlider
              zoom={draftPosition.zoom}
              onChange={(zoom) => setDraftPosition((prev) => ({ ...prev, zoom }))}
              label="Zoom"
            />
            <div className="flex justify-end gap-1">
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setRepositioning(false)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" className="h-7 text-xs" disabled={savingFrame} onClick={() => void confirmReposition()}>
                {savingFrame ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Aplicar'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/40 bg-muted/10 p-3">
      <p className="text-xs font-semibold text-foreground">{service.name}</p>
      {hasImage && !repositioning ? (
        <div className="relative overflow-hidden rounded-lg border border-border/50">
          <img
            src={imageUrl!}
            alt=""
            className="max-h-36 w-full object-cover"
            style={servicePositionedImageStyle(service)}
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={beginReposition}>
              Enquadrar
            </Button>
            <Button type="button" size="sm" variant="secondary" className="h-7 text-xs text-destructive" onClick={() => void removeImage()}>
              Remover
            </Button>
          </div>
        </div>
      ) : null}
      {repositioning && imageUrl ? (
        <div className="space-y-2">
          <ImagePositionFrame imageUrl={imageUrl} position={draftPosition} onChange={setDraftPosition} className="h-40 w-full" />
          <ImagePositionZoomSlider
            zoom={draftPosition.zoom}
            onChange={(zoom) => setDraftPosition((prev) => ({ ...prev, zoom }))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRepositioning(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" disabled={savingFrame} onClick={() => void confirmReposition()}>
              Aplicar enquadramento
            </Button>
          </div>
        </div>
      ) : null}
      <UploadDropzone
        multiple={false}
        accept="image/*"
        loading={uploading}
        label="Carregar imagem do serviço"
        hint="Aparece no cartão desta secção e na página pública do serviço"
        onFiles={(files) => {
          const file = files[0]
          if (file) void uploadFile(file)
        }}
      />
    </div>
  )
}
