import type { BlogPostMeta } from '@/content/blog/types'
import type { BlogSharePayload } from '@/features/blog/components/blogShare'

export function toBlogSharePayload(post: Pick<BlogPostMeta, 'slug' | 'title' | 'excerpt'>): BlogSharePayload {
  return { slug: post.slug, title: post.title, excerpt: post.excerpt }
}
