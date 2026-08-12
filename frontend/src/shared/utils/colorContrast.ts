/**
 * Derive readable foreground for a brand fill color (hex → HSL triple for CSS vars).
 */
export function hexToRelativeLuminance(hex: string): number | null {
  const raw = hex.trim().toLowerCase()
  const normalized =
    /^#[0-9a-f]{6}$/.test(raw)
      ? raw
      : /^#[0-9a-f]{3}$/.test(raw)
        ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
        : null
  if (!normalized) return null
  const toLinear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const r = toLinear(parseInt(normalized.slice(1, 3), 16))
  const g = toLinear(parseInt(normalized.slice(3, 5), 16))
  const b = toLinear(parseInt(normalized.slice(5, 7), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Light text on dark fills, dark text on light fills. */
export function contrastForegroundHsl(hex: string): string {
  const lum = hexToRelativeLuminance(hex)
  if (lum == null) return '0 0% 100%'
  return lum > 0.45 ? '222 47% 11%' : '0 0% 100%'
}
