import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import {
  isMayaFabVisible,
  MAYA_FAB_STORAGE_KEY,
  setMayaFabVisible,
} from '@/features/maya/mayaFabPreference'
import { getMayaIntent, MAYA_INTENTS, MAYA_MODULE_INTENT } from '@/features/maya/mayaContent'

function installLocalStorageMock() {
  const store = new Map<string, string>()
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v))
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
  }
  const listeners = new Set<(ev: Event) => void>()
  ;(globalThis as { window?: unknown }).window = {
    localStorage,
    addEventListener: (_: string, fn: (ev: Event) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (ev: Event) => void) => listeners.delete(fn),
    dispatchEvent: (ev: Event) => {
      listeners.forEach((fn) => fn(ev))
      return true
    },
  }
  return { store, localStorage, listeners }
}

describe('mayaFabPreference', () => {
  beforeEach(() => {
    installLocalStorageMock()
  })

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window
  })

  it('defaults to visible when unset', () => {
    expect(isMayaFabVisible()).toBe(true)
  })

  it('persists hide and show', () => {
    setMayaFabVisible(false)
    expect(window.localStorage.getItem(MAYA_FAB_STORAGE_KEY)).toBe('0')
    expect(isMayaFabVisible()).toBe(false)
    setMayaFabVisible(true)
    expect(isMayaFabVisible()).toBe(true)
  })

  it('dispatches change event', () => {
    const spy = vi.fn()
    window.addEventListener('teglion:maya-fab-changed', spy)
    setMayaFabVisible(false)
    expect(spy).toHaveBeenCalled()
    window.removeEventListener('teglion:maya-fab-changed', spy)
  })
})

describe('mayaContent', () => {
  it('resolves core module intents', () => {
    expect(getMayaIntent('public-page')?.deepLink).toContain('pagina-publica')
    expect(getMayaIntent('payments')?.id).toBe('payments')
    expect(getMayaIntent('obligations')?.relatedIntents.length).toBeGreaterThan(0)
  })

  it('maps modules to known intents', () => {
    for (const intentId of Object.values(MAYA_MODULE_INTENT)) {
      expect(getMayaIntent(intentId), intentId).toBeTruthy()
    }
  })

  it('keeps related intents resolvable', () => {
    for (const intent of MAYA_INTENTS) {
      for (const related of intent.relatedIntents) {
        expect(getMayaIntent(related), `${intent.id} → ${related}`).toBeTruthy()
      }
    }
  })
})
