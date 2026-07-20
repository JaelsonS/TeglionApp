import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { blogCoverLcpUrl } from '@/features/blog/blog-images'
import { toBlogSharePayload } from '@/features/blog/blogSharePayload'
import { BlogAudienceCta } from '@/features/blog/components/BlogAudienceCta'
import { BlogAuthorCard } from '@/features/blog/components/BlogAuthorCard'
import { BlogCoverImage } from '@/features/blog/components/BlogCoverImage'
import { BlogLeadMagnet } from '@/features/blog/components/BlogLeadMagnet'
import { BlogPostPaths } from '@/features/blog/components/BlogPostPaths'
import { BlogShareButtons } from '@/features/blog/components/BlogShareButtons'
import { LazyWhenVisible } from '@/features/blog/components/LazyWhenVisible'
import { useBlogSeo } from '@/features/blog/useBlogSeo'
import { fetchBlogPost } from '@/content/blog/blog-post-api'
import { BLOG_BASE_PATH, blogPostUrl } from '@/content/blog/blog-paths'
import { readPrerenderedBlogPost } from '@/content/blog/read-prerendered-post'
import type { BlogPost } from '@/content/blog/types'
import { getRelatedPosts } from '@/content/blog'

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
      <div className="blog-container-wide pb-20 pt-28" aria-busy="true" aria-live="polite">
        <p className="text-sm blog-text-body">A carregar artigo…</p>
      </div>
    )
  }

  const share = toBlogSharePayload(post)
  const relatedRail = getRelatedPosts(post.slug, 4)

  return (
    <article className="pb-20 pt-24" itemScope itemType="https://schema.org/BlogPosting">
      <div className="blog-container-wide">
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
            <li className="blog-text-navy font-medium truncate max-w-[14rem] sm:max-w-md">{post.title}</li>
          </ol>
        </nav>

        <header className="mt-8 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide blog-text-gold">{post.category}</p>
          <h1 className="blog-display mt-3 text-3xl font-semibold leading-tight blog-text-navy sm:text-4xl lg:text-[2.75rem]" itemProp="headline">
            {post.title}
          </h1>
          <p className="mt-4 text-lg blog-text-body sm:text-xl" itemProp="description">
            {post.excerpt}
          </p>
          <p className="mt-4 text-sm blog-text-body">
            <span>{post.author}</span>
            <span className="mx-2 opacity-40" aria-hidden>
              ·
            </span>
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            {post.updatedAt !== post.publishedAt ? (
              <>
                <span className="mx-2 opacity-40" aria-hidden>
                  ·
                </span>
                <span>
                  Última revisão <time dateTime={post.updatedAt}>{formatBlogDate(post.updatedAt)}</time>
                </span>
              </>
            ) : null}
            <span className="mx-2 opacity-40" aria-hidden>
              ·
            </span>
            <span>{post.readMinutes} min de leitura</span>
          </p>
          <BlogShareButtons className="mt-5" post={share} />
        </header>

        <BlogCoverImage coverImage={post.coverImage} />

        <div className="blog-article-layout mt-10">
          <aside className="blog-article-rail blog-article-rail--left" aria-label="Índice">
            <Suspense fallback={null}>
              <BlogTableOfContents blocks={post.blocks} sticky />
            </Suspense>
          </aside>

          <div className="blog-article-column min-w-0">
            <Suspense fallback={null}>
              <BlogSeriesNav post={post} />
              <div className="lg:hidden">
                <BlogTableOfContents blocks={post.blocks} />
              </div>
              <div className="blog-article">
                <BlogPostRenderer blocks={post.blocks} post={post} />
              </div>
            </Suspense>
          </div>

          <aside className="blog-article-rail blog-article-rail--right" aria-label="Continuar e contactar">
            <BlogAuthorCard post={post} />
            <BlogAudienceCta post={post} compact />
            <BlogLeadMagnet
              source={`blog-post-lead-${post.slug}`}
              title="Checklist fiscal por e-mail"
              description="Receba a checklist mensal (AT + SS + documentos). Ideal para independentes e PME."
            />
            <div className="blog-rail-card">
              <p className="blog-rail-eyebrow">Continuar a ler</p>
              <ul className="mt-2 space-y-2">
                {relatedRail.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={blogPostUrl(r.slug)}
                      className="text-sm font-medium leading-snug blog-text-navy underline-offset-2 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <LazyWhenVisible>
        <div className="blog-container-wide">
          <BlogPostPaths slug={post.slug} />
          <div className="mt-10 lg:hidden">
            <BlogAudienceCta post={post} />
          </div>
          <Suspense fallback={null}>
            <BlogRelatedPosts slug={post.slug} />
          </Suspense>
          <section className="blog-defer-section mt-16 max-w-3xl">
            <Suspense fallback={null}>
              <BlogNewsletter source={`blog-post-${post.slug}`} />
            </Suspense>
          </section>
        </div>
      </LazyWhenVisible>
    </article>
  )
}
