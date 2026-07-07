import type { BlogPost } from '@/content/blog/types'

export const BLOG_POST_DATA_ID = 'blog-post-data'

/** Lê o artigo embutido no HTML estático (prerender) — evita flash de loading e melhora LCP. */
export function readPrerenderedBlogPost(slug: string): BlogPost | undefined {
  if (typeof document === 'undefined' || !slug) return undefined

  const el = document.getElementById(BLOG_POST_DATA_ID)
  if (!el?.textContent) return undefined

  try {
    const data = JSON.parse(el.textContent) as BlogPost
    if (data.slug === slug) return data
  } catch {
    // HTML antigo sem payload — carrega via import dinâmico
  }

  return undefined
}
