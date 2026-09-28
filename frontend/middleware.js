/** Crawlers (WhatsApp, etc.) não executam JS — devolve HTML com OG do escritório. */
const BOT_UA =
  /bot|facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest/i

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

  const previewUrl = new URL(`/api/public/firms/${encodeURIComponent(slug)}/share-preview`, url.origin)
  const res = await fetch(previewUrl.toString(), {
    headers: { Accept: 'text/html' },
  })
  if (!res.ok) return

  const html = await res.text()
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}

export const config = {
  matcher: ['/((?!api|assets|icons|og|landing|sw\\.js|workbox-|.*\\..*).*)'],
}
