import { expect, test } from '@playwright/test'

test('recipe gallery opens, navigates, zooms, and closes cleanly', async ({
  page,
}) => {
  await page.goto('/')

  await page.locator('.np-album__item').first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('.np-lightbox__counter')).toContainText('1 / 12')
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe('hidden')

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')

  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.locator('.np-lightbox__counter')).toContainText('1 / 12')

  await expect(page.getByRole('button', { name: 'Zoom' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe('')
})
