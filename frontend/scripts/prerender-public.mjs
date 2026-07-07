/**
 * Prerender rotas públicas (blog, landing) para HTML estático pós-build.
 * Usa Playwright contra vite preview — o JS executa e o crawler recebe conteúdo real.
 *
 * PLAYWRIGHT_BROWSERS_PATH=0 → browsers em node_modules (cache Vercel com npm install).
 */
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0'

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const POSTS_DIR = join(ROOT, 'src/content/blog/posts')
const PORT = 4173
const BASE = `http://127.0.0.1:${PORT}`

function parseSlugs() {
  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.ts'))
    .map((file) => {
      const raw = readFileSync(join(POSTS_DIR, file), 'utf8')
      return raw.match(/slug:\s*['"`]([^'"`]+)['"`]/)?.[1]
    })
    .filter(Boolean)
}

function routesToPrerender() {
  const slugs = parseSlugs()
  return ['/', '/pricing', '/security', '/blog', '/case-studies', ...slugs.map((s) => `/blog/${s}`)]
}

function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url)
        if (res.ok) return resolve(undefined)
      } catch {
        // retry
      }
      if (Date.now() - start > timeoutMs) return reject(new Error('Preview server timeout'))
      setTimeout(tick, 400)
    }
    tick()
  })
}

function startPreview() {
  const child = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
  })
  child.stderr?.on('data', (d) => process.stderr.write(d))
  return child
}

function routeToFile(route) {
  if (route === '/') return join(DIST, 'index.html')
  const clean = route.replace(/^\//, '').replace(/\/$/, '')
  return join(DIST, clean, 'index.html')
}

/** Evita SW/PWA manter rede activa — networkidle nunca resolve. */
async function preparePage(page) {
  await page.addInitScript(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register = () =>
        Promise.reject(new Error('service worker disabled during prerender'))
    }
  })
  await page.route('**/*', (route) => {
    const url = route.request().url()
    if (url.includes('google-analytics') || url.includes('googlesyndication')) {
      return route.abort()
    }
    return route.continue()
  })
}

async function captureRoute(page, route) {
  const url = `${BASE}${route}`
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForSelector('h1, main, #root', { timeout: 20_000 })
  // React hydration + meta tags (useBlogSeo)
  await page.waitForTimeout(800)
  const html = await page.content()
  const out = routeToFile(route)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html, 'utf8')
  console.log(`[prerender] ${route} → ${out.replace(DIST, 'dist')}`)
}

async function main() {
  const { chromium } = await import('@playwright/test')
  const routes = routesToPrerender()
  console.log(`[prerender] ${routes.length} rotas (Playwright headless)`)

  const preview = startPreview()
  try {
    await waitForServer(`${BASE}/`)
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await preparePage(page)

    for (const route of routes) {
      await captureRoute(page, route)
    }

    await browser.close()
    console.log('[prerender] concluído')
  } finally {
    preview.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error('[prerender] failed:', err.message)
  process.exit(1)
})
