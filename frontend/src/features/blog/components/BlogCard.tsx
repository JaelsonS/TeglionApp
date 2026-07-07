import { BlogResponsiveImage } from '@/features/blog/components/BlogResponsiveImage'
import { BlogShareButtons } from '@/features/blog/components/BlogShareButtons'
import { toBlogSharePayload } from '@/features/blog/blogSharePayload'
import { blogPostUrl } from '@/content/blog/blog-paths'
import type { BlogPostMeta } from '@/content/blog/types'
import { Link } from 'react-router-dom'

export function BlogCard({ post, featured = false }: { post: BlogPostMeta; featured?: boolean }) {
  return (
    <article className="blog-card-shell">
      <Link to={blogPostUrl(post.slug)} className="blog-card h-full">
        <div className="relative">
          <BlogResponsiveImage
            src={post.coverImage.src}
            alt={post.coverImage.alt}
            className="aspect-[16/10] w-full object-cover"
            width={640}
            height={400}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {featured || post.featured ? (
            <span className="blog-card-badge">Destaque</span>
          ) : post.series ? (
            <span className="blog-card-badge blog-card-badge-series">
              Parte {post.series.part}/{post.series.totalParts}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs font-semibold uppercase tracking-wide blog-text-gold">{post.category}</p>
          <h2 className="mt-2 text-lg font-semibold leading-snug blog-text-navy">{post.title}</h2>
          <p className="mt-2 flex-1 text-sm blog-text-body line-clamp-3">{post.excerpt}</p>
          <p className="mt-3 text-xs blog-text-body">
            {post.readMinutes} min · {formatDate(post.publishedAt)}
          </p>
        </div>
      </Link>
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
