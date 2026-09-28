import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'

/** URL de logótipo para o preview do editor (override da página pública → Definições). */
export function resolvePublicSitePreviewLogoUrl(
  draft: PublicSiteConfig,
  firmLogoUrl: string | null | undefined,
): string | null {
  if (draft.theme.logoStorageKey) {
    return draft.theme.logoUrl ?? null
  }
  return firmLogoUrl ?? null
}
