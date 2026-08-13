/**
 * Preferência local do FAB Maya (por browser).
 * Default: visível. Sem sync servidor / sem PII.
 */

export const MAYA_FAB_STORAGE_KEY = 'teglion:maya-fab-visible'
export const MAYA_FAB_CHANGED_EVENT = 'teglion:maya-fab-changed'

export function isMayaFabVisible(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(MAYA_FAB_STORAGE_KEY)
    if (raw === null) return true
    return raw === '1'
  } catch {
    return true
  }
}

export function setMayaFabVisible(visible: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MAYA_FAB_STORAGE_KEY, visible ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(
    new CustomEvent(MAYA_FAB_CHANGED_EVENT, {
      detail: { visible },
    }),
  )
}
