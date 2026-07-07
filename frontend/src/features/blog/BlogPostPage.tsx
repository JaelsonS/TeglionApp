import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { blogCoverLcpUrl } from '@/features/blog/blog-images'
import { toBlogSharePayload } from '@/features/blog/blogSharePayload'
import { BlogCoverImage } from '@/features/blog/components/BlogCoverImage'
import { BlogPostPaths } from '@/features/blog/components/BlogPostPaths'
import { BlogShareButtons } from '@/features/blog/components/BlogShareButtons'
import { LazyWhenVisible } from '@/features/blog/components/LazyWhenVisible'
import { useBlogSeo } from '@/features/blog/useBlogSeo'
import { fetchBlogPost } from '@/content/blog/blog-post-api'
import { BLOG_BASE_PATH } from '@/content/blog/blog-paths'
import { readPrerenderedBlogPost } from '@/content/blog/read-prerendered-post'
import type { BlogPost } from '@/content/blog/types'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'

const BlogPostRenderer = lazy(() =>
  import('@/features/blog/components/BlogPostRenderer').then((m) => ({ default: m.BlogPostRenderer })),
)
const BlogSeriesNav = lazy(() =>
  import('@/features/blog/components/BlogSeriesNav').then((m) => ({ default: m.BlogSeriesNav })),
)
const BlogTableOfContents = lazy(() =>
  import('@/features/blog/components/BlogTableOfContents').then((m) => ({ default: m.BlogTableOfContents })),
)
const BlogRelatedPosts = lazy(() =>
  import('@/features/blog/components/BlogRelatedPosts').then((m) => ({ default: m.BlogRelatedPosts })),
)
const BlogNewsletter = lazy(() =>
  import('@/features/blog/components/BlogNewsletter').then((m) => ({ default: m.BlogNewsletter })),
)

function formatBlogDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return iso
  }
}

function preloadCover(src: string) {
  if (typeof document === 'undefined') return
  const href = blogCoverLcpUrl(src)
  const id = 'blog-cover-preload'
  if (document.querySelector(`link#${id}[href="${href}"]`)) return
  document.getElementById(id)?.remove()
  const link = document.createElement('link')
  link.id = id
  link.rel = 'preload'
  link.as = 'image'
  link.href = href
  link.setAttribute('fetchpriority', 'high')
  document.head.appendChild(link)
}

function resolveInitialPost(slug: string): BlogPost | null | 'loading' {
  if (!slug) return null
  const prerendered = readPrerenderedBlogPost(slug)
  if (prerendered) {
    if (prerendered.coverImage?.src) preloadCover(prerendered.coverImage.src)
    return prerendered
  }
  return 'loading'
}

export function BlogPostPage() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null | 'loading'>(() => resolveInitialPost(slug))

  useEffect(() => {
    if (!slug) {
      setPost(null)
      return
    }

    const prerendered = readPrerenderedBlogPost(slug)
    if (prerendered) {
      setPost(prerendered)
      return
    }

    let cancelled = false
    setPost('loading')
    void fetchBlogPost(slug).then((loaded) => {
      if (!cancelled) {
        setPost(loaded ?? null)
        if (loaded?.coverImage?.src) preloadCover(loaded.coverImage.src)
      }
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  useBlogSeo({ post: post && post !== 'loading' ? post : undefined })

  if (post === null) {
    return <Navigate to={BLOG_BASE_PATH} replace />
  }

  if (post === 'loading' || !post) {
    return (
      <div className="blog-container pb-20 pt-28" aria-busy="true" aria-live="polite">
        <p className="text-sm blog-text-body">A carregar artigo…</p>
      </div>
    )
  }

  const share = toBlogSharePayload(post)

  return (
    <article className="blog-container pb-20 pt-24" itemScope itemType="https://schema.org/BlogPosting">
      <nav className="text-sm blog-text-body" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link to="/" className="hover:blog-text-navy">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to={BLOG_BASE_PATH} className="hover:blog-text-navy">
              Blog
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="blog-text-navy font-medium truncate max-w-[12rem] sm:max-w-none">{post.title}</li>
        </ol>
      </nav>

      <header className="mx-auto mt-8 max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide blog-text-gold">{post.category}</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight blog-text-navy sm:text-4xl" itemProp="headline">
          {post.title}
        </h1>
        <p className="mt-4 text-lg blog-text-body" itemProp="description">
          {post.excerpt}
        </p>
        <p className="mt-4 text-sm blog-text-body" itemProp="author" itemScope itemType="https://schema.org/Person">
          <span itemProp="name">{post.author}</span>
          <span className="mx-2 opacity-40" aria-hidden>
            ·
          </span>
          <time dateTime={post.publishedAt} itemProp="datePublished">
            {formatBlogDate(post.publishedAt)}
          </time>
          {post.updatedAt !== post.publishedAt ? (
            <>
              <span className="mx-2 opacity-40" aria-hidden>
                ·
              </span>
              <span>
                Actualizado{' '}
                <time dateTime={post.updatedAt} itemProp="dateModified">
                  {formatBlogDate(post.updatedAt)}
                </time>
              </span>
            </>
          ) : null}
          <span className="mx-2 opacity-40" aria-hidden>
            ·
          </span>
          <span>{post.readMinutes} min de leitura</span>
        </p>
        <BlogShareButtons className="mx-auto mt-5 justify-center" post={share} />
      </header>

      <BlogCoverImage coverImage={post.coverImage} />

      <div className="mx-auto mt-10 max-w-3xl px-0">
        <Suspense fallback={null}>
          <BlogSeriesNav post={post} />
          <BlogTableOfContents blocks={post.blocks} />
          <BlogPostRenderer blocks={post.blocks} post={post} />
        </Suspense>
      </div>

      <LazyWhenVisible>
        <BlogPostPaths slug={post.slug} />

        <aside className="blog-defer-section mx-auto mt-12 max-w-3xl rounded-xl border blog-border-subtle bg-white p-6 text-center">
          <h2 className="text-lg font-semibold blog-text-navy">Gerir um escritório de contabilidade?</h2>
          <p className="mt-2 text-sm blog-text-body">
            Documentos, prazos, portal do cliente e mensagens num só lugar. Teste 14 dias grátis, sem cartão.
          </p>
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-4 inline-flex">
            Começar teste grátis
          </Link>
        </aside>

        <Suspense fallback={null}>
          <BlogRelatedPosts slug={post.slug} />
        </Suspense>

        <section className="blog-container blog-defer-section mt-16 max-w-3xl">
          <Suspense fallback={null}>
            <BlogNewsletter source={`blog-post-${post.slug}`} />
          </Suspense>
        </section>
      </LazyWhenVisible>
    </article>
  )
}
