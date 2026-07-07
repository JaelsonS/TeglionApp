import { useEffect, useState } from 'react'

import { BlogCard } from '@/features/blog/components/BlogCard'
import type { BlogPostMeta } from '@/content/blog/types'

type Props = {
  slug: string
}

export function BlogRelatedPosts({ slug }: Props) {
  const [related, setRelated] = useState<BlogPostMeta[]>([])

  useEffect(() => {
    let cancelled = false
    void import('@/content/blog').then(({ getRelatedPosts }) => {
      if (!cancelled) setRelated(getRelatedPosts(slug, 6))
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (related.length === 0) return null

  return (
    <section className="blog-container blog-defer-section mt-16" aria-labelledby="related-posts">
      <h2 id="related-posts" className="text-xl font-semibold blog-text-navy">
        Continuar a ler
      </h2>
      <p className="mt-1 text-sm blog-text-body">Artigos relacionados por tema e etiquetas.</p>
      <div className="blog-card-grid mt-6">
        {related.map((r) => (
          <BlogCard key={r.slug} post={r} />
        ))}
      </div>
    </section>
  )
}
