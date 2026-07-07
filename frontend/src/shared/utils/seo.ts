import { BRAND } from '@/shared/config/brand'

/** Imagem OG padrão 1200×630 para partilha social. */
export const DEFAULT_OG_IMAGE = `${BRAND.url}/og/teglion-og.png`

export type PageSeoInput = {
  title: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
}

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

/** Actualiza title + meta OG/Twitter para páginas públicas. */
export function applyPageSeo({ title, description, path = '', image, type = 'website' }: PageSeoInput) {
  const url = `${BRAND.url}${path.startsWith('/') ? path : path ? `/${path}` : ''}`
  const ogImage = image || DEFAULT_OG_IMAGE

  document.title = title
  if (description) upsertMeta('description', description)
  upsertMeta('og:site_name', BRAND.name, 'property')
  upsertMeta('og:title', title, 'property')
  if (description) upsertMeta('og:description', description, 'property')
  upsertMeta('og:url', url, 'property')
  upsertMeta('og:type', type, 'property')
  upsertMeta('og:image', ogImage, 'property')
  upsertMeta('og:locale', 'pt_PT', 'property')
  upsertMeta('twitter:card', 'summary_large_image')
  upsertMeta('twitter:title', title)
  if (description) upsertMeta('twitter:description', description)
  upsertMeta('twitter:image', ogImage)
  upsertLink('canonical', url)
}
