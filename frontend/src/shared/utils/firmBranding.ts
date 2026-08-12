import type { CSSProperties } from 'react'
import type { Firm } from '@/shared/types/firm'
import { contrastForegroundHsl } from '@/shared/utils/colorContrast'

type Branding = Firm['branding'] & { textColor?: string | null }

let defaultPrimary: string | null = null
let defaultSecondary: string | null = null
let defaultPrimaryForeground: string | null = null
let defaultCbBrand: string | null = null
let defaultBrandText: string | null = null

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
  if (!defaultPrimaryForeground) {
    const value = styles.getPropertyValue('--primary-foreground').trim()
    if (value) defaultPrimaryForeground = value
  }
  if (!defaultCbBrand) {
    const value = styles.getPropertyValue('--cb-brand').trim()
    if (value) defaultCbBrand = value
  }
  if (!defaultBrandText) {
    const value = styles.getPropertyValue('--brand-text').trim()
    if (value) defaultBrandText = value
  }
}

export function resolveFirmBrandingCssVars(branding?: Branding | null): CSSProperties {
  const primaryHex = branding?.primaryColor ? normalizeHex(branding.primaryColor) : null
  const secondaryHex = branding?.secondaryColor ? normalizeHex(branding.secondaryColor) : null
  const textHex = branding?.textColor ? normalizeHex(branding.textColor) : null
  const primary = primaryHex ? hexToHsl(primaryHex) : null
  const secondary = secondaryHex ? hexToHsl(secondaryHex) : null
  const brandText = textHex ? hexToHsl(textHex) : primary
  const style: Record<string, string> = {}
  if (primary && primaryHex) {
    style['--primary'] = primary
    style['--primary-foreground'] = contrastForegroundHsl(primaryHex)
    style['--cb-brand'] = primary
  }
  if (secondary) style['--secondary'] = secondary
  if (brandText) style['--brand-text'] = brandText
  return style as CSSProperties
}

export function applyFirmBranding(branding?: Branding | null) {
  if (typeof window === 'undefined') return
  captureDefaults()
  const root = document.documentElement
  const vars = resolveFirmBrandingCssVars(branding) as Record<string, string>

  const setOrRestore = (prop: string, value: string | undefined, fallback: string | null) => {
    if (value) root.style.setProperty(prop, value)
    else if (fallback) root.style.setProperty(prop, fallback)
    else root.style.removeProperty(prop)
  }

  setOrRestore('--primary', vars['--primary'], defaultPrimary)
  setOrRestore('--primary-foreground', vars['--primary-foreground'], defaultPrimaryForeground)
  setOrRestore('--secondary', vars['--secondary'], defaultSecondary)
  setOrRestore('--cb-brand', vars['--cb-brand'], defaultCbBrand)
  setOrRestore('--brand-text', vars['--brand-text'], defaultBrandText)
}

export function normalizeFirmBranding(input?: Branding | null) {
  return {
    primaryColor: input?.primaryColor ? normalizeHex(input.primaryColor) : null,
    secondaryColor: input?.secondaryColor ? normalizeHex(input.secondaryColor) : null,
    textColor: input?.textColor ? normalizeHex(input.textColor) : null,
  }
}
