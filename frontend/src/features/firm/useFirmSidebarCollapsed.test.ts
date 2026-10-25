/** @vitest-environment happy-dom */
import { describe, expect, it, beforeEach } from 'vitest'

import {
  FIRM_SIDEBAR_COLLAPSED_STORAGE_KEY,
  readFirmSidebarCollapsed,
  writeFirmSidebarCollapsed,
} from '@/features/firm/useFirmSidebarCollapsed'

describe('useFirmSidebarCollapsed storage', () => {
  beforeEach(() => {
    window.localStorage.removeItem(FIRM_SIDEBAR_COLLAPSED_STORAGE_KEY)
  })

  it('defaults to expanded (false)', () => {
    expect(readFirmSidebarCollapsed()).toBe(false)
  })

  it('persists collapsed preference', () => {
    writeFirmSidebarCollapsed(true)
    expect(window.localStorage.getItem(FIRM_SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('1')
    expect(readFirmSidebarCollapsed()).toBe(true)

    writeFirmSidebarCollapsed(false)
    expect(window.localStorage.getItem(FIRM_SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe('0')
    expect(readFirmSidebarCollapsed()).toBe(false)
  })
})
