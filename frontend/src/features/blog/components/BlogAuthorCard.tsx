import type { BlogPostMeta } from '@/content/blog/types'

type Props = {
  post: BlogPostMeta
}

function formatBlogDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function BlogAuthorCard({ post }: Props) {
  const initials = (post.author || 'TL')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')

  return (
    <aside className="blog-rail-card blog-author-card" aria-label="Autor">
      <div className="blog-author-row">
        <span className="blog-author-avatar" aria-hidden>
          {initials || 'TL'}
        </span>
        <div>
          <p className="blog-rail-title" itemProp="author" itemScope itemType="https://schema.org/Person">
            <span itemProp="name">{post.author}</span>
          </p>
          <p className="blog-rail-text">{post.authorRole || 'Equipa editorial · Fiscalidade portuguesa'}</p>
        </div>
      </div>
      <p className="mt-3 text-xs blog-text-muted">
        Publicado{' '}
        <time dateTime={post.publishedAt} itemProp="datePublished">
          {formatBlogDate(post.publishedAt)}
        </time>
        {post.updatedAt !== post.publishedAt ? (
          <>
            {' '}
            · Última revisão{' '}
            <time dateTime={post.updatedAt} itemProp="dateModified">
              {formatBlogDate(post.updatedAt)}
            </time>
          </>
        ) : null}
      </p>
    </aside>
  )
}
