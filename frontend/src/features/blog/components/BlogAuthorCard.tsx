import { BLOG_AUTHOR } from '@/content/blog/author'
import type { BlogPostMeta } from '@/content/blog/types'
import { BlogSocialBrandIcon } from '@/features/blog/components/BlogSocialBrandIcons'
import { trackBlogEvent } from '@/features/blog/blogAnalytics'
import { BRAND } from '@/shared/config/brand'

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
  const author = BLOG_AUTHOR

  const socials = [
    ...author.social.map((s) => ({
      id: s.id,
      label: s.label,
      href: s.href,
      external: true as const,
    })),
    {
      id: 'email',
      label: 'E-mail',
      href: `mailto:${author.email}`,
      external: false as const,
    },
  ]

  return (
    <aside className="blog-rail-card blog-author-card" aria-label="Autor">
      <div className="blog-author-row">
        <img
          src={author.image}
          alt={author.imageAlt}
          width={56}
          height={56}
          className="blog-author-photo"
          loading="lazy"
          decoding="async"
        />
        <div>
          <p className="blog-rail-title" itemProp="author" itemScope itemType="https://schema.org/Person">
            <span itemProp="name">{author.name}</span>
          </p>
          <p className="blog-rail-text">{author.role}</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed blog-text-body">{author.bio}</p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide blog-text-gold">Segue / contacta</p>
      <ul className="blog-author-socials">
        {socials.map((s) => (
          <li key={s.id} className="blog-author-social-item">
            <a
              href={s.href}
              {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`blog-author-social-btn blog-author-social-btn--${s.id}`}
              aria-label={s.label}
              data-tooltip={s.label}
              onClick={() => trackBlogEvent('blog_author_social_click', { network: s.id })}
            >
              <BlogSocialBrandIcon id={s.id} />
              <span className="blog-author-social-tooltip" role="tooltip">
                {s.label}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] blog-text-muted">
        <a href={`tel:${BRAND.phone.e164}`} className="underline-offset-2 hover:underline">
          {author.phoneDisplay}
        </a>
        {' · '}
        <a href={`mailto:${author.email}`} className="underline-offset-2 hover:underline">
          {author.email}
        </a>
      </p>

      <p className="mt-3 text-xs blog-text-muted">
        Conteúdo educativo para Portugal. Não substitui aconselhamento de um contabilista certificado (OCC).
      </p>
      <p className="mt-2 text-xs blog-text-muted">
        Publicado{' '}
        <time dateTime={post.publishedAt} itemProp="datePublished">
          {formatBlogDate(post.publishedAt)}
        </time>{' '}
        · <strong className="font-semibold text-[var(--blog-navy)]">Última revisão</strong>{' '}
        <time dateTime={post.updatedAt} itemProp="dateModified">
          {formatBlogDate(post.updatedAt)}
        </time>
      </p>
    </aside>
  )
}
