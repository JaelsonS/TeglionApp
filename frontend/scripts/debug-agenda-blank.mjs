/**
 * Debug blank /app/firm/agenda on staging.
 */
import { chromium, devices } from 'playwright'

const BASE = process.env.STAGING_URL || 'https://staging.teglion.com'
const EMAIL = process.env.STAGING_EMAIL || ''
const PASSWORD = process.env.STAGING_PASSWORD || ''

async function login(page) {
  await page.goto(`${BASE}/auth/firm/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(600)
  return page.evaluate(
    async ({ email, password }) => {
      const csrfRes = await fetch('/api/csrf', { credentials: 'include' })
      if (!csrfRes.ok) return { ok: false, step: 'csrf', status: csrfRes.status }
      const { token } = await csrfRes.json()
      try {
        document.cookie = `csrfToken=${encodeURIComponent(token)}; path=/; SameSite=Lax`
      } catch {
        /* ignore */
      }
      const loginRes = await fetch('/api/auth/login-firm', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ email, password, rememberMe: true }),
      })
      return { ok: loginRes.ok, status: loginRes.status, body: (await loginRes.text()).slice(0, 200) }
    },
    { email: EMAIL.trim().toLowerCase(), password: PASSWORD },
  )
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('Missing STAGING_EMAIL/PASSWORD')
    process.exit(1)
  }
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: devices['Desktop Chrome'].userAgent,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror:${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console:${m.text()}`)
  })
  page.on('response', (res) => {
    if (res.url().includes('/assets/') && res.status() >= 400) {
      errors.push(`asset:${res.status()} ${res.url()}`)
    }
  })

  const loginResult = await login(page)
  console.log('login', loginResult)

  for (const path of ['/app/firm/dashboard', '/app/firm/agenda']) {
    errors.length = 0
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForTimeout(3500)
    const shell = await page.locator('[data-testid="firm-shell"]').count()
    const main = await page.locator('[data-testid="firm-main"]').innerText().catch(() => '')
    const rootHtml = await page.locator('#root').innerHTML().catch(() => '')
    console.log('\nPATH', path)
    console.log('url', page.url())
    console.log('shell', shell)
    console.log('mainLen', main.length)
    console.log('mainPreview', JSON.stringify(main.slice(0, 160)))
    console.log('rootLen', rootHtml.length)
    console.log('errors', errors.slice(0, 20))
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
