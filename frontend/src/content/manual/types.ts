/** Blocos tipados — sem HTML cru (evita XSS no Manual público). */
export type ManualBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; variant: 'tip' | 'info' | 'warning' | 'security'; title?: string; text: string }
  | { type: 'maya'; text: string }
  | {
      type: 'appLink'
      label: string
      /** Só caminhos internos allowlistados (ver `manual-links.ts`). */
      href: string
    }

export type ManualAudience = 'firm' | 'client' | 'both' | 'prospect'

export type ManualChapterMeta = {
  slug: string
  number: number
  title: string
  subtitle: string
  audience: ManualAudience
  /** Capítulos que ainda descrevem limites / futuro — honestidade Maya. */
  status: 'available' | 'partial' | 'planned'
}

export type ManualChapter = ManualChapterMeta & {
  seoDescription: string
  blocks: ManualBlock[]
}
