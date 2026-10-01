import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/** Largura lógica da mini-pré-visualização — alinha com breakpoints do site público. */
export const PUBLIC_SITE_EDITOR_PREVIEW_CANVAS_PX = 1280
export const PUBLIC_SITE_EDITOR_PREVIEW_MOBILE_PX = 390
export const PUBLIC_SITE_EDITOR_PREVIEW_TABLET_PX = 834

export type PublicSiteEditorPreviewDevice = 'mobile' | 'tablet' | 'desktop'

export function publicSiteEditorPreviewCanvasPx(device: PublicSiteEditorPreviewDevice): number {
  switch (device) {
    case 'mobile':
      return PUBLIC_SITE_EDITOR_PREVIEW_MOBILE_PX
    case 'tablet':
      return PUBLIC_SITE_EDITOR_PREVIEW_TABLET_PX
    default:
      return PUBLIC_SITE_EDITOR_PREVIEW_CANVAS_PX
  }
}

type Props = {
  children: ReactNode
  /** Diálogo «Expandir»: sem escala, usa a largura real. */
  expanded?: boolean
  className?: string
  /** Largura simulada (menu hamburger aparece abaixo de lg ≈ 1024px). */
  canvasWidthPx?: number
}

export function PublicSiteEditorPreviewFrame({
  children,
  expanded = false,
  className,
  canvasWidthPx = PUBLIC_SITE_EDITOR_PREVIEW_TABLET_PX,
}: Props) {
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
      const nextScale = Math.min(1, w / canvasWidthPx)
      setScale(nextScale)
      const contentHeight = canvas.offsetHeight
      setScaledHeight(Math.max(240, Math.ceil(contentHeight * nextScale)))
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
  }, [expanded, children, canvasWidthPx])

  if (expanded) {
    return <div className={cn('cb-public-site-container w-full min-w-0', className)}>{children}</div>
  }

  return (
    <div
      ref={hostRef}
      className={cn('cb-public-site-editor-preview-frame w-full overflow-hidden', className)}
      style={{ height: scaledHeight, minHeight: 0 }}
    >
      <div
        ref={canvasRef}
        className="cb-public-site-editor-preview-canvas cb-public-site-container origin-top-left pb-0"
        style={{
          width: canvasWidthPx,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
