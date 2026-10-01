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
 * Contactos na página pública: cada campo do rodapé (se preenchido) substitui
 * o valor de Definições → Escritório. Campos vazios no rodapé herdam o escritório.
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
