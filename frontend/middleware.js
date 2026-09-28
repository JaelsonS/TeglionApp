/** Crawlers (WhatsApp, etc.) não executam JS — devolve HTML com OG do escritório. */
const BOT_UA =
  /bot|facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Googlebot|bingbot|Applebot|Meta-ExternalFetcher|Slurp|ia_archiver|Embedly/i

const RESERVED = new Set([
  'auth',
  'app',
  'blog',
  'pricing',
  'case-studies',
  'suporte',
  'termos',
  'privacidade',
  'cookies',
  'dpa',
  'aviso-legal',
  'pedidos',
  'api',
  'recover-password',
  'reset-password',
])

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Nunca devolver index.html de marketing (og/teglion-og.png) a crawlers em /:slug. */
function botFallbackHtml({ title, url, status }) {
  const safeTitle = escapeHtml(title)
  const safeUrl = escapeHtml(url)
  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta name="twitter:card" content="summary" />
  <link rel="canonical" href="${safeUrl}" />
</head>
<body><p><a href="${safeUrl}">${safeTitle}</a></p></body>
</html>`
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_UA.test(ua)) return

  const url = new URL(request.url)
  let pathname = url.pathname
  if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1)

  const parts = pathname.split('/').filter(Boolean)
  if (parts.length !== 1) return

  const slug = parts[0].toLowerCase()
  if (!slug || RESERVED.has(slug)) return

  const pageUrl = `${url.origin}/${encodeURIComponent(slug)}`
  const previewUrl = new URL(`/api/public/firms/${encodeURIComponent(slug)}/share-preview`, url.origin)

  try {
    const res = await fetch(previewUrl.toString(), {
      headers: { Accept: 'text/html' },
    })
    if (res.ok) {
      const html = await res.text()
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        },
      })
    }

    const title =
      res.status === 404 ? 'Página do escritório — Teglion' : 'Pré-visualização temporariamente indisponível'
    return new Response(botFallbackHtml({ title, url: pageUrl, status: res.status }), {
      status: res.status === 404 ? 404 : 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch {
    return new Response(
      botFallbackHtml({ title: 'Pré-visualização temporariamente indisponível', url: pageUrl, status: 503 }),
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      },
    )
  }
}

export const config = {
  matcher: ['/((?!api|assets|icons|og|landing|sw\\.js|workbox-|.*\\..*).*)'],
}
