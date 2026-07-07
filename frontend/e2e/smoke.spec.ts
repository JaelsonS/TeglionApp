import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/csrf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'e2e-csrf-token' }),
    })
  })

  await page.route('**/api/public/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    })
  })
})

test.describe('Smoke público', () => {
  test('landing carrega', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Teglion/i)
  })

  test('pricing acessível', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('case-studies acessível', async ({ page }) => {
    await page.goto('/case-studies')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Auth shells', () => {
  test('login escritório renderiza', async ({ page }) => {
    await page.goto('/auth/firm/login')
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('login cliente renderiza', async ({ page }) => {
    await page.goto('/auth/client/login')
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })
})
