import catalog from '@/content/blog/catalog.json'
import { BLOG_READING_PATHS } from '@/content/blog/blog-graph'
import type { BlogPostMeta } from '@/content/blog/types'

export { BLOG_BASE_PATH, blogPostUrl } from '@/content/blog/blog-paths'

export const BLOG_POSTS: BlogPostMeta[] = catalog as BlogPostMeta[]

const bySlug = new Map(BLOG_POSTS.map((p) => [p.slug, p]))

/** Metadados do artigo (índice, cards, links internos). */
export function getBlogPost(slug: string): BlogPostMeta | undefined {
  return bySlug.get(slug)
}

/** Artigo completo com blocos — carregamento lazy por slug (só no browser). */
export { fetchBlogPost } from '@/content/blog/blog-post-api'

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug)
}

export function getRelatedPosts(slug: string, limit = 6): BlogPostMeta[] {
  const post = getBlogPost(slug)
  if (!post) return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, limit)

  const scored = BLOG_POSTS.filter((p) => p.slug !== slug)
    .map((candidate) => {
      let score = 0
      if (post.relatedSlugs.includes(candidate.slug)) score += 12
      if (candidate.relatedSlugs.includes(post.slug)) score += 8
      const tagOverlap = candidate.tags.filter((t) => post.tags.includes(t)).length
      score += tagOverlap * 4
      if (candidate.category === post.category) score += 3
      if (post.series?.id && candidate.series?.id === post.series.id) score += 20
      return { post: candidate, score }
    })
    .sort((a, b) => b.score - a.score || b.post.readMinutes - a.post.readMinutes)

  const picked = scored.filter((s) => s.score > 0).map((s) => s.post)
  if (picked.length >= limit) return picked.slice(0, limit)

  const rest = BLOG_POSTS.filter(
    (p) => p.slug !== slug && !picked.some((r) => r.slug === p.slug),
  )
  return [...picked, ...rest].slice(0, limit)
}

export function getFeaturedPosts(limit = 3): BlogPostMeta[] {
  const featured = BLOG_POSTS.filter((p) => p.featured)
  if (featured.length >= limit) return featured.slice(0, limit)
  return [...featured, ...BLOG_POSTS.filter((p) => !p.featured)].slice(0, limit)
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  if (!category || category === 'todos') return BLOG_POSTS
  return BLOG_POSTS.filter((p) => p.category === category)
}

export function getSeriesPosts(seriesId: string): BlogPostMeta[] {
  return BLOG_POSTS.filter((p) => p.series?.id === seriesId).sort(
    (a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0),
  )
}

export function getReadingPathsForSlug(slug: string) {
  return BLOG_READING_PATHS.filter((path) => path.slugs.includes(slug))
}

export { BLOG_READING_PATHS } from '@/content/blog/blog-graph'
