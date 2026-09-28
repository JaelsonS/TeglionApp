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

export type PublicSiteLogoSource = 'firm' | 'custom' | 'none'

export type PublicSiteSectionMediaFields = {
  showImage?: boolean
  imagePlacement?: 'above' | 'left' | 'right'
  imageSize?: 'sm' | 'md' | 'lg' | 'full'
  imageFit?: 'cover' | 'contain'
  /** Enquadramento fino da imagem de conteúdo (arrastar + zoom no editor). */
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
  backgroundImageId?: string | null
  showBackgroundImage?: boolean
  /** Enquadramento da imagem de fundo suave da secção. */
  backgroundImageFocusX?: number | null
  backgroundImageFocusY?: number | null
  backgroundImageZoom?: number | null
  /** Alinhamento do bloco de texto (e CTAs) na secção. */
  contentAlign?: 'left' | 'center' | 'right' | null
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
   * Imagem de fundo do destaque (atrás do texto). `cover` = preencher; `contain` = mostrar inteira.
   */
  imageFit?: 'cover' | 'contain' | null
  /**
   * Ponto de foco / reposicionamento (9 posições). Valores antigos `top`/`center`/`bottom` mantêm-se.
   */
  imagePosition?:
    | 'top-left'
    | 'top'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom'
    | 'bottom-right'
    | null
  /** Enquadramento fino (arrastar no editor) — mesma lógica dos serviços. */
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
  /** Escurece o fundo (0–80) para legibilidade do texto por cima da foto. */
  backgroundOverlay?: number | null
  /** Omissão = mostrar logótipo no destaque quando existir URL. */
  showLogo?: boolean
} & PublicSiteSectionMediaFields

export type PublicSiteAboutContent = {
  heading: string
  body: string
  imageIds: string[]
  ctas?: PublicSiteCta[]
  backgroundColor?: string | null
  headingColor?: string | null
  bodyColor?: string | null
} & PublicSiteSectionMediaFields

export type PublicSiteServicesContent = {
  heading: string
  mode: 'auto'
  imageIds?: string[]
  ctas?: PublicSiteCta[]
  backgroundColor?: string | null
  headingColor?: string | null
  /** Título do bloco de cartões em destaque (ex.: «Destaques»). */
  featuredHeading?: string | null
  /** Slugs de ofertas principais — cartões grandes com opções visíveis (máx. 6). */
  featuredServiceSlugs?: string[] | null
} & PublicSiteSectionMediaFields

export type PublicSiteFeaturesContent = {
  items: PublicSiteFeatureItem[]
  imageIds?: string[]
  backgroundColor?: string | null
  titleColor?: string | null
  textColor?: string | null
} & PublicSiteSectionMediaFields
export type PublicSiteProcessContent = {
  steps: PublicSiteProcessStep[]
  imageIds?: string[]
  backgroundColor?: string | null
  titleColor?: string | null
  textColor?: string | null
} & PublicSiteSectionMediaFields
export type PublicSiteFaqContent = {
  items: PublicSiteFaqItem[]
  imageIds?: string[]
  backgroundColor?: string | null
  titleColor?: string | null
  textColor?: string | null
} & PublicSiteSectionMediaFields
export type PublicSiteContactContent = {
  showEmail: boolean
  showPhone: boolean
  showAddress: boolean
  imageIds?: string[]
  ctas?: PublicSiteCta[]
  backgroundColor?: string | null
  textColor?: string | null
} & PublicSiteSectionMediaFields

/**
 * Cabeçalho / rodapé.
 * Cores + texto opcional no cabeçalho.
 * No rodapé: cores + contactos próprios (independentes do Escritório).
 * Campos de contacto vazios/null → herdam os dados do Escritório só na leitura pública.
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
  /**
   * Contactos do rodapé (opcionais). Vazios → usam Definições → Escritório na página pública.
   * Não alteram nem são sobrescritos pelos dados do escritório depois de gravados.
   */
  email?: string | null
  phone?: string | null
  address?: string | null
  /** Omissão = mostrar logótipo na barra quando existir URL. */
  showLogo?: boolean
}

export type PublicSiteEmptyContent = PublicSiteChromeContent

type PublicSiteSectionBase = {
  key: string
  enabled: boolean
  order: number
  /**
   * Secção criada pela contabilista («Adicionar secção»).
   * As de modelo (`custom` ausente/false) não podem ser apagadas — só desactivadas.
   */
  custom?: boolean
}

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
    headerLogoSource?: PublicSiteLogoSource
    heroLogoSource?: PublicSiteLogoSource
    logoStorageKey: string | null
    headerLogoStorageKey?: string | null
    heroLogoStorageKey?: string | null
    /** Resolvido pelo backend (URL assinada; nunca persistir). */
    logoUrl?: string | null
    headerLogoUrl?: string | null
    heroLogoUrl?: string | null
  }
  images: {
    hero: PublicSiteImageRef[]
    institutional: PublicSiteImageRef[]
    bySection?: Record<string, PublicSiteImageRef[]>
  }
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
