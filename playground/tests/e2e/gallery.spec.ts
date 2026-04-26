import type { Locator, Page } from '@playwright/test'
import { expect, stubImageRequests, test } from './helpers'

async function dispatchPointerPinch(
  media: Locator,
  start: { x1: number; y1: number; x2: number; y2: number },
  end: { x1: number; y1: number; x2: number; y2: number },
) {
  await media.evaluate(
    (el, { start, end }) => {
      const dispatch = (
        type: string,
        pointerId: number,
        clientX: number,
        clientY: number,
      ) => {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId,
            pointerType: 'touch',
            isPrimary: pointerId === 1,
            clientX,
            clientY,
          }),
        )
      }

      dispatch('pointerdown', 1, start.x1, start.y1)
      dispatch('pointerdown', 2, start.x2, start.y2)

      const steps = 6
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps
        dispatch('pointermove', 1, start.x1 + (end.x1 - start.x1) * t, start.y1)
        dispatch('pointermove', 2, start.x2 + (end.x2 - start.x2) * t, start.y2)
      }

      dispatch('pointerup', 1, end.x1, end.y1)
      dispatch('pointerup', 2, end.x2, end.y2)
    },
    { start, end },
  )
}

async function currentSlideScale(page: Page) {
  return page
    .locator('.np-lightbox__slide')
    .first()
    .locator('[data-np-slide-zoom]')
    .evaluate((el) => {
      const match = getComputedStyle(el).transform.match(/^matrix\(([^)]+)\)$/)
      if (!match) return 1
      return Number(match[1]!.split(',')[0])
    })
}

async function waitForSpringFrame() {
  await new Promise((resolve) => setTimeout(resolve, 50))
}

test('recipe gallery opens, navigates, zooms, and closes cleanly', async ({
  page,
}) => {
  await stubImageRequests(page)
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

test.describe('touch gestures', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  })

  test('recipe lightbox supports automated two-finger pinch zoom', async ({
    page,
  }) => {
    await stubImageRequests(page)
    await page.goto('/')

    await page.locator('.np-album__item').first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Zoom' })).toBeEnabled()

    const media = page.locator('.np-lightbox__media')
    await expect(media).toBeVisible()

    const box = await media.boundingBox()
    expect(box).not.toBeNull()

    const centerX = box!.x + box!.width / 2
    const centerY = box!.y + box!.height / 2
    await dispatchPointerPinch(
      media,
      {
        x1: centerX - 40,
        y1: centerY,
        x2: centerX + 40,
        y2: centerY,
      },
      {
        x1: centerX - 130,
        y1: centerY,
        x2: centerX + 130,
        y2: centerY,
      },
    )

    await waitForSpringFrame()
    await expect(media).toHaveAttribute('data-zoomed', 'true')
    await expect.poll(() => currentSlideScale(page)).toBeGreaterThan(1)

    await dialog.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
