import { useCallback, useEffect, useState } from 'react'

export const FIRM_SIDEBAR_COLLAPSED_STORAGE_KEY = 'teglion_firm_sidebar_collapsed'

export function readFirmSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(FIRM_SIDEBAR_COLLAPSED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeFirmSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FIRM_SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // ignore quota / private mode
  }
}

/** Persistência do menu principal desktop (≥1280): expandido por omissão. */
export function useFirmSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(false)

  useEffect(() => {
    setCollapsedState(readFirmSidebarCollapsed())
  }, [])

  const setCollapsed = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      writeFirmSidebarCollapsed(value)
      return value
    })
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [setCollapsed])

  return { collapsed, setCollapsed, toggleCollapsed }
}
