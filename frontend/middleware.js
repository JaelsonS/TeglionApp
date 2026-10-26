/** Edge middleware — OG bots + redirect path→subdomínio em staging. */
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
  'manual',
  'security',
  'login',
  'register',
  'login-firm',
  'login-client',
  'register-firm',
])

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isValidSlug(slug) {
  const s = String(slug || '').toLowerCase()
  if (!s || s.length < 2) return false
  if (RESERVED.has(s)) return false
  return SLUG_RE.test(s)
}

function parseStagingPublicSlug(hostname) {
  const host = String(hostname || '').toLowerCase()
  const suffix = '.staging.teglion.com'
  if (!host.endsWith(suffix)) return null
  const label = host.slice(0, -suffix.length)
  if (!label || label.includes('.')) return null
  if (!isValidSlug(label)) return null
  return label
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

async function serveSharePreview({ origin, slug, pageUrl }) {
  const previewUrl = new URL(`/api/public/firms/${encodeURIComponent(slug)}/share-preview`, origin)
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

export default async function middleware(request) {
  const url = new URL(request.url)
  const host = url.hostname.toLowerCase()

  // 301 path→subdomínio: só com SSL wildcard Valid na Vercel (*.staging.teglion.com).
  // Activar com true após `curl -I https://foo.staging.teglion.com` devolver HTTP/2 200.
  const ENABLE_STAGING_PATH_REDIRECT = false
  if (
    ENABLE_STAGING_PATH_REDIRECT &&
    (host === 'staging.teglion.com' || host === 'www.staging.teglion.com')
  ) {
    let pathname = url.pathname
    if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1)
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length >= 1) {
      const slug = parts[0].toLowerCase()
      if (isValidSlug(slug)) {
        const rest = parts.slice(1).join('/')
        const dest = new URL(
          rest
            ? `https://${slug}.staging.teglion.com/${rest}`
            : `https://${slug}.staging.teglion.com/`,
        )
        dest.search = url.search
        return Response.redirect(dest.toString(), 301)
      }
    }
  }

  const ua = request.headers.get('user-agent') || ''
  if (!BOT_UA.test(ua)) return

  const subdomainSlug = parseStagingPublicSlug(host)
  if (subdomainSlug) {
    let pathname = url.pathname
    if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1)
    if (pathname === '' || pathname === '/') {
      const pageUrl = `https://${subdomainSlug}.staging.teglion.com/`
      return serveSharePreview({ origin: url.origin, slug: subdomainSlug, pageUrl })
    }
    return
  }

  let pathname = url.pathname
  if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1)

  const parts = pathname.split('/').filter(Boolean)
  if (parts.length !== 1) return

  const slug = parts[0].toLowerCase()
  if (!slug || !isValidSlug(slug)) return

  const pageUrl = `${url.origin}/${encodeURIComponent(slug)}`
  return serveSharePreview({ origin: url.origin, slug, pageUrl })
}

export const config = {
  matcher: ['/((?!api|assets|icons|og|landing|sw\\.js|workbox-|.*\\..*).*)'],
}
