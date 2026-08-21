import { expect, gotoPlayground, stubImageRequests, test } from './helpers'

test('lightbox chrome mirrors under direction: rtl', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page)

  await page.locator('.np-album__item').first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  const prev = page.locator('.np-lightbox__btn--prev')
  const next = page.locator('.np-lightbox__btn--next')
  await expect(prev).toBeVisible()
  await expect(next).toBeVisible()

  // LTR: previous sits on the left of next.
  const ltr = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)!.getBoundingClientRect()
      return { start: rect.left, end: rect.right }
    }
    return { prev: box('.np-lightbox__btn--prev'), next: box('.np-lightbox__btn--next') }
  })
  expect(ltr.prev.end).toBeLessThanOrEqual(ltr.next.start)

  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl')
  })

  // RTL: the inline-start/end anchors flip, so previous sits to the right.
  const rtl = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)!.getBoundingClientRect()
      return { start: rect.left, end: rect.right }
    }
    return { prev: box('.np-lightbox__btn--prev'), next: box('.np-lightbox__btn--next') }
  })
  expect(rtl.next.end).toBeLessThanOrEqual(rtl.prev.start)

  // Counter announces slide changes without stealing focus.
  await expect(
    page.locator('[data-np-motion="controls"] [data-np-sr-only][aria-live="polite"]'),
  ).toContainText('Slide 1 of')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('carousel mirrors controls and navigation under direction: rtl', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/carousel')
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'))

  const carousel = page.locator('.np-carousel').first()
  const counter = carousel.locator('.np-carousel__counter')
  await expect(counter).toContainText('1 / 12')

  await carousel.getByRole('button', { name: 'Next slide' }).click()
  await expect(counter).toContainText('2 / 12')
  await carousel.locator('.np-carousel__thumb').nth(3).click()
  await expect(counter).toContainText('4 / 12')

  const positions = await carousel.evaluate((root) => {
    const prev = root.querySelector('.np-carousel__arrow--prev')!.getBoundingClientRect()
    const next = root.querySelector('.np-carousel__arrow--next')!.getBoundingClientRect()
    return { prevLeft: prev.left, nextLeft: next.left }
  })
  expect(positions.prevLeft).toBeGreaterThan(positions.nextLeft)
})
