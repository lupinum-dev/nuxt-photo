import type { Locator, Page } from '@playwright/test'
import { expect, gotoPlayground, stubImageRequests, test } from './helpers'

async function dispatchPointerPinch(
  media: Locator,
  start: { x1: number; y1: number; x2: number; y2: number },
  end: { x1: number; y1: number; x2: number; y2: number },
) {
  await media.evaluate(
    (el, { start, end }) => {
      const dispatch = (type: string, pointerId: number, clientX: number, clientY: number) => {
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

test('recipe gallery opens, navigates, zooms, and closes cleanly', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page)

  await page.locator('.np-album__item').first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('[data-np-slide-frame]')).toHaveCount(12)
  await expect(page.locator('[data-np-slide-img]')).toHaveCount(3)
  await expect(page.locator('.np-lightbox__counter')).toContainText('1 / 12')
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  const nextButton = page.getByRole('button', { name: 'Next' })
  await expect(nextButton).toBeEnabled()
  await nextButton.click({ force: true })
  await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')

  const previousButton = page.getByRole('button', { name: 'Previous' })
  await expect(previousButton).toBeEnabled()
  await previousButton.click({ force: true })
  await expect(page.locator('.np-lightbox__counter')).toContainText('1 / 12')

  await expect(page.getByRole('button', { name: 'Zoom' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('')
})

test('lightbox motion exposes one deterministic WAAPI timeline', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page)

  const tracks = await page
    .locator('.np-album__item')
    .first()
    .evaluate(async (trigger) => {
      ;(trigger as HTMLElement).click()
      for (let frame = 0; frame < 10; frame += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        if (document.getAnimations().length >= 5) break
      }

      return document.getAnimations().map((animation) => {
        animation.pause()
        const effect = animation.effect as KeyframeEffect
        const target = effect.target as HTMLElement
        const timing = effect.getTiming()
        return {
          target:
            target.getAttribute('data-np-motion') ||
            (target.hasAttribute('data-np-transition-frame') ? 'frame' : '') ||
            (target.hasAttribute('data-np-transition-shadow') ? 'shadow' : ''),
          delay: Number(timing.delay),
          duration: Number(timing.duration),
        }
      })
    })

  const byTarget = Object.fromEntries(tracks.map((track) => [track.target, track]))
  expect(byTarget.frame).toMatchObject({ delay: 0, duration: 420 })
  expect(byTarget.backdrop).toMatchObject({ delay: 0, duration: 294 })
  expect(byTarget.shadow).toMatchObject({ delay: 147, duration: 210 })
  expect(byTarget.controls?.delay).toBeCloseTo(231)
  expect(byTarget.controls?.duration).toBe(147)
})

test('responsive-image handoff preserves full luminance', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page)

  await page.locator('.np-album__item').first().click()
  await page.waitForFunction(() =>
    document.getAnimations().some((animation) => {
      const effect = animation.effect as KeyframeEffect
      return (
        (effect.target as HTMLElement)?.hasAttribute('data-np-transition-image') &&
        Number(effect.getTiming().duration) === 100
      )
    }),
  )

  const handoff = await page.evaluate(() => {
    const transitionImage = document.querySelector<HTMLElement>('[data-np-transition-image]')!
    const viewport = document.querySelector<HTMLElement>('[data-np-motion="viewport"]')!
    const animation = document.getAnimations().find((candidate) => {
      const effect = candidate.effect as KeyframeEffect
      return effect.target === transitionImage
    })!

    animation.pause()
    animation.currentTime = 50
    const transitionOpacity = Number(getComputedStyle(transitionImage).opacity)
    const mediaOpacity = Number(getComputedStyle(viewport).opacity)

    return {
      transitionOpacity,
      mediaOpacity,
      effectiveCoverage: transitionOpacity + mediaOpacity * (1 - transitionOpacity),
    }
  })

  expect(handoff.transitionOpacity).toBeCloseTo(0.5, 1)
  expect(handoff.mediaOpacity).toBe(1)
  expect(handoff.effectiveCoverage).toBeCloseTo(1, 5)
})

test.describe('touch gestures', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  })

  test('recipe lightbox supports automated two-finger pinch zoom', async ({ page }) => {
    await stubImageRequests(page)
    await gotoPlayground(page)

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

    await dialog.getByRole('button', { name: 'Next' }).click({ force: true })
    await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
