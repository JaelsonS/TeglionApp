import { enrichPost } from '@/content/blog/enrich'
import type { BlogPost } from '@/content/blog/types'

const postModules = import.meta.glob<Record<string, BlogPost>>('./posts/*.ts')

function slugFromModulePath(path: string) {
  return path.match(/\/posts\/(.+)\.ts$/)?.[1] ?? ''
}

const postCache = new Map<string, BlogPost>()

export async function loadBlogPost(slug: string): Promise<BlogPost | undefined> {
  const cached = postCache.get(slug)
  if (cached) return cached

  const entry = Object.entries(postModules).find(([path]) => slugFromModulePath(path) === slug)
  if (!entry) return undefined

  const mod = await entry[1]()
  const post = Object.values(mod).find(
    (value): value is BlogPost =>
      typeof value === 'object' && value !== null && 'slug' in value && value.slug === slug,
  )
  if (!post) return undefined

  const enriched = enrichPost(post)
  postCache.set(slug, enriched)
  return enriched
}
