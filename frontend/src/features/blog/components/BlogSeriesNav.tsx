import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { blogPostUrl } from '@/content/blog/blog-paths'
import type { BlogPostMeta } from '@/content/blog/types'

export function BlogSeriesNav({ post }: { post: BlogPostMeta }) {
  const [seriesPosts, setSeriesPosts] = useState<BlogPostMeta[]>([])

  useEffect(() => {
    if (!post.series) return
    let cancelled = false
    void import('@/content/blog').then(({ getSeriesPosts }) => {
      if (!cancelled) setSeriesPosts(getSeriesPosts(post.series!.id))
    })
    return () => {
      cancelled = true
    }
  }, [post.series])

  if (!post.series) return null
  if (seriesPosts.length < 2) return null

  const currentIdx = seriesPosts.findIndex((p) => p.slug === post.slug)
  const prev = currentIdx > 0 ? seriesPosts[currentIdx - 1] : null
  const next = currentIdx < seriesPosts.length - 1 ? seriesPosts[currentIdx + 1] : null

  return (
    <nav className="blog-series-nav" aria-label={`Série: ${post.series.title}`}>
      <p className="blog-series-nav-label">
        Série · Parte {post.series.part} de {post.series.totalParts}
      </p>
      <p className="blog-series-nav-title">{post.series.title}</p>
      <div className="blog-series-nav-links">
        {prev ? (
          <Link to={blogPostUrl(prev.slug)} className="blog-series-nav-prev">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={blogPostUrl(next.slug)} className="blog-series-nav-next">
            {next.title} →
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
