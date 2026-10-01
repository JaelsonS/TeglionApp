import type { PublicSiteChromeContent, PublicSiteConfig } from '@/shared/types/firmPublicSite'

export type PublicSiteContactFields = {
  email: string | null
  phone: string | null
  address: string | null
}

function pickOverride(value: string | null | undefined): string | null {
  const v = String(value ?? '').trim()
  return v || null
}

/**
 * Contactos na página pública: overrides guardados na secção rodapé (editados em Contactos)
 * substituem Definições → Escritório quando preenchidos.
 */
export function resolvePublicSiteContact(
  firmContact: PublicSiteContactFields,
  footerContent?: PublicSiteChromeContent | null,
): PublicSiteContactFields {
  return {
    email: pickOverride(footerContent?.email) ?? firmContact.email ?? null,
    phone: pickOverride(footerContent?.phone) ?? firmContact.phone ?? null,
    address: pickOverride(footerContent?.address) ?? firmContact.address ?? null,
  }
}

export function findEnabledFooterContent(config: PublicSiteConfig): PublicSiteChromeContent | undefined {
  const section = config.sections.find((s) => s.type === 'footer' && s.enabled)
  return section?.type === 'footer' ? section.content : undefined
}
