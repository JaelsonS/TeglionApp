import { BlogResponsiveImage } from '@/features/blog/components/BlogResponsiveImage'
import { BlogShareButtons } from '@/features/blog/components/BlogShareButtons'
import { toBlogSharePayload } from '@/features/blog/blogSharePayload'
import { blogPostUrl } from '@/content/blog/blog-paths'
import type { BlogPostMeta } from '@/content/blog/types'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'

type Props = {
  post: BlogPostMeta
  featured?: boolean
  wide?: boolean
}

export function BlogCard({ post, featured = false, wide = false }: Props) {
  const tags = post.tags.slice(0, 4)

  return (
    <article className={cn('blog-card-shell', wide && 'blog-card-shell--wide')}>
      <Link to={blogPostUrl(post.slug)} className={cn('blog-card h-full', wide && 'blog-card--wide')}>
        <div className={cn('relative', wide && 'blog-card-wide-media')}>
          <BlogResponsiveImage
            src={post.coverImage.src}
            alt={post.coverImage.alt}
            className={cn('w-full object-cover', wide ? 'aspect-[16/9] sm:aspect-[21/10]' : 'aspect-[16/10]')}
            width={wide ? 1200 : 640}
            height={wide ? 630 : 400}
            sizes={
              wide
                ? '(max-width: 768px) 100vw, 70vw'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
          />
          {featured || post.featured ? (
            <span className="blog-card-badge">Destaque</span>
          ) : post.series ? (
            <span className="blog-card-badge blog-card-badge-series">
              Parte {post.series.part}/{post.series.totalParts}
            </span>
          ) : null}
        </div>
        <div className={cn('flex flex-1 flex-col p-4', wide && 'sm:p-6 sm:justify-center')}>
          <p className="text-xs font-semibold uppercase tracking-wide blog-text-gold">{post.category}</p>
          <h2
            className={cn(
              'mt-2 font-semibold leading-snug blog-text-navy',
              wide ? 'text-xl sm:text-2xl blog-display' : 'text-lg',
            )}
          >
            {post.title}
          </h2>
          <p className={cn('mt-2 flex-1 text-sm blog-text-body', wide ? 'line-clamp-5 sm:text-base' : 'line-clamp-4')}>
            {post.excerpt}
          </p>
          <p className="mt-3 text-xs blog-text-body">
            {post.readMinutes} min · {formatDate(post.publishedAt)}
            {post.updatedAt !== post.publishedAt ? ` · Revisto ${formatDate(post.updatedAt)}` : ''}
          </p>
        </div>
      </Link>
      {tags.length > 0 ? (
        <div className="blog-card-tags" aria-label="Etiquetas">
          {tags.map((t) => (
            <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`} className="blog-tag-chip">
              {t}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="blog-card-share-row">
        <BlogShareButtons compact post={toBlogSharePayload(post)} />
      </div>
    </article>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(iso),
    )
  } catch {
    return iso
  }
}
