import { expect, test } from '@playwright/test'

test.describe('public commercial smoke', () => {
  test('landing identifies Teglion as an AfDigital product', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('body')).toContainText(/AfDigital/i)
  })

  test('legal pages do not treat Teglion as a company', async ({ page }) => {
    await page.goto('/aviso-legal')
    await expect(page.getByRole('heading', { name: 'Aviso Legal' })).toBeVisible()
    await expect(page.locator('body')).toContainText('AfDigital — Soluções Tecnológicas')
    await expect(page.locator('body')).toContainText('não é uma empresa')
    await expect(page.locator('body')).not.toContainText('O Teglion actua como Subcontratante')

    await page.goto('/privacidade')
    await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible()
    await expect(page.locator('body')).toContainText('AfDigital — Soluções Tecnológicas')
    await expect(page.locator('body')).not.toContainText('O Teglion actua como Subcontratante')
  })

  test('firm login page loads', async ({ page }) => {
    await page.goto('/auth/firm/login')
    await expect(page.locator('body')).toContainText(/entrar|login|e-mail|email/i)
  })
})
