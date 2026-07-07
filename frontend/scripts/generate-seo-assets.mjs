/**
 * Gera sitemap.xml e feed RSS a partir dos posts em src/content/blog/posts/.
 * Correr antes do build: npm run seo:generate
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const POSTS_DIR = join(ROOT, 'src/content/blog/posts')
const PUBLIC_DIR = join(ROOT, 'public')
const SITE = 'https://teglion.com'

function extractField(content, field) {
  const re = new RegExp(`${field}:\\s*['"\`]([^'"\`]+)['"\`]`)
  return content.match(re)?.[1] ?? null
}

function extractSeoDescription(content) {
  const block = content.match(/seo:\s*\{[\s\S]*?description:\s*\n?\s*['"`]([^'"`]+)['"`]/)?.[1]
  return block ?? ''
}

function parsePosts() {
  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((file) => {
      const raw = readFileSync(join(POSTS_DIR, file), 'utf8')
      const slug = extractField(raw, 'slug')
      if (!slug) return null
      return {
        slug,
        title: extractField(raw, 'title') ?? slug,
        excerpt: extractField(raw, 'excerpt') ?? extractSeoDescription(raw),
        publishedAt: extractField(raw, 'publishedAt') ?? '2026-01-01',
        updatedAt: extractField(raw, 'updatedAt') ?? extractField(raw, 'publishedAt') ?? '2026-01-01',
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildSitemap(posts) {
  const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
    { loc: '/security', changefreq: 'monthly', priority: '0.85' },
    { loc: '/blog', changefreq: 'weekly', priority: '0.95' },
    { loc: '/termos', changefreq: 'yearly', priority: '0.4' },
    { loc: '/privacidade', changefreq: 'yearly', priority: '0.4' },
    { loc: '/cookies', changefreq: 'yearly', priority: '0.3' },
    { loc: '/dpa', changefreq: 'yearly', priority: '0.3' },
    { loc: '/aviso-legal', changefreq: 'yearly', priority: '0.3' },
  ]

  const urls = [
    ...staticPages.map(
      (p) => `  <url>
    <loc>${SITE}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    ),
    ...posts.map(
      (p) => `  <url>
    <loc>${SITE}/blog/${p.slug}</loc>
    <lastmod>${p.updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>`,
    ),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

function buildRss(posts) {
  const items = posts
    .slice(0, 20)
    .map(
      (p) => `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(p.excerpt)}</description>
    </item>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog TegLion — Contabilidade e fiscalidade em Portugal</title>
    <link>${SITE}/blog</link>
    <description>Artigos informativos sobre IRS, IVA, recibos verdes e obrigações fiscais para PME e trabalhadores independentes em Portugal.</description>
    <language>pt-PT</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}

const posts = parsePosts()
writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), buildSitemap(posts), 'utf8')
writeFileSync(join(PUBLIC_DIR, 'rss.xml'), buildRss(posts), 'utf8')
console.log(`[seo] sitemap.xml + rss.xml (${posts.length} artigos)`)
