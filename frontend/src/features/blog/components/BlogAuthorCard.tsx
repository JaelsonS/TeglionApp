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
  const name = post.author || 'Liliana Nunes'
  const role = post.authorRole || 'Revisão editorial TegLion · Guias de fiscalidade portuguesa'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')

  return (
    <aside className="blog-rail-card blog-author-card" aria-label="Autor">
      <div className="blog-author-row">
        <span className="blog-author-avatar" aria-hidden>
          {initials || 'LN'}
        </span>
        <div>
          <p className="blog-rail-title" itemProp="author" itemScope itemType="https://schema.org/Person">
            <span itemProp="name">{name}</span>
          </p>
          <p className="blog-rail-text">{role}</p>
        </div>
      </div>
      <p className="mt-3 text-xs blog-text-muted">
        Conteúdo educativo para Portugal. Não substitui aconselhamento de um contabilista certificado (OCC).
      </p>
      <p className="mt-2 text-xs blog-text-muted">
        Publicado{' '}
        <time dateTime={post.publishedAt} itemProp="datePublished">
          {formatBlogDate(post.publishedAt)}
        </time>
        {post.updatedAt !== post.publishedAt ? (
          <>
            {' '}
            · <strong className="font-semibold text-[var(--blog-navy)]">Última revisão</strong>{' '}
            <time dateTime={post.updatedAt} itemProp="dateModified">
              {formatBlogDate(post.updatedAt)}
            </time>
          </>
        ) : (
          <>
            {' '}
            · <strong className="font-semibold text-[var(--blog-navy)]">Última revisão</strong>{' '}
            <time dateTime={post.updatedAt}>{formatBlogDate(post.updatedAt)}</time>
          </>
        )}
      </p>
    </aside>
  )
}
