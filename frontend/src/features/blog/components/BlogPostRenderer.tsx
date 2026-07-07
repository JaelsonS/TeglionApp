import { Link } from 'react-router-dom'

import { BlogMonetizationSlot } from '@/features/blog/components/BlogMonetizationSlot'
import { BlogResponsiveImage } from '@/features/blog/components/BlogResponsiveImage'
import { LazyWhenVisible } from '@/features/blog/components/LazyWhenVisible'
import { BlogInternalLinks } from '@/features/blog/components/BlogInternalLinks'
import { BlogTeglionCta } from '@/features/blog/components/BlogTeglionCta'
import { blogPostUrl } from '@/content/blog/blog-paths'
import type { BlogBlock, BlogPost } from '@/content/blog/types'

type Props = {
  blocks: BlogBlock[]
  post: BlogPost
}

function shouldInsertMidMonetization(blocks: BlogBlock[], index: number, inserted: number) {
  if (inserted >= 1) return false
  const h2Count = blocks.slice(0, index + 1).filter((b) => b.type === 'h2').length
  return h2Count === 4 && blocks[index]?.type === 'h2'
}

export function BlogPostRenderer({ blocks, post }: Props) {
  let midSlots = 0

  return (
    <div className="blog-article">
      {blocks.flatMap((block, i) => {
        const nodes = [<div key={`b-${i}`}>{renderBlock(block, i)}</div>]
        if (shouldInsertMidMonetization(blocks, i, midSlots)) {
          midSlots += 1
          nodes.push(
            <LazyWhenVisible key={`promo-mid-${i}`} minHeight="3rem">
              <BlogMonetizationSlot
                seed={`${post.slug}-mid`}
                kind="affiliate"
                format="horizontal"
              />
            </LazyWhenVisible>,
          )
        }
        return nodes
      })}
      <p className="mt-8 text-sm blog-text-body">
        Publicado em {formatDate(post.publishedAt)} · Actualizado em {formatDate(post.updatedAt)} ·{' '}
        {post.readMinutes} min de leitura
      </p>
    </div>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function renderBlock(block: BlogBlock, key: number) {
  switch (block.type) {
    case 'p':
      return (
        <p key={key}>
          {block.text}
        </p>
      )
    case 'h2':
      return (
        <h2 key={key} id={block.id}>
          {block.text}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={key} id={block.id}>
          {block.text}
        </h3>
      )
    case 'ul':
      return (
        <ul key={key}>
          {block.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={key}>
          {block.items.map((item) => (
            <li key={item.slice(0, 40)}>{item}</li>
          ))}
        </ol>
      )
    case 'image':
      return (
        <figure key={key} className="blog-figure">
          <BlogResponsiveImage
            src={block.src}
            alt={block.alt}
            width={block.width ?? 960}
            height={block.height ?? 540}
            className="w-full rounded-xl object-cover"
          />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      )
    case 'callout':
      return (
        <aside
          key={key}
          className={`blog-callout blog-callout--${block.variant}`}
          role="note"
          aria-label={block.title || 'Nota'}
        >
          {block.title ? <p className="mb-1 font-semibold blog-text-navy">{block.title}</p> : null}
          <p className="mb-0 text-sm leading-relaxed">{block.text}</p>
        </aside>
      )
    case 'link':
      return (
        <p key={key}>
          <Link
            to={blogPostUrl(block.slug)}
            className="font-medium blog-text-navy underline underline-offset-4 hover:blog-text-gold"
          >
            → {block.label}
          </Link>
        </p>
      )
    case 'faq':
      return (
        <section key={key} id={block.id || 'faq'} className="blog-faq" aria-label={block.heading || 'Perguntas frequentes'}>
          {block.heading ? <h2 className="sr-only">{block.heading}</h2> : null}
          <dl className="space-y-4">
            {block.items.map((item) => (
              <div key={item.question.slice(0, 48)} className="rounded-xl border blog-border-subtle blog-bg-surface p-4">
                <dt className="font-semibold blog-text-navy">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed blog-text-body">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )
    case 'affiliate': {
      const isInternal = block.href.startsWith('/') || block.href.includes('teglion.com')
      const inner = (
        <>
          {block.image ? (
            <BlogResponsiveImage
              src={block.image.src}
              alt={block.image.alt}
              width={640}
              height={360}
              className="mb-3 aspect-video w-full rounded-lg object-cover"
            />
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-wide blog-text-gold">Sugestão</p>
          <p className="mt-1 text-lg font-semibold blog-text-navy">{block.title}</p>
          <p className="mt-2 text-sm blog-text-body">{block.description}</p>
          <span className="mt-3 inline-block text-sm font-medium blog-text-navy">
            {block.ctaLabel ?? 'Saber mais'} →
          </span>
        </>
      )
      const card = isInternal ? (
        <Link to={block.href.replace(/^https?:\/\/[^/]+/, '') || '/'} className="blog-affiliate">
          {inner}
        </Link>
      ) : (
        <a href={block.href} className="blog-affiliate" rel="noopener noreferrer sponsored" target="_blank">
          {inner}
        </a>
      )
      return (
        <div key={key} className="blog-affiliate-wrap">
          {block.leadIn ? <p className="blog-affiliate-lead">{block.leadIn}</p> : null}
          {card}
        </div>
      )
    }
    case 'internalLinks':
      return <BlogInternalLinks key={key} block={block} />
    case 'teglionCta':
      return <BlogTeglionCta key={key} block={block} />
    case 'quote':
      return (
        <blockquote key={key} className="blog-quote">
          <p>{block.text}</p>
          {block.attribution ? <footer>— {block.attribution}</footer> : null}
        </blockquote>
      )
    case 'keyTakeaways':
      return (
        <aside key={key} className="blog-key-takeaways" aria-label={block.title || 'Resumo'}>
          <p className="blog-key-takeaways__title">{block.title || 'O essencial'}</p>
          <ul>
            {block.items.map((item) => (
              <li key={item.slice(0, 48)}>{item}</li>
            ))}
          </ul>
        </aside>
      )
    case 'table':
      return (
        <figure key={key} className="blog-table-wrap">
          <div className="blog-table-scroll">
            <table className="blog-table">
              <thead>
                <tr>
                  {block.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      )
    case 'divider':
      return <hr key={key} className="blog-divider" aria-hidden />
    default:
      return null
  }
}
