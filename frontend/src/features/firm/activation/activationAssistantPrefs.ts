const SKIP_KEY = 'teglion:activation-maya-setup-skipped'
const APPLIED_KEY = 'teglion:activation-maya-setup-applied'

function firmKey(base: string, firmSlug: string) {
  return `${base}:${firmSlug}`
}

export function markMayaSetupSkippedForActivation(firmSlug: string) {
  if (typeof window === 'undefined' || !firmSlug) return
  window.localStorage.setItem(firmKey(SKIP_KEY, firmSlug), '1')
}

export function markMayaSetupAppliedForActivation(firmSlug: string) {
  if (typeof window === 'undefined' || !firmSlug) return
  window.localStorage.setItem(firmKey(APPLIED_KEY, firmSlug), '1')
}

export function readMayaSetupActivationPrefs(firmSlug: string | null | undefined): {
  skipped: boolean
  applied: boolean
} {
  if (typeof window === 'undefined' || !firmSlug) {
    return { skipped: false, applied: false }
  }
  return {
    skipped: window.localStorage.getItem(firmKey(SKIP_KEY, firmSlug)) === '1',
    applied: window.localStorage.getItem(firmKey(APPLIED_KEY, firmSlug)) === '1',
  }
}
