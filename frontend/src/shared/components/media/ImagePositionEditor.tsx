import { useState, type PointerEvent as ReactPointerEvent } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

export type ImagePosition = { focusX: number; focusY: number; zoom: number }

const DEFAULT_POSITION: ImagePosition = { focusX: 50, focusY: 50, zoom: 1 }

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * Reposicionamento REVERSÍVEL de imagem: nunca "asa" pixels (diferente de
 * ImageCropDialog.tsx, usado no logo e nas seções da página pública). Guarda
 * só um ponto focal (0-100%) e um zoom (1-2.5x), aplicados via CSS
 * (object-position/transform-origin) em qualquer tamanho de contêiner — a
 * mesma imagem original pode ser reaberta e reposicionada quantas vezes
 * quiser, meses depois, sem perder qualidade nem reenviar o arquivo.
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
  const [position, setPosition] = useState<ImagePosition>({ ...DEFAULT_POSITION, ...initialPosition })
  const [dragging, setDragging] = useState(false)

  const resetOnOpen = (isOpen: boolean) => {
    if (isOpen) setPosition({ ...DEFAULT_POSITION, ...initialPosition })
    onOpenChange(isOpen)
  }

  const frameW = 320
  const frameH = Math.max(120, Math.round(frameW / aspect))

  const applyPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
    setPosition((prev) => ({ ...prev, focusX: Math.round(x), focusY: Math.round(y) }))
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
    <Dialog open={open} onOpenChange={resetOnOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Clique ou arraste na imagem para escolher o ponto que fica sempre visível. Pode reabrir e ajustar de
            novo quando quiser — a imagem original nunca é alterada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div
            className="relative touch-none overflow-hidden rounded-lg border border-border/60 bg-slate-900"
            style={{ width: frameW, height: frameH }}
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
            <div
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{ left: `${position.focusX}%`, top: `${position.focusY}%` }}
            />
          </div>

          <label className="flex w-full max-w-xs items-center gap-2 text-xs text-muted-foreground">
            Zoom
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.05}
              value={position.zoom}
              onChange={(e) => setPosition((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
              className="flex-1"
            />
          </label>
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
