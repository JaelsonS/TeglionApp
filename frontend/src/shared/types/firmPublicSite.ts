/**
 * v9 — Website + Booking Builder (ver plan file da sessão). Espelha, campo a
 * campo, o esquema normalizado por `firm-public-site.service.js`
 * (backend) — qualquer mudança de forma tem de acontecer nos dois lados.
 */

export type PublicSiteSectionType =
  | 'header'
  | 'hero'
  | 'about'
  | 'services'
  | 'bookingServices'
  | 'features'
  | 'process'
  | 'faq'
  | 'contact'
  | 'footer'

export type PublicSiteCtaTargetType = 'booking' | 'whatsapp' | 'service-detail' | 'contact-form' | 'external-url'

export type PublicSiteCta = {
  id: string
  label: string
  style: 'primary' | 'secondary'
  target: {
    type: PublicSiteCtaTargetType
    serviceId?: string
    url?: string
  }
}

export type PublicSiteImageRef = {
  id: string
  storageKey: string
  alt: string
  /** Resolvido pelo backend em cada leitura (URL assinada, nunca persistida) — ausente antes da primeira leitura. */
  url?: string | null
}

export type PublicSiteFaqItem = {
  id: string
  question: string
  answer: string
}

export type PublicSiteFeatureItem = {
  id: string
  title: string
  description: string
}

export type PublicSiteProcessStep = {
  id: string
  title: string
  description: string
}

export type PublicSiteHeroContent = {
  tagline: string
  bio: string
  imageIds: string[]
  ctas: PublicSiteCta[]
}

export type PublicSiteAboutContent = {
  heading: string
  body: string
  imageIds: string[]
}

export type PublicSiteServicesContent = {
  heading: string
  mode: 'auto'
}

export type PublicSiteFeaturesContent = { items: PublicSiteFeatureItem[] }
export type PublicSiteProcessContent = { steps: PublicSiteProcessStep[] }
export type PublicSiteFaqContent = { items: PublicSiteFaqItem[] }
export type PublicSiteContactContent = { showEmail: boolean; showPhone: boolean; showAddress: boolean }
export type PublicSiteEmptyContent = Record<string, never>

type PublicSiteSectionBase = { key: string; enabled: boolean; order: number }

/** União discriminada por `type` — deixa o TypeScript estreitar `content`
 * automaticamente num `switch(section.type)`, sem casts. */
export type PublicSiteSection =
  | (PublicSiteSectionBase & { type: 'header'; content: PublicSiteEmptyContent })
  | (PublicSiteSectionBase & { type: 'hero'; content: PublicSiteHeroContent })
  | (PublicSiteSectionBase & { type: 'about'; content: PublicSiteAboutContent })
  | (PublicSiteSectionBase & { type: 'services'; content: PublicSiteServicesContent })
  | (PublicSiteSectionBase & { type: 'bookingServices'; content: PublicSiteServicesContent })
  | (PublicSiteSectionBase & { type: 'features'; content: PublicSiteFeaturesContent })
  | (PublicSiteSectionBase & { type: 'process'; content: PublicSiteProcessContent })
  | (PublicSiteSectionBase & { type: 'faq'; content: PublicSiteFaqContent })
  | (PublicSiteSectionBase & { type: 'contact'; content: PublicSiteContactContent })
  | (PublicSiteSectionBase & { type: 'footer'; content: PublicSiteEmptyContent })

export type PublicSiteSocialLinks = {
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  whatsapp: string | null
  website: string | null
}

export type PublicSiteConfig = {
  schemaVersion: number
  seo: { title: string | null; description: string | null; ogImage: PublicSiteImageRef | null }
  theme: {
    primaryColor: string | null
    secondaryColor: string | null
    /** Cor dos textos de destaque (tagline, preços). Se vazia, usa a principal. */
    textColor: string | null
    logoStorageKey: string | null
  }
  images: { hero: PublicSiteImageRef[]; institutional: PublicSiteImageRef[] }
  socialLinks: PublicSiteSocialLinks
  sections: PublicSiteSection[]
  /** Quando false, esconde preços na página pública. Default true. */
  showPrices?: boolean
  termsText?: string | null
  privacyText?: string | null
  /** Link oficial para o Livro de Reclamações Electrónico. */
  complaintsBookUrl?: string | null
  /** Texto do link do Livro de Reclamações. */
  complaintsBookLabel?: string | null
  /** Link de elogios / avaliações (ex.: Google Reviews). */
  praiseUrl?: string | null
  /** Texto do link de elogios. */
  praiseLabel?: string | null
  /**
   * @deprecated Preferir praiseUrl. Mantido para compatibilidade com rascunhos antigos.
   */
  praiseContact?: string | null
}

export type FirmPublicSiteBundle = {
  firmId?: string
  templateKey: string
  schemaVersion?: number
  draft: PublicSiteConfig
  published: PublicSiteConfig | null
  publishedAt?: string | null
  previewToken?: string | null
  previewTokenExpiresAt?: string | null
  draftUpdatedAt?: string | null
}
