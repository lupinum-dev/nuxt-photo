import { expect, gotoPlayground, stubImageRequests, test } from './helpers'

test('renders carousel slides and thumbnails', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/carousel')

  const carousel = page.locator('.np-carousel').first()
  await expect(carousel).toBeVisible()
  await expect(carousel.locator('.np-carousel__slide')).toHaveCount(12)
  await expect(carousel.locator('.np-carousel__thumb')).toHaveCount(12)
})

test('arrow navigation advances the counter', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/carousel')

  const carousel = page.locator('.np-carousel').first()
  const counter = carousel.locator('.np-carousel__counter')
  await expect(counter).toContainText('1 / 12')

  await carousel.getByRole('button', { name: 'Next slide' }).click()
  await expect(counter).toContainText('2 / 12')
})

test('rapid arrow navigation keeps all ten pointer presses after settling', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/lab/carousel')

  const carousel = page.locator('.np-carousel').first()
  const counter = carousel.locator('.np-carousel__counter')
  await carousel.locator('.np-carousel__thumb').nth(19).click()
  await expect(counter).toContainText('20 / 40')
  await page.waitForTimeout(1500)

  const next = carousel.getByRole('button', { name: 'Next slide' })
  await next.scrollIntoViewIfNeeded()
  const box = await next.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  for (let press = 0; press < 10; press++) {
    await page.mouse.down()
    await page.mouse.up()
    await page.waitForTimeout(80)
  }
  // Check the settled counter: mouse-up can undo navigation during Embla's animation.
  await page.waitForTimeout(1500)
  await expect(counter).toContainText('30 / 40')
})

test('thumbnail click syncs to main carousel', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/carousel')

  const carousel = page.locator('.np-carousel').first()
  await carousel.locator('.np-carousel__thumb').nth(3).click()
  await expect(carousel.locator('.np-carousel__counter')).toContainText('4 / 12')
})

test('toggling lightbox keeps slides draggable and enables slide click to open dialog', async ({
  page,
}) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/carousel')

  await page.getByLabel('Lightbox').check()

  const carousel = page.locator('.np-carousel').first()
  const firstSlide = carousel.locator('.np-carousel__slide').first()
  await expect(firstSlide).toHaveAttribute('role', 'button')
  await firstSlide.scrollIntoViewIfNeeded()
  const box = await firstSlide.boundingBox()
  expect(box).not.toBeNull()
  const x = box!.x + box!.width * 0.75
  const y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - box!.width * 0.6, y, { steps: 15 })
  await page.waitForTimeout(100)
  await page.mouse.up()
  await page.waitForTimeout(1500)
  await expect(carousel.locator('.np-carousel__counter')).toContainText('2 / 12')
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const secondSlide = carousel.locator('.np-carousel__slide').nth(1)
  const secondBox = await secondSlide.boundingBox()
  expect(secondBox).not.toBeNull()
  await page.mouse.move(secondBox!.x + secondBox!.width / 2, secondBox!.y + secondBox!.height / 2)
  await page.mouse.down()
  await page.mouse.up()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('hiding arrows via control removes them from the DOM', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/carousel')

  const carousel = page.locator('.np-carousel').first()
  await expect(carousel.locator('.np-carousel__arrow')).toHaveCount(2)

  await page.getByLabel('Arrows').uncheck()
  await expect(carousel.locator('.np-carousel__arrow')).toHaveCount(0)
})
