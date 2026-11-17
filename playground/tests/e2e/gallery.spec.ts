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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  await page.locator('.np-album__item').first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('[data-np-slide-frame]')).toHaveCount(3)
  await expect(page.locator('[data-np-slide-img]')).toHaveCount(3)
  await expect(page.locator('.np-lightbox__counter')).toContainText('1 / 12')
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  const nextButton = page.getByRole('button', { name: 'Next' })
  await expect(nextButton).toBeEnabled()
  await nextButton.dispatchEvent('click')
  await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')
  // Every mounted slide has its caption, but only the active photo's is read out.
  await expect(page.locator('[data-np-slide] .np-lightbox__caption')).toHaveCount(3)
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveCount(1)
  await expect(page.locator('[data-np-active] .np-lightbox__caption h2')).toHaveText(
    (await dialog.getByRole('heading', { level: 2 }).textContent())!,
  )

  const previousButton = page.getByRole('button', { name: 'Previous' })
  await expect(previousButton).toBeEnabled()
  await previousButton.dispatchEvent('click')
  await expect(page.locator('.np-lightbox__counter')).toContainText('1 / 12')

  await expect(page.getByRole('button', { name: 'Zoom' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('')
})

for (const navigation of ['fade', 'crossfade']) {
  test(`${navigation} navigation changes photos by key and by swipe`, async ({ page }) => {
    await stubImageRequests(page)
    await gotoPlayground(page, `/?navigation=${navigation}`)
    await page.locator('.np-album__item').first().click()
    const counter = page.locator('.np-lightbox__counter')
    await expect(counter).toContainText('1 / 12')
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled()

    await page.keyboard.press('ArrowRight')
    await expect(counter).toContainText('2 / 12')
    // Only the active photo stays visible once the fade settles.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            [...document.querySelectorAll('[data-np-slide-frame]')].filter(
              (frame) => Number(getComputedStyle(frame).opacity) > 0.01,
            ).length,
        ),
      )
      .toBe(1)

    const media = await page.locator('.np-lightbox__media').boundingBox()
    const y = media!.y + media!.height / 2
    const x = media!.x + media!.width / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 120, y, { steps: 6 })
    await page.mouse.move(x - 300, y, { steps: 6 })
    await page.mouse.up()
    await expect(counter).toContainText('3 / 12')
  })
}

test('lightbox motion exposes one deterministic WAAPI timeline', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page)

  const tracks = await page
    .locator('.np-album__item')
    .first()
    .evaluate(async (trigger) => {
      ;(trigger as HTMLElement).click()
      for (let frame = 0; frame < 30; frame += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        // CSS transitions count too; wait for the flight itself.
        const flying = document
          .getAnimations()
          .some((animation) =>
            ((animation.effect as KeyframeEffect).target as HTMLElement)?.hasAttribute(
              'data-np-transition-frame',
            ),
          )
        if (flying) break
      }
      // The flight's animations are created held; one frame callback starts them.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      return document.getAnimations().map((animation) => {
        const startTime = animation.startTime
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
          startTime,
        }
      })
    })

  // One timeline: the ghost, backdrop, shadow and controls share one spring's duration and one
  // start time, so no part runs ahead of the photo.
  const byTarget = Object.fromEntries(tracks.map((track) => [track.target, track]))
  const frame = byTarget.frame!
  expect(frame.duration).toBeGreaterThan(300)
  expect(frame.duration).toBeLessThan(700)
  expect(frame.startTime).not.toBeNull()
  for (const target of ['backdrop', 'shadow', 'controls'])
    expect(byTarget[target]).toMatchObject({
      delay: 0,
      duration: frame.duration,
      startTime: frame.startTime,
    })
})

test('responsive-image handoff preserves full luminance', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page)

  await page.locator('.np-album__item').first().click()
  // Capture the short handoff atomically so it cannot finish between browser calls.
  await page.waitForFunction(() => {
    const animation = document.getAnimations().find((animation) => {
      const effect = animation.effect as KeyframeEffect
      return (
        (effect.target as HTMLElement)?.hasAttribute('data-np-transition-image') &&
        Number(effect.getTiming().duration) === 100
      )
    })
    // Created held at time zero, the handoff runs once its start gate opens.
    if (animation?.playState !== 'running') return false
    animation.pause()
    animation.currentTime = 50
    return true
  })

  const handoff = await page.evaluate(() => {
    const transitionImage = document.querySelector<HTMLElement>('[data-np-transition-image]')!
    const viewport = document.querySelector<HTMLElement>('[data-np-motion="viewport"]')!
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

    await dialog.getByRole('button', { name: 'Next' }).dispatchEvent('click')
    await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

for (const candidates of ['default', 'unfocusable candidates']) {
  test(
    'lightbox keeps keyboard focus inside the dialog @focus-trap: ' + candidates,
    async ({ page }, testInfo) => {
      // The modal <dialog> keeps focus away from the page. Safari moves to buttons with
      // Option+Tab unless "Press Tab to highlight each item" is on.
      const [next, previous] = testInfo.project.name.includes('webkit')
        ? ['Alt+Tab', 'Alt+Shift+Tab']
        : ['Tab', 'Shift+Tab']
      await stubImageRequests(page)
      await gotoPlayground(page)
      await page.locator('.np-album__item').first().click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('.np-lightbox__controls')).not.toHaveAttribute('inert', '')
      await expect(dialog.locator('.np-lightbox__btn--next')).toBeEnabled()
      if (candidates === 'unfocusable candidates') {
        await dialog.evaluate((root) => {
          const controls = document.createElement('div')
          controls.innerHTML = `
        <button data-focus-start>Start</button>
        <input type="hidden">
        <button style="display:none">Hidden</button>
        <button style="visibility:hidden">Invisible</button>
        <fieldset disabled><button>Disabled by fieldset</button></fieldset>
        <div inert><button>Inert</button></div>
        <span href="#">Rendered text that cannot take focus</span>
        <button data-focus-end>End</button>
      `
          root.querySelector('[data-np-lightbox-surface]')!.appendChild(controls)
          controls.querySelector<HTMLElement>('[data-focus-start]')!.focus()
        })
        await page.keyboard.press(next)
        await expect(dialog.locator('[data-focus-end]')).toBeFocused()
        await page.keyboard.press(previous)
        await expect(dialog.locator('[data-focus-start]')).toBeFocused()
      }
      // More presses than the lightbox has controls, so the sequence must wrap. Between rounds
      // focus may rest in the browser's own UI (document.body), never on the page.
      const visited = new Set<string>()
      for (const key of [next, previous]) {
        for (let index = 0; index < 12; index++) {
          await page.keyboard.press(key)
          visited.add(
            await page.evaluate(() => {
              const active = document.activeElement
              if (active?.closest('dialog')) return 'dialog'
              return active === document.body || active === null ? 'browser' : 'page'
            }),
          )
        }
      }
      expect(visited.has('dialog')).toBe(true)
      expect(visited.has('page')).toBe(false)
      await page.keyboard.press('Escape')
    },
  )
}
