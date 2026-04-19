import { expect, test } from '@playwright/test'

test('renders carousel slides and thumbnails', async ({ page }) => {
  await page.goto('/carousel')

  const carousel = page.locator('.np-carousel').first()
  await expect(carousel).toBeVisible()
  await expect(carousel.locator('.np-carousel__slide')).toHaveCount(12)
  await expect(carousel.locator('.np-carousel__thumb')).toHaveCount(12)
})

test('arrow navigation advances the counter', async ({ page }) => {
  await page.goto('/carousel')

  const carousel = page.locator('.np-carousel').first()
  const counter = carousel.locator('.np-carousel__counter')
  await expect(counter).toContainText('1 / 12')

  await carousel.getByRole('button', { name: 'Next slide' }).click()
  await expect(counter).toContainText('2 / 12')
})

test('thumbnail click syncs to main carousel', async ({ page }) => {
  await page.goto('/carousel')

  const carousel = page.locator('.np-carousel').first()
  await carousel.locator('.np-carousel__thumb').nth(3).click()
  await expect(carousel.locator('.np-carousel__counter')).toContainText('4 / 12')
})

test('toggling lightbox enables slide click to open dialog', async ({ page }) => {
  await page.goto('/carousel')

  await page.getByLabel('Lightbox').check()

  const carousel = page.locator('.np-carousel').first()
  await carousel.locator('.np-carousel__slide').first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('hiding arrows via control removes them from the DOM', async ({ page }) => {
  await page.goto('/carousel')

  const carousel = page.locator('.np-carousel').first()
  await expect(carousel.locator('.np-carousel__arrow')).toHaveCount(2)

  await page.getByLabel('Arrows').uncheck()
  await expect(carousel.locator('.np-carousel__arrow')).toHaveCount(0)
})
