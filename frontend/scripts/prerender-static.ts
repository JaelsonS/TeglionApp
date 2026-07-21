/**
 * Prerender estático pós-build (sem browser — compatível com Vercel).
 * Gera HTML com meta tags + conteúdo visível para crawlers (blog, páginas públicas).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BLOG_POSTS } from '../src/content/blog/all-posts.ts'
import { blogPostUrl } from '../src/content/blog/blog-paths.ts'
import { blogCoverLcpUrl } from '../src/features/blog/blog-images.ts'
import { BLOG_POST_DATA_ID } from '../src/content/blog/read-prerendered-post.ts'
import { BRAND } from '../src/shared/config/brand.ts'
import type { BlogBlock, BlogPost } from '../src/content/blog/types.ts'
import { DEFAULT_OG_IMAGE } from '../src/shared/utils/seo.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')

const PUBLIC_ROUTES: Record<
  string,
  {
    title: string
    description: string
    ogType?: string
    jsonLd?: Record<string, unknown> | Record<string, unknown>[]
    rootHtml?: string
  }
> = {
  '/pricing': {
    title: 'Preços Teglion — Software para escritórios de contabilidade',
    description:
      'Planos transparentes para escritórios de contabilidade em Portugal. Teste grátis 14 dias, sem cartão.',
  },
  '/case-studies': {
    title: 'Casos de estudo — Teglion',
    description:
      'Histórias de escritórios no Teglion — publicaremos casos reais assim que estiverem disponíveis.',
  },
  '/blog': {
    title: `Blog ${BRAND.name} — Contabilidade e fiscalidade em Portugal`,
    description:
      'Artigos informativos sobre IRS, abrir actividade, IVA e obrigações fiscais. Conteúdo educativo — consulte sempre um contador certificado.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `Blog ${BRAND.name}`,
      url: `${BRAND.url}/blog`,
      publisher: { '@type': 'Organization', name: BRAND.name, url: BRAND.url },
    },
  },
}

const LANDING_SEO = {
  title: 'Teglion — Gestão completa para escritórios de contabilidade',
  description:
    'Fecha o mês sem caçar documentos no WhatsApp. Teglion junta documentos, prazos fiscais, faturação e portal do cliente num só sistema — feito para escritórios em Portugal.',
}

const LANDING_JSON_LD: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: BRAND.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Gestão digital para escritórios de contabilidade em Portugal: clientes, obrigações, documentos e comunicação com PME.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
}

function renderLandingBody() {
  return `<main class="landing-page" id="landing-prerender">
  <h1>Gestão completa de um escritório de contabilidade num só sistema.</h1>
  <p>Documentos, prazos, faturação e comunicação com clientes — sem saltar entre 5 ferramentas.</p>
  <p>
    <a href="/auth/firm/register">Começar 14 dias grátis</a>
    · <a href="/blog">Blog</a>
    · <a href="/pricing">Preços</a>
  </p>
</main>`
}

function renderBlogIndexBody() {
  const items = BLOG_POSTS.map(
    (post) =>
      `<article><h2><a href="${escapeAttr(blogPostUrl(post.slug))}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt)}</p></article>`,
  ).join('\n')
  return `<main class="blog-container" id="blog-index-prerender">
  <h1>Contabilidade e fiscalidade explicadas sem complicar</h1>
  <p>Guias para quem nunca entregou IRS, quer abrir actividade ou perceber obrigações.</p>
  <section aria-label="Artigos">${items}</section>
</main>`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/'/g, '&#39;')
}

function extractFaqItems(blocks: BlogBlock[]) {
  return blocks
    .filter((b): b is Extract<BlogBlock, { type: 'faq' }> => b.type === 'faq')
    .flatMap((b) => b.items)
}

function renderBlock(block: BlogBlock): string {
  switch (block.type) {
    case 'p':
      return `<p>${escapeHtml(block.text)}</p>`
    case 'h2':
      return `<h2 id="${escapeAttr(block.id ?? '')}">${escapeHtml(block.text)}</h2>`
    case 'h3':
      return `<h3 id="${escapeAttr(block.id ?? '')}">${escapeHtml(block.text)}</h3>`
    case 'ul':
      return `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
    case 'ol':
      return `<ol>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`
    case 'image':
      return `<figure><img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt)}" width="${block.width ?? 960}" height="${block.height ?? 540}" loading="lazy" decoding="async"/>${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>`
    case 'callout':
      return `<aside role="note"><p><strong>${escapeHtml(block.title ?? 'Nota')}</strong></p><p>${escapeHtml(block.text)}</p></aside>`
    case 'link':
      return `<p><a href="${escapeAttr(blogPostUrl(block.slug))}">${escapeHtml(block.label)}</a></p>`
    case 'faq':
      return `<section>${block.items.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('')}</section>`
    case 'affiliate':
      return `<p><a href="${escapeAttr(block.href)}">${escapeHtml(block.title)}</a> — ${escapeHtml(block.description)}</p>`
    case 'internalLinks': {
      const links = block.slugs
        .map((slug) => `<li><a href="${escapeAttr(blogPostUrl(slug))}">${escapeHtml(slug)}</a></li>`)
        .join('')
      return `<section><h2>${escapeHtml(block.title)}</h2>${block.intro ? `<p>${escapeHtml(block.intro)}</p>` : ''}<ul>${links}</ul></section>`
    }
    case 'teglionCta':
      return `<aside><p><strong>Teglion</strong></p><p>${escapeHtml(block.text ?? '')}</p><a href="/auth/firm/register">Testar grátis</a></aside>`
    case 'quote':
      return `<blockquote><p>${escapeHtml(block.text)}</p>${block.attribution ? `<footer>${escapeHtml(block.attribution)}</footer>` : ''}</blockquote>`
    case 'keyTakeaways':
      return `<aside><p><strong>${escapeHtml(block.title ?? 'Resumo')}</strong></p><ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul></aside>`
    case 'table': {
      const head = block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
      const body = block.rows
        .map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
        .join('')
      return `<figure><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>`
    }
    case 'divider':
      return '<hr />'
    default:
      return ''
  }
}

function renderPostBody(post: BlogPost) {
  const coverSrc = blogCoverLcpUrl(post.coverImage.src)
  const cover = `<figure class="blog-cover-prerender"><img src="${escapeAttr(coverSrc)}" alt="${escapeAttr(post.coverImage.alt)}" width="640" height="336" fetchpriority="high" decoding="async"/></figure>`
  const article = post.blocks.map(renderBlock).join('\n')
  return `<article class="blog-container" itemscope itemtype="https://schema.org/BlogPosting">
  <header>
    <p>${escapeHtml(post.category)}</p>
    <h1 itemprop="headline">${escapeHtml(post.title)}</h1>
    <p itemprop="description">${escapeHtml(post.excerpt)}</p>
  </header>
  ${cover}
  <div class="blog-article">${article}</div>
</article>`
}

function serializeBlogPostData(post: BlogPost) {
  return JSON.stringify(post).replace(/</g, '\\u003c')
}

function jsonLdScripts(schemas: Record<string, unknown>[]) {
  return schemas
    .map(
      (data) =>
        `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
    )
    .join('\n    ')
}

type PatchInput = {
  title: string
  description: string
  canonical: string
  keywords?: string
  ogType?: string
  ogImage?: string
  articlePublished?: string
  articleModified?: string
  jsonLd?: Record<string, unknown>[]
  rootHtml?: string
  blogPostData?: BlogPost
  coverPreload?: string
}

function patchHtml(base: string, input: PatchInput) {
  let html = base

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(input.title)}</title>`)

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeAttr(input.description)}" />`,
  )

  if (input.keywords) {
    if (html.includes('name="keywords"')) {
      html = html.replace(
        /<meta\s+name="keywords"\s+content="[^"]*"\s*\/>/,
        `<meta name="keywords" content="${escapeAttr(input.keywords)}" />`,
      )
    } else {
      html = html.replace('</head>', `    <meta name="keywords" content="${escapeAttr(input.keywords)}" />\n  </head>`)
    }
  }

  const ogImage = input.ogImage ?? DEFAULT_OG_IMAGE
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeAttr(input.title)}" />`)
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeAttr(input.description)}" />`)
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${escapeAttr(input.canonical)}" />`)
  html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/, `<meta property="og:type" content="${escapeAttr(input.ogType ?? 'website')}" />`)
  html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/, `<meta property="og:image" content="${escapeAttr(ogImage)}" />`)

  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeAttr(input.title)}" />`)
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeAttr(input.description)}" />`)
  html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />`)

  if (input.articlePublished) {
    if (html.includes('property="article:published_time"')) {
      html = html.replace(
        /<meta\s+property="article:published_time"\s+content="[^"]*"\s*\/>/,
        `<meta property="article:published_time" content="${escapeAttr(input.articlePublished)}" />`,
      )
    } else {
      html = html.replace(
        '</head>',
        `    <meta property="article:published_time" content="${escapeAttr(input.articlePublished)}" />\n  </head>`,
      )
    }
  }

  if (input.articleModified) {
    if (html.includes('property="article:modified_time"')) {
      html = html.replace(
        /<meta\s+property="article:modified_time"\s+content="[^"]*"\s*\/>/,
        `<meta property="article:modified_time" content="${escapeAttr(input.articleModified)}" />`,
      )
    } else {
      html = html.replace(
        '</head>',
        `    <meta property="article:modified_time" content="${escapeAttr(input.articleModified)}" />\n  </head>`,
      )
    }
  }

  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeAttr(input.canonical)}" />`)
  } else {
    html = html.replace('</head>', `    <link rel="canonical" href="${escapeAttr(input.canonical)}" />\n  </head>`)
  }

  if (input.jsonLd?.length) {
    const scripts = jsonLdScripts(input.jsonLd)
    if (html.includes('type="application/ld+json"')) {
      html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, scripts)
    } else {
      html = html.replace('</head>', `    ${scripts}\n  </head>`)
    }
  }

  if (input.rootHtml) {
    html = html.replace(/<div id="root"><\/div>/, `<div id="root">${input.rootHtml}</div>`)
  }

  if (input.coverPreload) {
    const preload = `<link rel="preload" as="image" href="${escapeAttr(input.coverPreload)}" fetchpriority="high" />`
    html = html.replace('</head>', `    ${preload}\n  </head>`)
  }

  if (input.blogPostData) {
    const payload = `<script type="application/json" id="${BLOG_POST_DATA_ID}">${serializeBlogPostData(input.blogPostData)}</script>`
    html = html.replace('</body>', `    ${payload}\n  </body>`)
  }

  return html
}

function routeToFile(route: string) {
  if (route === '/') return join(DIST, 'index.html')
  const clean = route.replace(/^\//, '').replace(/\/$/, '')
  return join(DIST, clean, 'index.html')
}

function writeRoute(route: string, html: string) {
  const out = routeToFile(route)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html, 'utf8')
  console.log(`[prerender] ${route} → ${out.replace(DIST, 'dist')}`)
}

function normalizeJsonLd(jsonLd?: Record<string, unknown> | Record<string, unknown>[]) {
  if (!jsonLd) return undefined
  return Array.isArray(jsonLd) ? jsonLd : [jsonLd]
}

function main() {
  const baseHtml = readFileSync(join(DIST, 'index.html'), 'utf8')
  let count = 0

  writeRoute(
    '/',
    patchHtml(baseHtml, {
      title: LANDING_SEO.title,
      description: LANDING_SEO.description,
      canonical: BRAND.url,
      jsonLd: [LANDING_JSON_LD],
      rootHtml: renderLandingBody(),
    }),
  )
  count += 1

  for (const [route, meta] of Object.entries(PUBLIC_ROUTES)) {
    const rootHtml = route === '/blog' ? renderBlogIndexBody() : meta.rootHtml
    writeRoute(
      route,
      patchHtml(baseHtml, {
        title: meta.title,
        description: meta.description,
        canonical: `${BRAND.url}${route}`,
        ogType: meta.ogType ?? 'website',
        jsonLd: normalizeJsonLd(meta.jsonLd),
        rootHtml,
      }),
    )
    count += 1
  }

  for (const post of BLOG_POSTS) {
    const path = blogPostUrl(post.slug)
    const url = `${BRAND.url}${path}`
    const faqItems = extractFaqItems(post.blocks)
    const jsonLd: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: [post.coverImage.src],
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: { '@type': 'Organization', name: post.author },
        publisher: { '@type': 'Organization', name: BRAND.name, url: BRAND.url },
        mainEntityOfPage: url,
        keywords: post.tags.join(', '),
      },
    ]
    if (faqItems.length > 0) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      })
    }

    writeRoute(
      path,
      patchHtml(baseHtml, {
        title: post.seo.title,
        description: post.seo.description,
        keywords: post.seo.keywords.join(', '),
        canonical: url,
        ogType: 'article',
        ogImage: post.coverImage.src,
        articlePublished: post.publishedAt,
        articleModified: post.updatedAt,
        jsonLd,
        rootHtml: renderPostBody(post),
        blogPostData: post,
        coverPreload: blogCoverLcpUrl(post.coverImage.src),
      }),
    )
    count += 1
  }

  console.log(`[prerender] concluído — ${count} rotas (homepage + públicas + blog)`)
}

main()
