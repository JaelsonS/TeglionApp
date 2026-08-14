/**
 * Serve o SPA local (Vite) e faz proxy /api → API staging com Origin reescrito
 * para https://staging.teglion.com (CSRF allowlist) e cookies sem Secure.
 */
import http from 'node:http'
import https from 'node:https'
import { spawn } from 'node:child_process'

const LISTEN = Number(process.env.QA_PROXY_PORT || 3020)
const VITE = process.env.QA_VITE_TARGET || 'http://127.0.0.1:3010'
const API = process.env.QA_API_TARGET || 'https://teglion-api-staging.onrender.com'
const FAKE_ORIGIN = 'https://staging.teglion.com'

function rewriteCookies(setCookie) {
  if (!setCookie) return setCookie
  const list = Array.isArray(setCookie) ? setCookie : [setCookie]
  return list.map((c) =>
    String(c)
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*Domain=[^;]*/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
  )
}

function proxyApi(req, res) {
  const url = new URL(req.url, 'http://local')
  const target = new URL(url.pathname + url.search, API)
  const headers = { ...req.headers, host: target.host, origin: FAKE_ORIGIN, referer: `${FAKE_ORIGIN}/` }
  delete headers['accept-encoding']

  const upstream = https.request(
    target,
    { method: req.method, headers },
    (up) => {
      const outHeaders = { ...up.headers }
      if (outHeaders['set-cookie']) outHeaders['set-cookie'] = rewriteCookies(outHeaders['set-cookie'])
      res.writeHead(up.statusCode || 502, outHeaders)
      up.pipe(res)
    },
  )
  upstream.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain' })
    res.end(String(err))
  })
  req.pipe(upstream)
}

function proxyVite(req, res) {
  const url = new URL(req.url, 'http://local')
  const target = new URL(url.pathname + url.search, VITE)
  const headers = { ...req.headers, host: target.host }
  const lib = target.protocol === 'https:' ? https : http
  const upstream = lib.request(
    target,
    { method: req.method, headers },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers)
      up.pipe(res)
    },
  )
  upstream.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain' })
    res.end(`vite proxy error: ${err}`)
  })
  req.pipe(upstream)
}

const server = http.createServer((req, res) => {
  if (String(req.url || '').startsWith('/api')) return proxyApi(req, res)
  return proxyVite(req, res)
})

server.listen(LISTEN, '127.0.0.1', () => {
  console.log(`QA proxy http://127.0.0.1:${LISTEN} → vite ${VITE} | api ${API}`)
})
