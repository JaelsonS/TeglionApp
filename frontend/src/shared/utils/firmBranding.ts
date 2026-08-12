import type { CSSProperties } from 'react'
import type { Firm } from '@/shared/types/firm'
import { contrastForegroundHsl } from '@/shared/utils/colorContrast'

export type FirmThemeBranding = Firm['branding'] & {
  textColor?: string | null
  backgroundColor?: string | null
  surfaceColor?: string | null
  mutedTextColor?: string | null
}

type Branding = FirmThemeBranding

const DEFAULT_PROP_KEYS = [
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--cb-brand',
  '--brand-text',
  '--background',
  '--card',
  '--popover',
  '--muted-foreground',
] as const

const capturedDefaults: Partial<Record<(typeof DEFAULT_PROP_KEYS)[number], string>> = {}

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
  for (const key of DEFAULT_PROP_KEYS) {
    if (!capturedDefaults[key]) {
      const value = styles.getPropertyValue(key).trim()
      if (value) capturedDefaults[key] = value
    }
  }
}

export function resolveFirmBrandingCssVars(branding?: Branding | null): CSSProperties {
  const primaryHex = branding?.primaryColor ? normalizeHex(branding.primaryColor) : null
  const secondaryHex = branding?.secondaryColor ? normalizeHex(branding.secondaryColor) : null
  const textHex = branding?.textColor ? normalizeHex(branding.textColor) : null
  const backgroundHex = branding?.backgroundColor ? normalizeHex(branding.backgroundColor) : null
  const surfaceHex = branding?.surfaceColor ? normalizeHex(branding.surfaceColor) : null
  const mutedHex = branding?.mutedTextColor ? normalizeHex(branding.mutedTextColor) : null

  const primary = primaryHex ? hexToHsl(primaryHex) : null
  const secondary = secondaryHex ? hexToHsl(secondaryHex) : null
  const brandText = textHex ? hexToHsl(textHex) : primary
  const background = backgroundHex ? hexToHsl(backgroundHex) : null
  const surface = surfaceHex ? hexToHsl(surfaceHex) : null
  const muted = mutedHex ? hexToHsl(mutedHex) : null

  const style: Record<string, string> = {}
  if (primary && primaryHex) {
    style['--primary'] = primary
    style['--primary-foreground'] = contrastForegroundHsl(primaryHex)
    style['--cb-brand'] = primary
  }
  if (secondary && secondaryHex) {
    style['--secondary'] = secondary
    style['--secondary-foreground'] = contrastForegroundHsl(secondaryHex)
  }
  if (brandText) style['--brand-text'] = brandText
  if (background) style['--background'] = background
  if (surface) {
    style['--card'] = surface
    style['--popover'] = surface
  }
  if (muted) style['--muted-foreground'] = muted
  return style as CSSProperties
}

export function applyFirmBranding(branding?: Branding | null) {
  if (typeof window === 'undefined') return
  captureDefaults()
  const root = document.documentElement
  const vars = resolveFirmBrandingCssVars(branding) as Record<string, string>

  for (const key of DEFAULT_PROP_KEYS) {
    const value = vars[key]
    const fallback = capturedDefaults[key] || null
    if (value) root.style.setProperty(key, value)
    else if (fallback) root.style.setProperty(key, fallback)
    else root.style.removeProperty(key)
  }
}

export function normalizeFirmBranding(input?: Branding | null) {
  return {
    primaryColor: input?.primaryColor ? normalizeHex(input.primaryColor) : null,
    secondaryColor: input?.secondaryColor ? normalizeHex(input.secondaryColor) : null,
    textColor: input?.textColor ? normalizeHex(input.textColor) : null,
    backgroundColor: input?.backgroundColor ? normalizeHex(input.backgroundColor) : null,
    surfaceColor: input?.surfaceColor ? normalizeHex(input.surfaceColor) : null,
    mutedTextColor: input?.mutedTextColor ? normalizeHex(input.mutedTextColor) : null,
  }
}
