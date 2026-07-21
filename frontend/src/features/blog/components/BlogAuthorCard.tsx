import { Github, Instagram, Linkedin, Mail, MessageCircle } from 'lucide-react'

import { BLOG_AUTHOR } from '@/content/blog/author'
import type { BlogPostMeta } from '@/content/blog/types'
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

function SocialIcon({ id }: { id: string }) {
  switch (id) {
    case 'whatsapp':
      return <MessageCircle className="h-3.5 w-3.5" aria-hidden />
    case 'linkedin':
      return <Linkedin className="h-3.5 w-3.5" aria-hidden />
    case 'instagram':
      return <Instagram className="h-3.5 w-3.5" aria-hidden />
    case 'github':
      return <Github className="h-3.5 w-3.5" aria-hidden />
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.03H7.9v-2.9h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.75 8.44-4.91 8.44-9.93z" />
        </svg>
      )
    case 'threads':
      return (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.23-8.184-3.584C2.35 18.44 1.5 15.71 1.5 12.07 1.5 5.48 6.48.5 12.07.5c5.59 0 10.57 4.98 10.57 11.57 0 3.64-.85 6.37-2.495 8.346-1.85 2.354-4.603 3.56-8.184 3.584zM12.07 2.8c-5.01 0-8.77 3.83-8.77 9.27 0 3.22.74 5.61 2.19 7.12 1.58 1.64 3.88 2.5 6.59 2.52 2.71-.02 5.01-.88 6.59-2.52 1.45-1.51 2.19-3.9 2.19-7.12 0-5.44-3.76-9.27-8.79-9.27zm.12 14.86c-2.36 0-3.95-1.2-4.2-3.16h1.72c.18.98 1.05 1.55 2.48 1.55 1.58 0 2.52-.84 2.52-2.25 0-1.06-.55-1.72-1.86-2.1l-1.55-.45c-2.05-.6-3.02-1.72-3.02-3.45 0-2.12 1.66-3.55 4.05-3.55 2.2 0 3.7 1.15 3.98 2.98h-1.72c-.2-.92-.95-1.4-2.24-1.4-1.4 0-2.28.72-2.28 1.88 0 .98.52 1.55 1.78 1.92l1.52.45c2.22.66 3.28 1.85 3.28 3.72 0 2.35-1.8 3.86-4.46 3.86z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.16 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.2 8.2 0 0 0 4.76 1.52V6.84a4.85 4.85 0 0 1-1.01-.15z" />
        </svg>
      )
    default:
      return <Mail className="h-3.5 w-3.5" aria-hidden />
  }
}

export function BlogAuthorCard({ post }: Props) {
  const author = BLOG_AUTHOR

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
      <div className="blog-author-socials" role="list">
        {author.social.map((s) => (
          <a
            key={s.id}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="blog-author-social-btn"
            aria-label={s.label}
            title={s.label}
            role="listitem"
            onClick={() => trackBlogEvent('blog_author_social_click', { network: s.id })}
          >
            <SocialIcon id={s.id} />
          </a>
        ))}
        <a
          href={`mailto:${author.email}`}
          className="blog-author-social-btn"
          aria-label="E-mail"
          title="E-mail"
          role="listitem"
          onClick={() => trackBlogEvent('blog_author_social_click', { network: 'email' })}
        >
          <Mail className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>

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
        </time>
        {' '}
        · <strong className="font-semibold text-[var(--blog-navy)]">Última revisão</strong>{' '}
        <time dateTime={post.updatedAt} itemProp="dateModified">
          {formatBlogDate(post.updatedAt)}
        </time>
      </p>
    </aside>
  )
}
