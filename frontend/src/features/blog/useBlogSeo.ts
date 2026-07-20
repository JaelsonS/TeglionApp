import { useLayoutEffect } from 'react'

import { BRAND } from '@/shared/config/brand'
import type { BlogPost, BlogPostMeta } from '@/content/blog/types'
import { blogPostUrl } from '@/content/blog/blog-paths'
import { DEFAULT_OG_IMAGE } from '@/shared/utils/seo'
import { extractFaqItems } from '@/content/blog/blog-faq-utils'

type BlogSeoInput = {
  post?: BlogPost | BlogPostMeta
  /** Página índice do blog */
  index?: boolean
}

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector =
    rel === 'alternate' && extra?.type
      ? `link[rel="${rel}"][type="${extra.type}"]`
      : `link[rel="${rel}"]`
  let el = document.querySelector(selector) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    if (extra?.type) el.type = extra.type
    if (extra?.title) el.title = extra.title
    document.head.appendChild(el)
  }
  el.href = href
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove()
}

function injectJsonLd(id: string, data: Record<string, unknown>) {
  removeJsonLd(id)
  const script = document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

export function useBlogSeo({ post, index }: BlogSeoInput) {
  useLayoutEffect(() => {
    upsertMeta('google-adsense-account', 'ca-pub-8576885038152568')
    upsertMeta('robots', 'index,follow,max-image-preview:large')

    if (index) {
      const title = `Blog ${BRAND.name} — Contabilidade e fiscalidade em Portugal`
      const description =
        'Revista fiscal TegLion: IRS, IVA, Lda, recibos verdes e operação de escritórios em Portugal. Guias práticos indexados para Google — com checklists e prazos reais.'
      document.title = title
      upsertMeta('description', description)
      upsertMeta('og:title', title, 'property')
      upsertMeta('og:description', description, 'property')
      upsertMeta('og:url', `${BRAND.url}/blog`, 'property')
      upsertMeta('og:type', 'website', 'property')
      upsertMeta('og:image', DEFAULT_OG_IMAGE, 'property')
      upsertMeta('og:image:alt', `Blog ${BRAND.name} — contabilidade em Portugal`, 'property')
      upsertMeta('twitter:card', 'summary_large_image')
      upsertMeta('twitter:title', title)
      upsertMeta('twitter:description', description)
      upsertMeta('twitter:image', DEFAULT_OG_IMAGE)
      upsertLink('canonical', `${BRAND.url}/blog`)
      upsertLink('alternate', `${BRAND.url}/rss.xml`, {
        type: 'application/rss+xml',
        title: `RSS Blog ${BRAND.name}`,
      })

      injectJsonLd('blog-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: `Blog ${BRAND.name}`,
        url: `${BRAND.url}/blog`,
        description,
        publisher: {
          '@type': 'Organization',
          name: BRAND.name,
          url: BRAND.url,
        },
      })

      return () => {
        removeJsonLd('blog-jsonld')
      }
    }

    if (!post) return

    const url = `${BRAND.url}${blogPostUrl(post.slug)}`
    document.title = post.seo.title
    upsertMeta('description', post.seo.description)
    upsertMeta('keywords', (post.seo.keywords?.length ? post.seo.keywords : post.tags).join(', '))
    upsertMeta('og:title', post.seo.title, 'property')
    upsertMeta('og:description', post.seo.description, 'property')
    upsertMeta('og:url', url, 'property')
    upsertMeta('og:type', 'article', 'property')
    upsertMeta('og:image', post.coverImage.src, 'property')
    upsertMeta('og:image:alt', post.coverImage.alt || post.title, 'property')
    upsertMeta('article:published_time', post.publishedAt, 'property')
    upsertMeta('article:modified_time', post.updatedAt, 'property')
    upsertMeta('article:section', post.category, 'property')
    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', post.seo.title)
    upsertMeta('twitter:description', post.seo.description)
    upsertMeta('twitter:image', post.coverImage.src)
    upsertLink('canonical', url)

    injectJsonLd('blog-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: [post.coverImage.src],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Organization',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: BRAND.name,
        url: BRAND.url,
      },
      mainEntityOfPage: url,
      inLanguage: 'pt-PT',
      keywords: post.tags.join(', '),
    })

    injectJsonLd('blog-breadcrumb-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: BRAND.url,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `${BRAND.url}/blog`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: url,
        },
      ],
    })

    const faqItems = 'blocks' in post && Array.isArray(post.blocks) ? extractFaqItems(post.blocks) : []
    let faqIdleId: number | undefined
    let faqTimeoutId: ReturnType<typeof setTimeout> | undefined

    if (faqItems.length > 0) {
      const injectFaq = () => {
        injectJsonLd('blog-faq-jsonld', {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        })
      }
      if (typeof requestIdleCallback !== 'undefined') {
        faqIdleId = requestIdleCallback(injectFaq, { timeout: 3000 })
      } else {
        faqTimeoutId = setTimeout(injectFaq, 200)
      }
    }

    return () => {
      removeJsonLd('blog-jsonld')
      removeJsonLd('blog-breadcrumb-jsonld')
      removeJsonLd('blog-faq-jsonld')
      if (faqIdleId !== undefined && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(faqIdleId)
      }
      if (faqTimeoutId !== undefined) clearTimeout(faqTimeoutId)
    }
  }, [post, index])
}
