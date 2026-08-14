/**
 * PR #36 — QA visual: footer autenticado, Definições, landing.
 * Usa STAGING_URL (preview Vercel ou staging) + STAGING_EMAIL/PASSWORD.
 */
import { chromium, devices } from 'playwright'

const BASE = process.env.STAGING_URL || 'https://staging.teglion.com'
const EMAIL = process.env.STAGING_EMAIL || ''
const PASSWORD = process.env.STAGING_PASSWORD || ''
const WIDTHS = [375, 390, 430, 768, 820, 1024, 1280, 1440]

async function tryLogin(page) {
  if (!EMAIL || !PASSWORD) return false
  await page.goto(`${BASE}/auth/firm/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(800)

  // PWA SW can keep stale unauthenticated shells during local QA.
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map((r) => r.unregister()))
  })

  const loginResult = await page.evaluate(
    async ({ email, password }) => {
      const csrfRes = await fetch('/api/csrf', { credentials: 'include' })
      if (!csrfRes.ok) {
        return { ok: false, step: 'csrf', status: csrfRes.status, body: await csrfRes.text() }
      }
      const csrfJson = await csrfRes.json()
      const token = csrfJson?.token
      if (!token) return { ok: false, step: 'csrf', status: csrfRes.status, body: 'missing token' }

      // Em HTTP local o Set-Cookie pode vir com Secure e o browser não grava —
      // forçamos o cookie CSRF via document para o header bater certo.
      try {
        document.cookie = `csrfToken=${encodeURIComponent(token)}; path=/; SameSite=Lax`
      } catch {
        /* ignore */
      }

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
    },
    { email: EMAIL.trim().toLowerCase(), password: PASSWORD },
  )

  if (!loginResult.ok) {
    console.error('login failed', loginResult)
    return false
  }

  await page.goto(`${BASE}/app/firm/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(2500)
  return (await page.locator('[data-testid="firm-shell"]').count()) > 0
}

async function footerChecks(page, width) {
  const footer = page.locator('[data-testid="firm-shell-footer"]')
  const hasFooter = (await footer.count()) > 0
  if (!hasFooter) {
    return { ok: false, reason: 'footer missing', text: '', height: 0, overflowX: false, links: [] }
  }

  const text = ((await footer.innerText()) || '').replace(/\s+/g, ' ').trim()
  const box = await footer.boundingBox()
  const height = box?.height ?? 0

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    const overflowX = doc.scrollWidth > doc.clientWidth + 1
    const footerEl = document.querySelector('[data-testid="firm-shell-footer"]')
    const main = document.querySelector('[data-testid="firm-main"]')
    const links = footerEl
      ? Array.from(footerEl.querySelectorAll('a')).map((a) => (a.textContent || '').trim())
      : []
    const navLabels = footerEl
      ? Array.from(footerEl.querySelectorAll('nav a')).map((a) => (a.textContent || '').trim())
      : []
    let contentHiddenByFooter = false
    if (footerEl && main) {
      const fr = footerEl.getBoundingClientRect()
      const mr = main.getBoundingClientRect()
      // main bottom should not be under the footer viewport in a stuck way beyond normal flow
      contentHiddenByFooter = mr.bottom > window.innerHeight + 2 && fr.height > 72
    }
    return {
      overflowX,
      links,
      navLabels,
      footerOnlyCredit:
        !navLabels.length &&
        /Desenvolvido por/i.test(footerEl?.innerText || '') &&
        /AfDigital/i.test(footerEl?.innerText || ''),
      scrollHeight: doc.scrollHeight,
      clientHeight: doc.clientHeight,
      contentHiddenByFooter,
    }
  })

  const forbidden =
    /Ajuda e suporte|Sobre o Teglion|Privacidade|Termos|WhatsApp|Instagram|LinkedIn/i.test(text)
  const hasOnlyCredit =
    metrics.footerOnlyCredit &&
    text.includes('Desenvolvido por') &&
    text.includes('AfDigital') &&
    !forbidden

  const compact = height <= (width < 768 ? 48 : 56)
  const ok = hasOnlyCredit && compact && !metrics.overflowX && !metrics.contentHiddenByFooter

  return {
    ok,
    text,
    height: Math.round(height),
    overflowX: metrics.overflowX,
    hasOnlyCredit,
    compact,
    forbidden,
    contentHiddenByFooter: metrics.contentHiddenByFooter,
    links: metrics.links,
  }
}

