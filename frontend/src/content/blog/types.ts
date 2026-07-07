export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string; id?: string }
  | { type: 'h3'; text: string; id?: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'image'; src: string; alt: string; caption?: string; width?: number; height?: number }
  | { type: 'callout'; variant: 'tip' | 'info' | 'warning' | 'legal'; title?: string; text: string }
  | { type: 'link'; label: string; slug: string }
  | {
      type: 'faq'
      id?: string
      heading?: string
      items: { question: string; answer: string }[]
    }
  | {
      type: 'affiliate'
      leadIn?: string
      title: string
      description: string
      href: string
      affiliateComment?: string
      image?: { src: string; alt: string }
      ctaLabel?: string
    }
  | {
      type: 'internalLinks'
      title: string
      intro?: string
      slugs: string[]
    }
  | {
      type: 'teglionCta'
      variant: 'firm' | 'client'
      title?: string
      text?: string
    }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'keyTakeaways'; title?: string; items: string[] }
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { type: 'divider' }

export type BlogSeriesMeta = {
  id: string
  title: string
  description: string
  part: number
  totalParts: number
}

export type BlogPostMeta = {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  updatedAt: string
  author: string
  category: string
  tags: string[]
  readMinutes: number
  coverImage: { src: string; alt: string; width?: number; height?: number }
  seo: {
    title: string
    description: string
    keywords: string[]
  }
  relatedSlugs: string[]
  /** Artigo em destaque no índice do blog */
  featured?: boolean
  /** Agrupa artigos numa série (ex.: guia do independente) */
  series?: BlogSeriesMeta
}

export type BlogPost = BlogPostMeta & {
  blocks: BlogBlock[]
}
