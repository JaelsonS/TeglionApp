/** Sincroniza zona focada do editor com a Maya (FAB + diálogo). */

import { useEffect, useState } from 'react'

import { openMaya } from '@/features/maya/openMaya'
import { setMayaFabVisible } from '@/features/maya/mayaFabPreference'

export const MAYA_PUBLIC_SITE_COACH_EVENT = 'teglion:maya-public-site-coach'

export type PublicSiteCoachSnapshot = {
  coachZone: string | null
  intentId: string
  tip: string
}

export function broadcastPublicSiteCoach(snapshot: PublicSiteCoachSnapshot) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<PublicSiteCoachSnapshot>(MAYA_PUBLIC_SITE_COACH_EVENT, { detail: snapshot }),
  )
}

export function openMayaForPublicSiteCoach(intentId: string) {
  setMayaFabVisible(true)
  openMaya(intentId)
}

export function usePublicSiteCoachSnapshot(): PublicSiteCoachSnapshot | null {
  const [snap, setSnap] = useState<PublicSiteCoachSnapshot | null>(null)
  useEffect(() => {
    function onCoach(ev: Event) {
      const detail = (ev as CustomEvent<PublicSiteCoachSnapshot>).detail
      if (detail?.tip) setSnap(detail)
    }
    window.addEventListener(MAYA_PUBLIC_SITE_COACH_EVENT, onCoach as EventListener)
    return () => window.removeEventListener(MAYA_PUBLIC_SITE_COACH_EVENT, onCoach as EventListener)
  }, [])
  return snap
}
