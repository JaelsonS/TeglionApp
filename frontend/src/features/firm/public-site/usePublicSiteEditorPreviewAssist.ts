import { useEffect } from 'react'

import { openMaya } from '@/features/maya/openMaya'
import { setMayaFabVisible } from '@/features/maya/mayaFabPreference'
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
const MAYA_AVATAR_SRC = '/maya/maya-avatar-sm.png'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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
    let activeIntentId: string | null = null

    const ensureTooltip = () => {
      if (tooltip) return tooltip
      tooltip = document.createElement('div')
      tooltip.className =
        'cb-public-site-preview-assist-tooltip fixed z-[200] hidden max-w-[17rem] rounded-lg border border-brand/25 bg-popover px-2.5 py-2 text-[11px] text-popover-foreground shadow-lg'
      document.body.appendChild(tooltip)
      return tooltip
    }

    const hideTooltip = () => {
      activeKey = null
      activeIntentId = null
      if (tooltip) tooltip.classList.add('hidden')
    }

    const labelForKey = (key: string) => {
      const index = sections.findIndex((s) => s.key === key)
      const section = sections[index]
      if (!section) return 'Secção'
      return resolvePublicSiteSectionLabel(section, labels, Math.max(0, index))
    }

    const onMayaClick = (ev: Event) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (activeIntentId) {
        setMayaFabVisible(true)
        openMaya(activeIntentId)
      }
      hideTooltip()
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
      if (!key) {
        hideTooltip()
        return
      }
      if (key !== activeKey) {
        activeKey = key
        const guide = resolvePublicSiteEditorGuide(zoneEl.getAttribute('data-public-zone'))
        activeIntentId = guide.intentId
        const tip = ensureTooltip()
        const sectionLabel = escapeHtml(labelForKey(key))
        const mayaTip = escapeHtml(guide.mayaTip)
        tip.innerHTML = `
        <div class="flex items-start gap-2">
          <img src="${MAYA_AVATAR_SRC}" alt="" class="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-brand/20" width="28" height="28" />
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-bold uppercase tracking-wide text-brand">Maya</p>
            <p class="mt-0.5 font-semibold leading-snug text-foreground">${sectionLabel}</p>
            <p class="mt-1 leading-snug text-muted-foreground">${mayaTip}</p>
            <p class="mt-1 text-[10px] text-muted-foreground">Clique na zona para editar.</p>
            <button type="button" class="cb-public-site-preview-maya-open mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-2 py-1.5 text-[10px] font-semibold text-primary-foreground hover:bg-brand/90">
              Tirar dúvidas com a Maya
            </button>
          </div>
        </div>`
        tip.querySelector('.cb-public-site-preview-maya-open')?.addEventListener('click', onMayaClick, { once: true })
      }
      if (tooltip) {
        tooltip.classList.remove('hidden')
        tooltip.style.left = `${Math.min(event.clientX + 12, window.innerWidth - 280)}px`
        tooltip.style.top = `${Math.min(event.clientY + 12, window.innerHeight - 160)}px`
      }
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest('.cb-public-site-preview-maya-open')) return
      const root = target?.closest(PREVIEW_ROOT_SELECTOR)
      if (!root) return
      const zone = target?.closest('[data-section-key]') as HTMLElement | null
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
