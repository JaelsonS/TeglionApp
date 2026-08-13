import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

export type ImageCropAspect = number | 'free'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Ficheiro escolhido pelo utilizador (antes do upload). */
  file: File | null
  title?: string
  /** 1 = quadrado (logo), 16/9 = banner, 'free' = livre. */
  aspect?: ImageCropAspect
  outputMime?: 'image/jpeg' | 'image/webp'
  outputQuality?: number
  maxOutputEdge?: number
  onCropped: (file: File) => void
}

type DragState = { x: number; y: number } | null

/**
 * Recorte no browser (canvas) antes do upload — sem pipeline no servidor.
 * O utilizador faz zoom e arrasta a imagem dentro da janela de corte.
 */
export function ImageCropDialog({
  open,
  onOpenChange,
  file,
  title = 'Recortar imagem',
  aspect = 1,
  outputMime = 'image/jpeg',
  outputQuality = 0.92,
  maxOutputEdge = 1600,
  onCropped,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragStart = useRef<DragState>(null)
  const offsetAtDrag = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!file || !open) {
      setObjectUrl(null)
      setReady(false)
      return
    }
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setReady(false)
    return () => URL.revokeObjectURL(url)
  }, [file, open])

  useEffect(() => {
    if (!objectUrl) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setReady(true)
    }
    img.onerror = () => {
      imgRef.current = null
      setReady(false)
    }
    img.src = objectUrl
  }, [objectUrl])

  const frameSize = 320
  const aspectRatio = aspect === 'free' ? 1 : aspect
  const frameW = frameSize
  const frameH = Math.max(120, Math.round(frameSize / aspectRatio))

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !ready) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = frameW
    canvas.height = frameH
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, frameW, frameH)

    const cover = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) * zoom
    const dw = img.naturalWidth * cover
    const dh = img.naturalHeight * cover
    const dx = (frameW - dw) / 2 + offset.x
    const dy = (frameH - dh) / 2 + offset.y
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [frameH, frameW, offset.x, offset.y, ready, zoom])

  useEffect(() => {
    paint()
  }, [paint])

  const onPointerDown = (e: ReactPointerEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY }
    offsetAtDrag.current = { ...offset }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragStart.current) return
    setOffset({
      x: offsetAtDrag.current.x + (e.clientX - dragStart.current.x),
      y: offsetAtDrag.current.y + (e.clientY - dragStart.current.y),
    })
  }

  const onPointerUp = () => {
    dragStart.current = null
  }

  const confirm = async () => {
    const img = imgRef.current
    if (!img || !ready) return
    setExporting(true)
    try {
      const out = document.createElement('canvas')
      const exportScale = Math.min(maxOutputEdge / frameW, maxOutputEdge / frameH, 4)
      out.width = Math.round(frameW * Math.max(1, exportScale))
      out.height = Math.round(frameH * Math.max(1, exportScale))
      const ctx = out.getContext('2d')
      if (!ctx) return

      const cover = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) * zoom
      const dw = img.naturalWidth * cover * (out.width / frameW)
      const dh = img.naturalHeight * cover * (out.height / frameH)
      const dx = ((frameW - img.naturalWidth * cover) / 2 + offset.x) * (out.width / frameW)
      const dy = ((frameH - img.naturalHeight * cover) / 2 + offset.y) * (out.height / frameH)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, out.width, out.height)
      ctx.drawImage(img, dx, dy, dw, dh)

      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob((b) => resolve(b), outputMime, outputQuality),
      )
      if (!blob) return
      const base = (file?.name || 'image').replace(/\.[^.]+$/, '')
      const ext = outputMime === 'image/webp' ? 'webp' : 'jpg'
      const cropped = new File([blob], `${base}-crop.${ext}`, { type: outputMime })
      onCropped(cropped)
      onOpenChange(false)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Arraste para posicionar e use o zoom. Depois confirme o recorte antes de enviar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div
            className="touch-none overflow-hidden rounded-lg border border-border/60 bg-slate-900"
            style={{ width: frameW, height: frameH }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <canvas ref={canvasRef} className="block h-full w-full cursor-grab active:cursor-grabbing" />
          </div>
          {!ready ? (
            <p className="text-xs text-muted-foreground">A carregar imagem…</p>
          ) : (
            <label className="flex w-full max-w-xs items-center gap-2 text-xs text-muted-foreground">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </label>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void confirm()} disabled={!ready || exporting}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Usar recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
