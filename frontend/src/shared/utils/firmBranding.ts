import type { Firm } from '@/shared/types/firm'

type Branding = Firm['branding']

let defaultPrimary: string | null = null
let defaultSecondary: string | null = null

function normalizeHex(input: string): string | null {
  if (!input) return null
  const raw = input.trim().toLowerCase()
  if (!raw) return null
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    const r = raw[0]
    const g = raw[1]
    const b = raw[2]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return null
}

function hexToHsl(hex: string): string | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null

  const r = parseInt(normalized.slice(1, 3), 16) / 255
  const g = parseInt(normalized.slice(3, 5), 16) / 255
  const b = parseInt(normalized.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6
        break
      case g:
        h = (b - r) / delta + 2
        break
      default:
        h = (r - g) / delta + 4
        break
    }
    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function captureDefaults() {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const styles = window.getComputedStyle(root)
  if (!defaultPrimary) {
    const value = styles.getPropertyValue('--primary').trim()
    if (value) defaultPrimary = value
  }
  if (!defaultSecondary) {
    const value = styles.getPropertyValue('--secondary').trim()
    if (value) defaultSecondary = value
  }
}

export function applyFirmBranding(branding?: Branding | null) {
  if (typeof window === 'undefined') return
  captureDefaults()
  const root = document.documentElement
  const primary = branding?.primaryColor ? hexToHsl(branding.primaryColor) : null
  const secondary = branding?.secondaryColor ? hexToHsl(branding.secondaryColor) : null
  if (primary) root.style.setProperty('--primary', primary)
  else if (defaultPrimary) root.style.setProperty('--primary', defaultPrimary)
  if (secondary) root.style.setProperty('--secondary', secondary)
  else if (defaultSecondary) root.style.setProperty('--secondary', defaultSecondary)
}

export function normalizeFirmBranding(input?: Branding | null) {
  return {
    primaryColor: input?.primaryColor ? normalizeHex(input.primaryColor) : null,
    secondaryColor: input?.secondaryColor ? normalizeHex(input.secondaryColor) : null,
  }
}