async function settingsChecks(page) {
  await page.goto(`${BASE}/app/firm/settings?tab=ajuda`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await page.waitForTimeout(1500)
  const help = page.locator('[data-testid="firm-help-support-panel"]')
  const helpOk = (await help.count()) > 0
  const helpText = helpOk ? await help.innerText() : ''
  const hasWa = /WhatsApp/i.test(helpText)
  const hasMail = /Email|e-mail/i.test(helpText)
  const hasPhone = /Telefone|Ligar/i.test(helpText)

  await page.goto(`${BASE}/app/firm/settings?tab=sobre`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await page.waitForTimeout(1500)
  const about = page.locator('[data-testid="firm-about-panel"]')
  const aboutOk = (await about.count()) > 0
  const aboutText = aboutOk ? await about.innerText() : ''
  const productOf =
    /produto/i.test(aboutText) && /AfDigital/i.test(aboutText) && /Teglion/i.test(aboutText)
  const socials =
    /Instagram/i.test(aboutText) && /Facebook/i.test(aboutText) && /LinkedIn/i.test(aboutText)
  const legal =
    /Termos/i.test(aboutText) &&
    /Privacidade/i.test(aboutText) &&
    /Cookies/i.test(aboutText) &&
    /DPA/i.test(aboutText) &&
    /Aviso Legal/i.test(aboutText)

  // tabs visible in settings nav
  const tabsText = await page.locator('body').innerText()
  const tabsVisible = /Ajuda e suporte|Ajuda/i.test(tabsText) && /Sobre/i.test(tabsText)

  return {
    ok: helpOk && aboutOk && hasWa && hasMail && hasPhone && productOf && socials && legal && tabsVisible,
    helpOk,
    hasWa,
    hasMail,
    hasPhone,
    productOf,
    socials,
    legal,
    tabsVisible,
  }
}

async function landingChecks(page, width) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(1200)
  const footer = page.locator('footer').last()
  const has = (await footer.count()) > 0
  const text = has ? ((await footer.innerText()) || '').replace(/\s+/g, ' ').trim() : ''
  const box = await footer.boundingBox()
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      overflowX: doc.scrollWidth > doc.clientWidth + 1,
    }
  })
  const groups =
    /Legal/i.test(text) &&
    /AfDigital/i.test(text) &&
    /Contacto|WhatsApp/i.test(text) &&
    /Privacidade|Termos/i.test(text) &&
    /Instagram|Facebook|LinkedIn/i.test(text)
  const notAuthMinimalOnly = !(
    text === 'Desenvolvido por AfDigital — Soluções Tecnológicas' ||
    /^Desenvolvido por/.test(text.trim()) && text.length < 80
  )
  return {
    ok: has && groups && !metrics.overflowX && notAuthMinimalOnly,
    height: Math.round(box?.height || 0),
    overflowX: metrics.overflowX,
    groups,
    snippet: text.slice(0, 180),
  }
}

async function main() {
  console.log('BASE=', BASE)
  const browser = await chromium.launch({ headless: true })
  const results = { footer: [], settings: null, landing: [], loginOk: false }

  let storageState = null
  const boot = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: devices['Desktop Chrome'].userAgent,
  })
  const bootPage = await boot.newPage()
  results.loginOk = await tryLogin(bootPage)

  if (results.loginOk) {
    results.settings = await settingsChecks(bootPage)
    console.log('SETTINGS:', results.settings.ok ? 'PASS' : 'FAIL', JSON.stringify(results.settings))
    storageState = await boot.storageState()
  } else {
    console.error('AUTH_LOGIN_FAILED — cannot QA authenticated footer/settings')
  }
  await boot.close()

  for (const width of WIDTHS) {
    const height = width >= 768 ? 900 : 812
    const context = await browser.newContext({
      viewport: { width, height },
      userAgent: devices['Desktop Chrome'].userAgent,
      ...(storageState ? { storageState } : {}),
    })
    const page = await context.newPage()

    if (results.loginOk) {
      await page.goto(`${BASE}/app/firm/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await page.waitForTimeout(2000)
      const f = await footerChecks(page, width)
      results.footer.push({ width, ...f })
      console.log(
        `FOOTER ${width}: ${f.ok ? 'PASS' : 'FAIL'} h=${f.height} credit=${f.hasOnlyCredit} compact=${f.compact} ox=${f.overflowX} text="${f.text}"`,
      )
    }

    const l = await landingChecks(page, width)
    results.landing.push({ width, ...l })
    console.log(`LANDING ${width}: ${l.ok ? 'PASS' : 'FAIL'} h=${l.height} groups=${l.groups} ox=${l.overflowX}`)

    await context.close()
  }

  await browser.close()

  const footerPass = results.footer.length && results.footer.every((r) => r.ok)
  const landingPass = results.landing.every((r) => r.ok)
  const settingsPass = results.settings?.ok === true
  const overall = results.loginOk && footerPass && landingPass && settingsPass
  console.log('\nSUMMARY', {
    loginOk: results.loginOk,
    footerPass,
    landingPass,
    settingsPass,
    overall: overall ? 'PASS' : 'FAIL',
  })
  process.exit(overall ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
