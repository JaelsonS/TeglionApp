import type { PublicSiteConfig, PublicSiteLogoSource } from '@/shared/types/firmPublicSite'

function sourceOf(value: PublicSiteLogoSource | undefined, fallback: PublicSiteLogoSource): PublicSiteLogoSource {
  return value === 'custom' || value === 'none' || value === 'firm' ? value : fallback
}

function inferLegacySource(theme: PublicSiteConfig['theme'], zone: 'header' | 'hero'): PublicSiteLogoSource {
  const explicit = zone === 'header' ? theme.headerLogoSource : theme.heroLogoSource
  if (explicit) return sourceOf(explicit, 'firm')
  const zoneKey = zone === 'header' ? theme.headerLogoStorageKey : theme.heroLogoStorageKey
  if (zoneKey || theme.logoStorageKey) return 'custom'
  return 'firm'
}

function customPreviewUrl(theme: PublicSiteConfig['theme'], zone: 'header' | 'hero'): string | null {
  if (zone === 'header') {
    return theme.headerLogoUrl ?? (theme.logoStorageKey ? theme.logoUrl ?? null : null)
  }
  return theme.heroLogoUrl ?? (theme.logoStorageKey ? theme.logoUrl ?? null : null)
}

export function resolvePublicSitePreviewZoneLogoUrl(
  draft: PublicSiteConfig,
  zone: 'header' | 'hero',
  firmLogoUrl: string | null | undefined,
): string | null {
  const source = inferLegacySource(draft.theme, zone)
  if (source === 'none') return null
  if (source === 'custom') return customPreviewUrl(draft.theme, zone)
  return firmLogoUrl ?? null
}

/** @deprecated Preferir resolvePublicSitePreviewZoneLogoUrl */
export function resolvePublicSitePreviewLogoUrl(
  draft: PublicSiteConfig,
  firmLogoUrl: string | null | undefined,
): string | null {
  return resolvePublicSitePreviewZoneLogoUrl(draft, 'header', firmLogoUrl)
}
