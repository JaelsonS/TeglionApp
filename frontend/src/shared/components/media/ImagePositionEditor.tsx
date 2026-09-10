import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/lib/utils'

export type ImagePosition = { focusX: number; focusY: number; zoom: number }

export const DEFAULT_IMAGE_POSITION: ImagePosition = { focusX: 50, focusY: 50, zoom: 1 }

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Superfície de arrastar/zoom no próprio contentor da imagem.
 * Preferir no admin do serviço (modo inline) para ver o resultado no sítio real.
 */
export function ImagePositionFrame({
  imageUrl,
  position,
  onChange,
  className,
  showFocusMarker = true,
}: {
  imageUrl: string | null
  position: ImagePosition
  onChange: (next: ImagePosition) => void
  className?: string
  showFocusMarker?: boolean
}) {
  const [dragging, setDragging] = useState(false)

  const applyPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
    onChange({ ...position, focusX: Math.round(x), focusY: Math.round(y) })
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    applyPointer(e)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    applyPointer(e)
  }

  return (
    <div
      className={cn('relative touch-none overflow-hidden bg-slate-900', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="h-full w-full cursor-crosshair select-none"
          style={{
            objectFit: 'cover',
            objectPosition: `${position.focusX}% ${position.focusY}%`,
            transform: `scale(${position.zoom})`,
            transformOrigin: `${position.focusX}% ${position.focusY}%`,
          }}
        />
      ) : null}
      {showFocusMarker ? (
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${position.focusX}%`, top: `${position.focusY}%` }}
        />
      ) : null}
    </div>
  )
}

export function ImagePositionZoomSlider({
  zoom,
  onChange,
  className,
}: {
  zoom: number
  onChange: (zoom: number) => void
  className?: string
}) {
  return (
    <label className={cn('flex w-full items-center gap-2 text-xs text-muted-foreground', className)}>
      Zoom
      <input
        type="range"
        min={1}
        max={2.5}
        step={0.05}
        value={zoom}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
    </label>
  )
}

/**
 * Diálogo legado de reposicionamento. Preferir ImagePositionFrame inline.
 */
export function ImagePositionEditor({
  open,
  onOpenChange,
  imageUrl,
  initialPosition,
  aspect = 16 / 9,
  title = 'Reposicionar imagem',
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string | null
  initialPosition?: Partial<ImagePosition> | null
  aspect?: number
  title?: string
  onSave: (position: ImagePosition) => void
}) {
  const [position, setPosition] = useState<ImagePosition>({
    ...DEFAULT_IMAGE_POSITION,
    ...initialPosition,
  })

  useEffect(() => {
    if (open) setPosition({ ...DEFAULT_IMAGE_POSITION, ...initialPosition })
    // initialPosition is re-read when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const frameW = 320
  const frameH = Math.max(120, Math.round(frameW / aspect))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Clique ou arraste na imagem para escolher o ponto que fica sempre visível. Pode reabrir e ajustar de
            novo quando quiser — a imagem original nunca é alterada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div style={{ width: frameW, height: frameH }}>
            <ImagePositionFrame
              imageUrl={imageUrl}
              position={position}
              onChange={setPosition}
              className="h-full w-full rounded-lg border border-border/60"
            />
          </div>
          <ImagePositionZoomSlider
            zoom={position.zoom}
            onChange={(zoom) => setPosition((prev) => ({ ...prev, zoom }))}
            className="max-w-xs"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(position)
              onOpenChange(false)
            }}
            disabled={!imageUrl}
          >
            Usar este enquadramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
