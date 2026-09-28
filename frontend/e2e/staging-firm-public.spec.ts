import { expect, test } from '@playwright/test'

const stagingBase = (process.env.E2E_STAGING_BASE_URL || '').replace(/\/$/, '')
const firmSlug = process.env.E2E_STAGING_FIRM_SLUG || 'silva-associados'

test.describe('staging — página pública do escritório', () => {
  test.beforeEach(() => {
    test.skip(!stagingBase, 'Defina E2E_STAGING_BASE_URL (ex.: https://staging.teglion.com)')
  })

  test('silva-associados carrega destaque e catálogo sem erro', async ({ page }) => {
    const res = await page.goto(`${stagingBase}/${firmSlug}`, { waitUntil: 'domcontentloaded' })
    expect(res?.ok(), `HTTP ${res?.status()} em /${firmSlug}`).toBeTruthy()

    await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)

    const hero = page.getByTestId('public-site-hero-surface')
    await expect(hero).toBeVisible({ timeout: 20_000 })

    const featured = page.getByTestId('public-site-featured-services')
    await expect(featured).toBeVisible({ timeout: 15_000 })

    await expect(page.locator('body')).toContainText(/Silva/i)
  })

  test('página de serviços públicos responde', async ({ page }) => {
    await page.goto(`${stagingBase}/${firmSlug}`, { waitUntil: 'domcontentloaded' })
    const servicosLink = page.getByRole('link', { name: /serviços/i }).first()
    if (await servicosLink.isVisible().catch(() => false)) {
      await servicosLink.click()
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
