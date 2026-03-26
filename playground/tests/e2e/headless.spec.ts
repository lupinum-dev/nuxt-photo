import { expect, test } from '@playwright/test'

test('headless playground wiring works through useLightbox', async ({ page }) => {
  await page.goto('/headless')

  await page.locator('.grid__item').first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('.hl__counter')).toContainText('1/12')

  await dialog.getByRole('button', { name: 'Next' }).click()
  await expect(page.locator('.hl__counter')).toContainText('2/12')

  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
