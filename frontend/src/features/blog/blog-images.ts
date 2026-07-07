/** URL optimizada para imagens Unsplash no blog. */
export function blogImageUrl(src: string, width = 960, height = 540): string {
  if (!src.includes('images.unsplash.com')) return src

  try {
    const url = new URL(src)
    url.searchParams.set('w', String(width))
    url.searchParams.set('h', String(height))
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('q', '75')
    url.searchParams.set('auto', 'format')
    return url.toString()
  } catch {
    return src
  }
}

/** Miniaturas nos cards do índice. */
export function blogCardImageUrl(src: string): string {
  return blogImageUrl(src, 640, 400)
}

/** Capa LCP mobile — ficheiro mais pequeno para PageSpeed. */
export function blogCoverLcpUrl(src: string): string {
  return blogImageUrl(src, 640, 336)
}

export const BLOG_COVER_WIDTHS = [640, 960, 1200] as const

export function blogCoverSrcSet(src: string): string {
  return BLOG_COVER_WIDTHS.map((w) => {
    const h = Math.round((w * 630) / 1200)
    return `${blogImageUrl(src, w, h)} ${w}w`
  }).join(', ')
}

export const BLOG_IMAGE_FALLBACK_UNSPLASH =
  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=630&fit=crop&q=80&auto=format'

/** Fallback local — sempre disponível em produção. */
export const BLOG_IMAGE_FALLBACK = '/og/teglion-og.png'

export function resolveBlogImageOnError(current: string): string {
  if (current === BLOG_IMAGE_FALLBACK) return current
  if (current !== BLOG_IMAGE_FALLBACK_UNSPLASH) return BLOG_IMAGE_FALLBACK_UNSPLASH
  return BLOG_IMAGE_FALLBACK
}
