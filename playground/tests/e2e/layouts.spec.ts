import { expect, test } from '@playwright/test'

test('layout explorer switches layouts and still opens the lightbox', async ({ page }) => {
  await page.goto('/layouts')

  for (const name of ['rows', 'columns', 'masonry', 'bento'] as const) {
    await page.getByRole('button', { name }).click()
    await expect(page.locator('.np-album__item')).toHaveCount(12)
  }

  await page.locator('.np-album__item').nth(1).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')

  await expect(dialog.getByRole('button', { name: 'Close' })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
