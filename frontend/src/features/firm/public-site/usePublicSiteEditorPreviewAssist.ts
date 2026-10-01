import { useEffect } from 'react'

import { openMaya } from '@/features/maya/openMaya'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'
import { resolvePublicSiteEditorGuide } from './publicSiteEditorGuide'
import { publicSiteSectionCardDomId } from './publicSitePublishReadiness'
import { resolvePublicSiteSectionLabel } from './publicSiteSectionFactory'

type Options = {
  enabled: boolean
  sections: PublicSiteSection[]
  labels: Record<PublicSiteSection['type'], string>
  onOpenSection: (sectionKey: string) => void
}

const PREVIEW_ROOT_SELECTOR = '.cb-public-site-editor-preview-canvas'

export function usePublicSiteEditorPreviewAssist({
  enabled,
  sections,
  labels,
  onOpenSection,
}: Options) {
  useEffect(() => {
    if (!enabled) return

    let tooltip: HTMLDivElement | null = null
    let activeKey: string | null = null

    const ensureTooltip = () => {
      if (tooltip) return tooltip
      tooltip = document.createElement('div')
      tooltip.className =
        'cb-public-site-preview-assist-tooltip fixed z-[200] hidden max-w-[15rem] rounded-md border border-border/60 bg-popover px-2 py-1.5 text-[11px] text-popover-foreground shadow-md'
      document.body.appendChild(tooltip)
      return tooltip
    }

    const hideTooltip = () => {
      activeKey = null
      if (tooltip) tooltip.classList.add('hidden')
    }

    const labelForKey = (key: string) => {
      const index = sections.findIndex((s) => s.key === key)
      const section = sections[index]
      if (!section) return 'Secção'
      return resolvePublicSiteSectionLabel(section, labels, Math.max(0, index))
    }

    const onPointerMove = (event: PointerEvent) => {
      const root = (event.target as Element | null)?.closest(PREVIEW_ROOT_SELECTOR)
      if (!root) {
        hideTooltip()
        return
      }
      const zoneEl = (event.target as Element | null)?.closest('[data-section-key]') as HTMLElement | null
      if (!zoneEl) {
        hideTooltip()
        return
      }
      const key = zoneEl.getAttribute('data-section-key')
      if (!key || key === activeKey) {
        if (key && tooltip) {
          tooltip.style.left = `${event.clientX + 12}px`
          tooltip.style.top = `${event.clientY + 12}px`
        }
        return
      }
      activeKey = key
      const guide = resolvePublicSiteEditorGuide(zoneEl.getAttribute('data-public-zone'))
      const tip = ensureTooltip()
      tip.innerHTML = `
        <span class="font-semibold">${labelForKey(key)}</span>
        <span class="mt-0.5 block text-muted-foreground">Clicar para editar</span>
        <button type="button" class="cb-public-site-preview-maya-help mt-1.5 block w-full rounded border border-border/60 bg-muted/40 px-2 py-1 text-left text-[10px] font-medium hover:bg-muted">
          Quer ajuda com ${guide.topicLabel}?
        </button>`
      tip.classList.remove('hidden')
      const helpBtn = tip.querySelector('.cb-public-site-preview-maya-help')
      helpBtn?.addEventListener('click', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        openMaya(guide.intentId)
      })
      tip.style.left = `${event.clientX + 12}px`
      tip.style.top = `${event.clientY + 12}px`
    }

    const onClick = (event: MouseEvent) => {
      const root = (event.target as Element | null)?.closest(PREVIEW_ROOT_SELECTOR)
      if (!root) return
      const zone = (event.target as Element | null)?.closest('[data-section-key]') as HTMLElement | null
      if (!zone) return
      const key = zone.getAttribute('data-section-key')
      if (!key) return
      event.preventDefault()
      event.stopPropagation()
      onOpenSection(key)
      document.getElementById(publicSiteSectionCardDomId(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      hideTooltip()
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('click', onClick, true)

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('click', onClick, true)
      tooltip?.remove()
      tooltip = null
    }
  }, [enabled, sections, labels, onOpenSection])
}
