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

/** Espera antes de mostrar ao entrar numa zona (evita flicker). */
const SHOW_DELAY_MS = 320
/** Só após sair da zona e do tooltip — tempo até fechar. */
const HIDE_AFTER_LEAVE_MS = 900
/** Ao sair da zona, tempo para chegar ao tooltip antes de fechar. */
const LEAVE_GRACE_MS = 450

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function positionTooltip(tip: HTMLDivElement, zoneEl: HTMLElement) {
  const rect = zoneEl.getBoundingClientRect()
  const margin = 8
  const tipRect = tip.getBoundingClientRect()
  const pad = 12

  let top = rect.top - tipRect.height - margin
  if (top < pad) {
    top = rect.bottom + margin
  }
  if (top + tipRect.height > window.innerHeight - pad) {
    top = Math.max(pad, window.innerHeight - pad - tipRect.height)
  }

  let left = rect.left + rect.width / 2 - tipRect.width / 2
  left = Math.max(pad, Math.min(left, window.innerWidth - pad - tipRect.width))

  tip.style.left = `${left}px`
  tip.style.top = `${top}px`
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
    let activeZoneEl: HTMLElement | null = null
    let showTimer: ReturnType<typeof setTimeout> | null = null
    let autoHideTimer: ReturnType<typeof setTimeout> | null = null
    let leaveTimer: ReturnType<typeof setTimeout> | null = null
    let tooltipHovered = false
    let zoneHovered = false
    let pendingZoneEl: HTMLElement | null = null
    let pendingKey: string | null = null

    const clearTimers = () => {
      if (showTimer) clearTimeout(showTimer)
      if (autoHideTimer) clearTimeout(autoHideTimer)
      if (leaveTimer) clearTimeout(leaveTimer)
      showTimer = null
      autoHideTimer = null
      leaveTimer = null
    }

    const ensureTooltip = () => {
      if (tooltip) return tooltip
      tooltip = document.createElement('div')
      tooltip.className =
        'cb-public-site-preview-assist-tooltip pointer-events-none fixed z-[200] max-w-[13.5rem] rounded-md border border-brand/20 bg-popover/95 px-2 py-1.5 text-[11px] text-popover-foreground shadow-md backdrop-blur-sm opacity-0 transition-opacity duration-200 ease-out'
      tooltip.setAttribute('role', 'tooltip')
      document.body.appendChild(tooltip)

      tooltip.addEventListener('pointerenter', () => {
        tooltipHovered = true
        if (leaveTimer) {
          clearTimeout(leaveTimer)
          leaveTimer = null
        }
        clearHideAfterLeave()
      })
      tooltip.addEventListener('pointerleave', () => {
        tooltipHovered = false
        scheduleHideAfterLeave()
      })

      return tooltip
    }

    const setTooltipVisible = (visible: boolean) => {
      if (!tooltip) return
      if (visible) {
        tooltip.classList.remove('opacity-0', 'pointer-events-none')
        tooltip.classList.add('opacity-100', 'pointer-events-auto')
      } else {
        tooltip.classList.add('opacity-0', 'pointer-events-none')
        tooltip.classList.remove('opacity-100', 'pointer-events-auto')
      }
    }

    const hideTooltip = () => {
      clearTimers()
      activeKey = null
      activeIntentId = null
      activeZoneEl = null
      pendingKey = null
      pendingZoneEl = null
      setTooltipVisible(false)
    }

    const scheduleHideAfterLeave = () => {
      if (autoHideTimer) clearTimeout(autoHideTimer)
      if (zoneHovered || tooltipHovered) return
      autoHideTimer = setTimeout(() => {
        if (!zoneHovered && !tooltipHovered) hideTooltip()
      }, HIDE_AFTER_LEAVE_MS)
    }

    const clearHideAfterLeave = () => {
      if (autoHideTimer) clearTimeout(autoHideTimer)
      autoHideTimer = null
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

    const renderTooltipContent = (key: string, zoneEl: HTMLElement) => {
      const guide = resolvePublicSiteEditorGuide(zoneEl.getAttribute('data-public-zone'))
      activeIntentId = guide.intentId
      const tip = ensureTooltip()
      const sectionLabel = escapeHtml(labelForKey(key))
      const mayaTip = escapeHtml(guide.mayaTip)
      tip.innerHTML = `
        <div class="flex items-start gap-1.5">
          <img src="${MAYA_AVATAR_SRC}" alt="" class="mt-0.5 h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-brand/15" width="20" height="20" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold leading-tight text-foreground">${sectionLabel}</p>
            <p class="mt-0.5 line-clamp-2 leading-snug text-muted-foreground">${mayaTip}</p>
            <button type="button" class="cb-public-site-preview-maya-open mt-1 text-[10px] font-medium text-brand underline-offset-2 hover:underline">
              Tirar dúvidas com a Maya
            </button>
          </div>
        </div>`
      tip.querySelector('.cb-public-site-preview-maya-open')?.addEventListener('click', onMayaClick, { once: true })
      setTooltipVisible(false)
      requestAnimationFrame(() => {
        if (activeZoneEl === zoneEl) {
          positionTooltip(tip, zoneEl)
          setTooltipVisible(true)
          clearHideAfterLeave()
        }
      })
    }

    const showForZone = (key: string, zoneEl: HTMLElement) => {
      if (key === activeKey && activeZoneEl === zoneEl) {
        clearHideAfterLeave()
        return
      }
      activeKey = key
      activeZoneEl = zoneEl
      renderTooltipContent(key, zoneEl)
    }

    const queueShow = (key: string, zoneEl: HTMLElement) => {
      if (pendingKey === key && pendingZoneEl === zoneEl && showTimer) return
      if (showTimer) clearTimeout(showTimer)
      pendingKey = key
      pendingZoneEl = zoneEl
      showTimer = setTimeout(() => {
        showTimer = null
        if (pendingKey === key && pendingZoneEl === zoneEl) {
          showForZone(key, zoneEl)
        }
      }, SHOW_DELAY_MS)
    }

    const onPointerMove = (event: PointerEvent) => {
      const root = (event.target as Element | null)?.closest(PREVIEW_ROOT_SELECTOR)
      if (!root) {
        if (!tooltipHovered) {
          if (showTimer) clearTimeout(showTimer)
          showTimer = null
          pendingKey = null
          pendingZoneEl = null
          if (leaveTimer) clearTimeout(leaveTimer)
          leaveTimer = setTimeout(() => {
            if (!tooltipHovered) hideTooltip()
          }, LEAVE_GRACE_MS)
        }
        return
      }
      if (leaveTimer) {
        clearTimeout(leaveTimer)
        leaveTimer = null
      }

      const zoneEl = (event.target as Element | null)?.closest('[data-section-key]') as HTMLElement | null
      if (!zoneEl) {
        zoneHovered = false
        if (!tooltipHovered && activeKey) {
          if (leaveTimer) clearTimeout(leaveTimer)
          leaveTimer = setTimeout(() => {
            if (!tooltipHovered && !zoneHovered) scheduleHideAfterLeave()
          }, LEAVE_GRACE_MS)
        }
        return
      }
      const key = zoneEl.getAttribute('data-section-key')
      if (!key) {
        zoneHovered = false
        hideTooltip()
        return
      }
      zoneHovered = true
      clearHideAfterLeave()
      if (leaveTimer) {
        clearTimeout(leaveTimer)
        leaveTimer = null
      }
      queueShow(key, zoneEl)
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
      clearTimers()
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('click', onClick, true)
      tooltip?.remove()
      tooltip = null
    }
  }, [enabled, sections, labels, onOpenSection])
}
