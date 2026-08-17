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

export type PublicSiteCtaTargetType =
  | 'booking'
  | 'whatsapp'
  | 'service-detail'
  | 'contact-form'
  | 'external-url'
  | 'phone'

export type PublicSiteCta = {
  id: string
  label: string
  style: 'primary' | 'secondary'
  /** Cor de fundo do botão (hex). Se vazia, usa o estilo primary/secondary. */
  backgroundColor?: string | null
  /** Cor do texto do botão (hex). */
  textColor?: string | null
  target: {
    type: PublicSiteCtaTargetType
    serviceId?: string
    url?: string
    phone?: string
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
  /**
   * Título principal (H1) no destaque.
   * Vazio → cai no nome público do escritório (`displayName` / `firm.name`).
   * Pode diferir do texto do cabeçalho (`header.title`).
   */
  title?: string
  tagline: string
  bio: string
  imageIds: string[]
  ctas: PublicSiteCta[]
  /** Fundo da zona hero (quando não há foto, ou por baixo/junto da foto). */
  backgroundColor?: string | null
  /** Cor do título (H1) no hero. */
  titleColor?: string | null
  /** Cor da frase de destaque. */
  taglineColor?: string | null
  /** Cor do texto «Sobre o escritório» no hero. */
  bioColor?: string | null
  /**
   * Enquadramento da foto de capa. Ausente = `cover` (páginas já publicadas).
   * `cover` = Preencher a faixa 16:9. `contain` = Mostrar a imagem inteira.
   */
  imageFit?: 'cover' | 'contain' | null
  /**
   * Foco vertical quando `imageFit` é `cover`. Ausente = `center`.
   */
  imagePosition?: 'center' | 'top' | 'bottom' | null
}

export type PublicSiteAboutContent = {
  heading: string
  body: string
  imageIds: string[]
  ctas?: PublicSiteCta[]
  backgroundColor?: string | null
  headingColor?: string | null
  bodyColor?: string | null
}

export type PublicSiteServicesContent = {
  heading: string
  mode: 'auto'
  ctas?: PublicSiteCta[]
  backgroundColor?: string | null
  headingColor?: string | null
}

export type PublicSiteFeaturesContent = {
  items: PublicSiteFeatureItem[]
  backgroundColor?: string | null
  titleColor?: string | null
  textColor?: string | null
}
export type PublicSiteProcessContent = {
  steps: PublicSiteProcessStep[]
  backgroundColor?: string | null
  titleColor?: string | null
  textColor?: string | null
}
export type PublicSiteFaqContent = {
  items: PublicSiteFaqItem[]
  backgroundColor?: string | null
  titleColor?: string | null
  textColor?: string | null
}
export type PublicSiteContactContent = {
  showEmail: boolean
  showPhone: boolean
  showAddress: boolean
  ctas?: PublicSiteCta[]
  backgroundColor?: string | null
  textColor?: string | null
}

/**
 * Cabeçalho / rodapé.
 * Cores + texto opcional no cabeçalho (no rodapé o texto continua a ser o nome legal/público).
 */
export type PublicSiteNavLinkKind = 'section' | 'areas' | 'service' | 'external'

/** Âncoras da própria página pública (rolar até à secção). */
export type PublicSiteNavSectionId =
  | 'servicos'
  | 'outros-servicos'
  | 'contactos'
  | 'sobre'
  | 'faq'
  | 'como-trabalhamos'
  | 'destaques'

export type PublicSiteNavLink = {
  id: string
  label: string
  enabled: boolean
  kind: PublicSiteNavLinkKind
  /** kind=section — id da secção nesta página. */
  sectionId?: PublicSiteNavSectionId
  /** kind=external — só https. */
  url?: string
  /** kind=service — slug do serviço público. */
  serviceId?: string
}

export type PublicSiteChromeContent = {
  /**
   * Texto à esquerda no cabeçalho (marca curta).
   * Vazio → cai no nome público do escritório.
   * Independente do H1 do hero (`hero.title`).
   */
  title?: string
  backgroundColor?: string | null
  textColor?: string | null
  /** Menu na barra. Omissão = visível. */
  showNav?: boolean
  /** Links editáveis (texto + destino). Se vazio, usa os três atalhos abaixo. */
  navLinks?: PublicSiteNavLink[]
  /** Compat: páginas já publicadas sem `navLinks`. */
  showServicesLink?: boolean
  showAreasMenu?: boolean
  showContactLink?: boolean
}

export type PublicSiteEmptyContent = PublicSiteChromeContent

type PublicSiteSectionBase = { key: string; enabled: boolean; order: number }

/** União discriminada por `type` — deixa o TypeScript estreitar `content`
 * automaticamente num `switch(section.type)`, sem casts. */
export type PublicSiteSection =
  | (PublicSiteSectionBase & { type: 'header'; content: PublicSiteChromeContent })
  | (PublicSiteSectionBase & { type: 'hero'; content: PublicSiteHeroContent })
  | (PublicSiteSectionBase & { type: 'about'; content: PublicSiteAboutContent })
  | (PublicSiteSectionBase & { type: 'services'; content: PublicSiteServicesContent })
  | (PublicSiteSectionBase & { type: 'bookingServices'; content: PublicSiteServicesContent })
  | (PublicSiteSectionBase & { type: 'features'; content: PublicSiteFeaturesContent })
  | (PublicSiteSectionBase & { type: 'process'; content: PublicSiteProcessContent })
  | (PublicSiteSectionBase & { type: 'faq'; content: PublicSiteFaqContent })
  | (PublicSiteSectionBase & { type: 'contact'; content: PublicSiteContactContent })
  | (PublicSiteSectionBase & { type: 'footer'; content: PublicSiteChromeContent })

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
    /** @deprecated Preferir cores por secção/botão. Mantido para compatibilidade e branding do portal. */
    primaryColor: string | null
    /** @deprecated Preferir cores por botão secundário. */
    secondaryColor: string | null
    /** @deprecated Preferir cores por título/frase. */
    textColor: string | null
    /** Fundo geral da página. */
    backgroundColor: string | null
    /** Fundo de cartões e painéis. */
    surfaceColor: string | null
    /** Descrições e texto auxiliar (fallback). */
    mutedTextColor: string | null
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
