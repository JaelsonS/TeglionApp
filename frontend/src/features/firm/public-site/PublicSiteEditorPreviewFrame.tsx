import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/** Largura lógica da mini-pré-visualização — alinha com breakpoints do site público. */
export const PUBLIC_SITE_EDITOR_PREVIEW_CANVAS_PX = 1280
export const PUBLIC_SITE_EDITOR_PREVIEW_MOBILE_PX = 390
export const PUBLIC_SITE_EDITOR_PREVIEW_TABLET_PX = 834

export type PublicSiteEditorPreviewDevice = 'mobile' | 'tablet' | 'desktop'

function measurePreviewContentHeight(canvas: HTMLDivElement): number {
  const root = canvas.firstElementChild as HTMLElement | null
  let height = Math.max(canvas.scrollHeight, canvas.offsetHeight)
  if (root) {
    height = Math.max(height, root.scrollHeight, root.offsetHeight)
    root.querySelectorAll('[data-section-key]').forEach((node) => {
      if (node instanceof HTMLElement) {
        height = Math.max(height, node.offsetTop + node.offsetHeight)
      }
    })
  }
  return Math.max(120, height)
}

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
  /** Dentro da moldura telemóvel/tablet/desktop — altura medida com scrollHeight. */
  inDeviceChrome?: boolean
}

export function PublicSiteEditorPreviewFrame({
  children,
  expanded = false,
  className,
  canvasWidthPx = PUBLIC_SITE_EDITOR_PREVIEW_TABLET_PX,
  inDeviceChrome = false,
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
      const contentHeight = measurePreviewContentHeight(canvas)
      setScaledHeight(Math.ceil(contentHeight * nextScale))
    }

    const roHost = new ResizeObserver(sync)
    const roCanvas = new ResizeObserver(sync)
    roHost.observe(host)
    roCanvas.observe(canvas)
    const root = canvas.firstElementChild
    const roRoot = root instanceof HTMLElement ? new ResizeObserver(sync) : null
    if (root instanceof HTMLElement) roRoot?.observe(root)

    const moRoot = root instanceof HTMLElement ? root : null
    const mo = inDeviceChrome && moRoot ? new MutationObserver(() => sync()) : null
    if (mo && moRoot) mo.observe(moRoot, { childList: true, subtree: true, attributes: true })

    const onImageLoad = (ev: Event) => {
      if (ev.target instanceof HTMLImageElement && canvas.contains(ev.target)) sync()
    }
    canvas.addEventListener('load', onImageLoad, true)

    sync()
    const t1 = window.setTimeout(sync, 120)
    const t2 = window.setTimeout(sync, 480)
    const t3 = window.setTimeout(sync, 1200)

    return () => {
      roHost.disconnect()
      roCanvas.disconnect()
      roRoot?.disconnect()
      mo?.disconnect()
      canvas.removeEventListener('load', onImageLoad, true)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [expanded, children, canvasWidthPx, inDeviceChrome])

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
          position: 'absolute',
          top: 0,
          left: 0,
          width: canvasWidthPx,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
