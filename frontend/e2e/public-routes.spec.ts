import { expect, test } from '@playwright/test'

/** Smoke local — rotas públicas da SPA (dev server no CI). */
test.describe('public routes (local dev)', () => {
  test('slug desconhecido mostra página controlada (não crash)', async ({ page }) => {
    const res = await page.goto('/escritorio-inexistente-e2e-xyz', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('página pública Teglion comercial mantém crédito AfDigital', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toContainText(/AfDigital/i)
  })
})
