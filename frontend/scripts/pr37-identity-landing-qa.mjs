/**
 * PR #37 — QA landing identidade em staging (breakpoints + secções).
 */
import { chromium, devices } from 'playwright'

const BASE = process.env.STAGING_URL || 'https://staging.teglion.com'
const EMAIL = process.env.STAGING_EMAIL || ''
const PASSWORD = process.env.STAGING_PASSWORD || ''
const WIDTHS = [375, 390, 430, 768, 820, 1024, 1280, 1440]

const BAD_LEGAL_ENTITY = /Teglion,\s*(Lda|S\.A\.|SA)|Teglion é uma empresa|entidade jurídica independente|O Teglion actua como|O Teglion atua como Subcontratante/i

async function tryLogin(page) {
  if (!EMAIL || !PASSWORD) return false
  await page.goto(`${BASE}/auth/firm/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(600)
  const loginResult = await page.evaluate(
    async ({ email, password }) => {
      const csrfRes = await fetch('/api/csrf', { credentials: 'include' })
      if (!csrfRes.ok) return { ok: false, status: csrfRes.status, body: await csrfRes.text() }
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
  if (!loginResult.ok) {
    console.error('login failed', loginResult)
    return false
  }
  return true
}

async function landingAt(page, width) {
  await page.setViewportSize({ width, height: width >= 768 ? 900 : 812 })
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(1200)

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    const trust = document.getElementById('transparencia')
    const footer = document.querySelector('footer')
    const bodyText = document.body?.innerText || ''
    const faqHit = /Quem desenvolve o Teglion\?/i.test(bodyText)
    const trustText = trust?.innerText || ''
    const footerText = footer?.innerText || ''
    const footerLinks = footer
      ? Array.from(footer.querySelectorAll('a')).map((a) => ({
          href: a.getAttribute('href') || '',
          label: (a.textContent || '').trim(),
        }))
      : []
    return {
      overflowX: doc.scrollWidth > doc.clientWidth + 1,
      hasTrust: !!trust,
      trustOk:
        /plataforma da AfDigital|produto da AfDigital|desenvolvida e operada/i.test(trustText) &&
        /escritório mantém a responsabilidade/i.test(trustText),
      productLine: /Teglion · Um produto da AfDigital/i.test(bodyText),
      faqVisible: faqHit,
      footerProductLine: /Teglion · Um produto da AfDigital/i.test(footerText),
      footerResponsibility: /Termos de Utilização|Política de Privacidade/i.test(footerText),
      footerLinks,
      bodySnippetBad: bodyText.match(/Teglion,\s*(Lda|S\.A\.)|Teglion é uma empresa/i)?.[0] || null,
    }
  })

  // Expand FAQ item if present
  const faqBtn = page.getByRole('button', { name: /Quem desenvolve o Teglion/i })
  let faqAnswerOk = false
  if ((await faqBtn.count()) > 0) {
    await faqBtn.first().click()
    await page.waitForTimeout(400)
    const ans = await page.locator('body').innerText()
    faqAnswerOk =
      /AfDigital/i.test(ans) &&
      /produto/i.test(ans) &&
      !/Teglion,\s*(Lda|S\.A\.)/i.test(ans)
  }

  const requiredLabels = [
    'Sobre a AfDigital',
    'Ajuda e suporte',
    'Termos',
    'Privacidade',
    'Cookies',
    'DPA',
    'Aviso Legal',
  ]
  const labels = metrics.footerLinks.map((l) => l.label)
  const linksOk = requiredLabels.every((l) => labels.some((x) => x.includes(l)))

  const external = metrics.footerLinks.filter(
    (l) =>
      /^https?:\/\//.test(l.href) ||
      l.href.startsWith('mailto:') ||
      l.href.startsWith('tel:') ||
      /wa\.me|afdigitalweb|instagram|facebook|linkedin/i.test(l.href),
  )

  const ok =
    !metrics.overflowX &&
    metrics.hasTrust &&
    metrics.trustOk &&
    metrics.productLine &&
    metrics.footerProductLine &&
    metrics.footerResponsibility &&
    linksOk &&
    faqAnswerOk &&
    !metrics.bodySnippetBad

  return {
    ok,
    width,
    overflowX: metrics.overflowX,
    trustOk: metrics.trustOk,
    productLine: metrics.productLine,
    faqAnswerOk,
    footerOk: metrics.footerProductLine && metrics.footerResponsibility && linksOk,
    externalCount: external.length,
    bad: metrics.bodySnippetBad,
  }
}

async function settingsAbout(page) {
  await tryLogin(page)
  await page.goto(`${BASE}/app/firm/settings?tab=sobre`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await page.waitForTimeout(2000)
  const text = await page.locator('[data-testid="firm-about-panel"]').innerText().catch(() => '')
  const ok =
    /AfDigital/i.test(text) &&
    /produto/i.test(text) &&
    /não uma empresa independente/i.test(text) &&
    !BAD_LEGAL_ENTITY.test(text)
  return { ok, hasPanel: !!text, snippet: text.slice(0, 180).replace(/\s+/g, ' ') }
}

async function main() {
  console.log('BASE=', BASE)
  const browser = await chromium.launch({ headless: true })
  const results = []

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: devices['Desktop Chrome'].userAgent,
  })
  const page = await ctx.newPage()

  for (const width of WIDTHS) {
    const r = await landingAt(page, width)
    results.push(r)
    console.log(
      `LANDING ${width}: ${r.ok ? 'PASS' : 'FAIL'} trust=${r.trustOk} faq=${r.faqAnswerOk} footer=${r.footerOk} ox=${r.overflowX}`,
    )
  }

  const about = await settingsAbout(page)
  console.log('SETTINGS_SOBRE:', about.ok ? 'PASS' : 'FAIL', about.snippet)

  // Spot-check external destinations from footer at 1280
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(800)
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('footer a'))
      .map((a) => a.getAttribute('href') || '')
      .filter(Boolean),
  )
  const expectedHosts = [
    'afdigitalweb.com',
    'instagram.com/afdigitalweb',
    'facebook.com/afdigitalsolucoestecnologicas',
    'linkedin.com/company/137384112',
    'wa.me/',
  ]
  const hostOk = expectedHosts.every((h) => hrefs.some((u) => u.includes(h)))
  console.log('FOOTER_EXTERNAL_HOSTS:', hostOk ? 'PASS' : 'FAIL', hrefs.filter((u) => /^https?:/.test(u)).slice(0, 12))

  await browser.close()

  const landingPass = results.every((r) => r.ok)
  const overall = landingPass && about.ok && hostOk
  console.log('\nSUMMARY', {
    landingPass,
    settingsSobre: about.ok,
    footerExternals: hostOk,
    overall: overall ? 'PASS' : 'FAIL',
  })
  process.exit(overall ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
