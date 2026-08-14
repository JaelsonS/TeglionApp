/**
 * Bloco 1 — smoke browser em staging.
 *
 * Sem credenciais: valida redirect + login sem scroll horizontal nos 7 widths.
 * Com STAGING_EMAIL + STAGING_PASSWORD: valida chrome mobile/tablet/desktop autenticado.
 */
import { chromium, devices } from 'playwright'

const BASE = process.env.STAGING_URL || 'https://staging.teglion.com'
const EMAIL = process.env.STAGING_EMAIL || ''
const PASSWORD = process.env.STAGING_PASSWORD || ''
const WIDTHS = [375, 390, 430, 768, 1024, 1280, 1440]

function band(w) {
  if (w < 768) return 'mobile'
  if (w < 1280) return 'tablet'
  return 'desktop'
}

/**
 * Login via fetch no browser (cookies + Origin correctos).
 * Evita Turnstile no widget (headless deixa «Entrar» disabled).
 * Em staging o backend faz skip Turnstile sem token.
 */
async function tryLogin(page) {
  if (!EMAIL || !PASSWORD) return false
  await page.goto(`${BASE}/auth/firm/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForTimeout(800)

  const loginResult = await page.evaluate(async ({ email, password }) => {
    const csrfRes = await fetch('/api/csrf', { credentials: 'include' })
    if (!csrfRes.ok) {
      return { ok: false, step: 'csrf', status: csrfRes.status, body: await csrfRes.text() }
    }
    const csrfJson = await csrfRes.json()
    const token = csrfJson?.token
    if (!token) return { ok: false, step: 'csrf', status: csrfRes.status, body: 'missing token' }

    const loginRes = await fetch('/api/auth/login-firm', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
      },
      body: JSON.stringify({ email, password, rememberMe: true }),
    })
    const body = await loginRes.text()
    return { ok: loginRes.ok, step: 'login', status: loginRes.status, body: body.slice(0, 400) }
  }, { email: EMAIL.trim().toLowerCase(), password: PASSWORD })

  if (!loginResult.ok) {
    console.error('login failed', loginResult.step, loginResult.status, loginResult.body)
    return false
  }

  await page.goto(`${BASE}/app/firm/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await page.waitForTimeout(2500)
  return (await page.locator('[data-testid="firm-shell"]').count()) > 0
}

async function measureShell(page) {
  const hasFirmShell = (await page.locator('[data-testid="firm-shell"]').count()) > 0
  if (!hasFirmShell) {
    return { hasFirmShell: false, railDisplay: null, mobileNavDisplay: null, desktopDisplay: null }
  }
  const railDisplay = await page
    .locator('[data-testid="firm-tablet-rail-aside"]')
    .evaluate((el) => getComputedStyle(el).display)
  const mobileNavDisplay = await page
    .locator('[data-testid="firm-mobile-nav-host"]')
    .evaluate((el) => getComputedStyle(el).display)
  const desktopDisplay = await page
    .locator('[data-testid="firm-desktop-sidebar-aside"]')
    .evaluate((el) => getComputedStyle(el).display)
  return { hasFirmShell, railDisplay, mobileNavDisplay, desktopDisplay }
}

function chromeOkFor(expected, m) {
  if (!m.hasFirmShell) return null
  const railVisible = m.railDisplay && m.railDisplay !== 'none'
  const mobileVisible = m.mobileNavDisplay && m.mobileNavDisplay !== 'none'
  const desktopVisible = m.desktopDisplay && m.desktopDisplay !== 'none'
  if (expected === 'mobile') return mobileVisible && !railVisible && !desktopVisible
  if (expected === 'tablet') return railVisible && !mobileVisible && !desktopVisible
  return desktopVisible && !mobileVisible && !railVisible
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const results = []
  let loggedIn = false

  if (EMAIL && PASSWORD) {
    const boot = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: devices['Desktop Chrome'].userAgent,
    })
    const bootPage = await boot.newPage()
    loggedIn = await tryLogin(bootPage)
    await boot.close()
  }

  for (const width of WIDTHS) {
    const height = width >= 768 ? 900 : 800
    const context = await browser.newContext({
      viewport: { width, height },
      userAgent: devices['Desktop Chrome'].userAgent,
    })
    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(String(err)))

    if (EMAIL && PASSWORD) {
      await tryLogin(page)
    } else {
      await page.goto(`${BASE}/app/firm/dashboard`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForTimeout(2000)
    }

    const finalUrl = page.url()
    const onLogin =
      /login|auth|entrar|sign-in/i.test(finalUrl) ||
      (await page.locator('input[type="email"], input[name="email"]').count()) > 0

    const shell = await measureShell(page)
    const expected = band(width)
    const chromeOk = chromeOkFor(expected, shell)

    const scroll = await page.evaluate(() => ({
      docWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    const hScroll = scroll.docWidth > scroll.clientWidth + 2

    const loginFormVisible = onLogin
      ? (await page.locator('input[type="email"], input[name="email"]').first().isVisible().catch(() => false)) &&
        (await page.locator('button[type="submit"]').first().isVisible().catch(() => false))
      : null

    results.push({
      width,
      band: expected,
      finalUrl: finalUrl.replace(/\?.*$/, ''),
      onLogin,
      loginFormVisible,
      hasFirmShell: shell.hasFirmShell,
      chromeOk,
      railDisplay: shell.railDisplay,
      mobileNavDisplay: shell.mobileNavDisplay,
      desktopDisplay: shell.desktopDisplay,
      hScroll,
      consoleErrors: consoleErrors.filter((t) => !t.includes('401') && !t.includes('font-size:0')).slice(0, 5),
    })

    await context.close()
  }

  await browser.close()

  const authed = results.filter((r) => r.hasFirmShell)
  const loginSmokePass = results.every((r) => !r.hScroll && (r.hasFirmShell || r.loginFormVisible))
  let status
  if (EMAIL && PASSWORD && !loggedIn && authed.length === 0) status = 'AUTH_FAILED'
  else if (authed.length === 0) status = loginSmokePass ? 'PARTIAL_LOGIN_SMOKE_PASS' : 'FAIL'
  else status = results.every((r) => r.chromeOk && !r.hScroll) ? 'PASS' : 'FAIL'

  const summary = {
    base: BASE,
    authAttempted: Boolean(EMAIL && PASSWORD),
    authenticatedShellSamples: authed.length,
    status,
    results,
  }
  console.log(JSON.stringify(summary, null, 2))
  if (status === 'FAIL' || status === 'AUTH_FAILED') process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
