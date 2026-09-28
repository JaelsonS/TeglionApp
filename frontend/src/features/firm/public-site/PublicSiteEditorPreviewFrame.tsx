import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/** Largura lógica da mini-pré-visualização — alinha com breakpoints do site público. */
export const PUBLIC_SITE_EDITOR_PREVIEW_CANVAS_PX = 1280

type Props = {
  children: ReactNode
  /** Diálogo «Expandir»: sem escala, usa a largura real. */
  expanded?: boolean
  className?: string
}

export function PublicSiteEditorPreviewFrame({ children, expanded = false, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [scaledHeight, setScaledHeight] = useState(480)

  useEffect(() => {
    if (expanded) return
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const sync = () => {
      const w = host.clientWidth
      if (w <= 0) return
      const nextScale = Math.min(1, w / PUBLIC_SITE_EDITOR_PREVIEW_CANVAS_PX)
      setScale(nextScale)
      setScaledHeight(Math.max(200, Math.ceil(canvas.offsetHeight * nextScale)))
    }

    const roHost = new ResizeObserver(sync)
    const roCanvas = new ResizeObserver(sync)
    roHost.observe(host)
    roCanvas.observe(canvas)
    sync()

    return () => {
      roHost.disconnect()
      roCanvas.disconnect()
    }
  }, [expanded, children])

  if (expanded) {
    return <div className={cn('cb-public-site-container w-full min-w-0', className)}>{children}</div>
  }

  return (
    <div
      ref={hostRef}
      className={cn('cb-public-site-editor-preview-frame w-full overflow-hidden', className)}
      style={{ height: scaledHeight }}
    >
      <div
        ref={canvasRef}
        className="cb-public-site-editor-preview-canvas cb-public-site-container origin-top-left"
        style={{
          width: PUBLIC_SITE_EDITOR_PREVIEW_CANVAS_PX,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
