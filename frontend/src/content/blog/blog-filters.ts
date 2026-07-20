import type { BlogAudience, BlogPostMeta } from '@/content/blog/types'
import { BLOG_POSTS } from '@/content/blog'

export const BLOG_AUDIENCE_FILTERS: Array<{ id: 'todos' | BlogAudience; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'independente', label: 'Independentes' },
  { id: 'escritorio', label: 'Escritórios' },
  { id: 'pme', label: 'PME / Lda' },
  { id: 'estudante', label: 'Estudantes' },
]

export function postMatchesAudience(post: BlogPostMeta, audience: 'todos' | BlogAudience): boolean {
  if (audience === 'todos') return true
  const list = post.audience
  if (!list?.length) {
    // fallback por categoria para posts antigos sem campo
    if (audience === 'escritorio') return post.category === 'Escritórios'
    if (audience === 'estudante') return post.category === 'Estudantes'
    if (audience === 'pme') return /empresa|lda|sociedade|pme|irc/i.test(`${post.title} ${post.tags.join(' ')}`)
    return true
  }
  return list.includes(audience)
}

export function searchBlogPosts(query: string, posts: BlogPostMeta[] = BLOG_POSTS): BlogPostMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return posts
  const tokens = q.split(/\s+/).filter(Boolean)
  return posts.filter((post) => {
    const hay = `${post.title} ${post.excerpt} ${post.category} ${post.tags.join(' ')} ${post.seo?.description || ''}`.toLowerCase()
    return tokens.every((t) => hay.includes(t))
  })
}

export function filterBlogPosts(input: {
  category?: string
  audience?: 'todos' | BlogAudience
  q?: string
}): BlogPostMeta[] {
  let list = BLOG_POSTS
  if (input.category && input.category !== 'todos') {
    list = list.filter((p) => p.category === input.category)
  }
  if (input.audience && input.audience !== 'todos') {
    list = list.filter((p) => postMatchesAudience(p, input.audience!))
  }
  if (input.q?.trim()) {
    list = searchBlogPosts(input.q, list)
  }
  return list
}

export function resolvePostAudience(post: BlogPostMeta): BlogAudience {
  if (post.audience?.includes('escritorio') && !post.audience.includes('independente')) return 'escritorio'
  if (post.audience?.includes('estudante')) return 'estudante'
  if (post.audience?.includes('pme') && !post.audience.includes('independente')) return 'pme'
  if (post.audience?.includes('escritorio')) return 'escritorio'
  if (post.audience?.includes('pme')) return 'pme'
  return 'independente'
}
