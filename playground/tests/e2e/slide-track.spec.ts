import type { Page } from '@playwright/test'
import { expect, gotoPlayground, stubImageRequests, test } from './helpers'

// `slide` mode moves the photos on the lightbox's own track. Chromium drives it with a mouse,
// mobile-chromium with real touch events through CDP, so both pointer types go through the same
// engine. webkit-smoke runs the RTL case with a mouse.

type Drag = {
  down(x: number, y: number): Promise<void>
  move(x: number, y: number): Promise<void>
  up(): Promise<void>
}

async function pointerFor(page: Page, touch: boolean): Promise<Drag> {
  if (!touch) {
    return {
      down: async (x, y) => {
        await page.mouse.move(x, y)
        await page.mouse.down()
      },
      move: (x, y) => page.mouse.move(x, y),
      up: () => page.mouse.up(),
    }
  }
  const cdp = await page.context().newCDPSession(page)
  let last = { x: 0, y: 0 }
  return {
    down: async (x, y) => {
      last = { x, y }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [last] })
    },
    move: async (x, y) => {
      last = { x, y }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [last] })
    },
    up: async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    },
  }
}

async function openPhoto(page: Page, index: number, rtl = false) {
  await stubImageRequests(page)
  await gotoPlayground(page)
  if (rtl)
    await page
      .locator('.np-album')
      .first()
      .evaluate((root) => {
        root.style.direction = 'rtl'
      })
  await page.locator('.np-album__item').nth(index).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('[data-np-transition-frame]')).toBeHidden()
  await expect(page.locator('[data-np-slide]')).toHaveCount(3)
  const box = (await page.locator('.np-lightbox__media').boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, left: box.x }
}

/** Where slide `index` (or the active one) is drawn, in px from the media area's left edge. */
function slideLeft(page: Page, index?: number) {
  return page.evaluate((index) => {
    const media = document.querySelector('.np-lightbox__media')!.getBoundingClientRect()
    const slide =
      index === undefined
        ? document.querySelector('[data-np-slide][data-np-active]')
        : document.querySelector('.np-lightbox__container')!.children[index]
    return slide!.getBoundingClientRect().left - media.left
  }, index)
}

async function slowDrag(page: Page, drag: Drag, x: number, y: number, distance: number) {
  await drag.down(x, y)
  for (let step = 1; step <= 8; step++) {
    await drag.move(x + (distance * step) / 8, y)
    await page.waitForTimeout(16)
  }
}

/**
 * Pointer events dispatched inside the page, so their timing does not depend on how busy the
 * test machine is. `steps` are [dx, ms before the move]; a step with dx null lifts the pointer,
 * and `read` steps report where the active slide is drawn. A read waits for Vue's render first: a
 * catch changes the photo in its pointerdown handler, and `data-np-active` follows a task later.
 */
async function pointerScript(
  page: Page,
  pointerType: string,
  x: number,
  y: number,
  steps: Array<{ dx: number | null; wait?: number; down?: boolean } | 'read'>,
) {
  return page.evaluate(
    async ({ pointerType, x, y, steps }) => {
      const media = document.querySelector('.np-lightbox__media')!
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
      const reads: number[] = []
      let current = x
      const send = (type: string, clientX: number) =>
        document.elementFromPoint(clientX, y)!.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 41,
            pointerType,
            isPrimary: true,
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
            clientX,
            clientY: y,
          }),
        )
      for (const step of steps) {
        if (step === 'read') {
          await sleep(0)
          const slide = document.querySelector('[data-np-slide][data-np-active]')!
          reads.push(slide.getBoundingClientRect().left - media.getBoundingClientRect().left)
          continue
        }
        if (step.wait) await sleep(step.wait)
        if (step.down) send('pointerdown', (current = x))
        else if (step.dx === null) send('pointerup', current)
        else send('pointermove', (current = x + step.dx))
      }
      return reads
    },
    { pointerType, x, y, steps },
  )
}

/** Three moves 10 ms apart: well past the flick speed, short of half a photo. */
function flickSteps(distance: number) {
  return [
    { dx: 0, down: true },
    ...[1, 2, 3].map((step) => ({ dx: (distance * step) / 3, wait: 10 })),
    { dx: null, wait: 5 },
  ]
}

const counter = (page: Page) => page.locator('.np-lightbox__counter')

test.describe('touch gestures: slide track', () => {
  test('settles back after a slow drag of 30% of the width', async ({ page }, testInfo) => {
    const area = await openPhoto(page, 0)
    const drag = await pointerFor(page, testInfo.project.name === 'mobile-chromium')
    await slowDrag(page, drag, area.x, area.y, -area.width * 0.3)
    // A pointer that rests before lifting carries no speed.
    await page.waitForTimeout(250)
    await drag.up()
    await expect.poll(() => slideLeft(page).then(Math.round)).toBe(0)
    await expect(counter(page)).toHaveText('1 / 12')
  })

  test('advances on a short fast flick', async ({ page }, testInfo) => {
    const area = await openPhoto(page, 0)
    const pointerType = testInfo.project.name === 'mobile-chromium' ? 'touch' : 'mouse'
    await pointerScript(page, pointerType, area.x, area.y, flickSteps(-area.width * 0.15))
    await expect(counter(page)).toHaveText('2 / 12')
    await expect.poll(() => slideLeft(page).then(Math.round)).toBe(0)
  })

  test('follows a drag that starts while it settles', async ({ page }, testInfo) => {
    const area = await openPhoto(page, 0)
    const pointerType = testInfo.project.name === 'mobile-chromium' ? 'touch' : 'mouse'
    const [caught, followed] = await pointerScript(page, pointerType, area.x, area.y, [
      ...flickSteps(-area.width * 0.15),
      // A new pointer lands while the next photo is still on its way in.
      { dx: 0, down: true, wait: 80 },
      'read',
      { dx: 20 },
      { dx: 40 },
      'read',
      { dx: null },
    ])
    expect(caught).toBeGreaterThan(20)
    expect(followed).toBeCloseTo(caught! + 40, 0)
  })

  test('advancing from the last photo shows the first', async ({ page }, testInfo) => {
    const area = await openPhoto(page, 11)
    await expect(counter(page)).toHaveText('12 / 12')
    const drag = await pointerFor(page, testInfo.project.name === 'mobile-chromium')
    await slowDrag(page, drag, area.x, area.y, -area.width * 0.3)
    // The first photo waits right after the last one. The drag starts where its direction locked,
    // on the first of the eight moves, so the photo has followed the other seven.
    expect(await slideLeft(page, 0)).toBeCloseTo(area.width * (1 - 0.3 * (7 / 8)), -1)
    for (const dx of [-0.4, -0.5]) await drag.move(area.x + area.width * dx, area.y)
    await drag.up()
    await expect(counter(page)).toHaveText('1 / 12')
    await expect.poll(() => slideLeft(page).then(Math.round)).toBe(0)
  })

  test('mirrors under direction: rtl', async ({ page }, testInfo) => {
    const area = await openPhoto(page, 0, true)
    const drag = await pointerFor(page, testInfo.project.name === 'mobile-chromium')
    // Dragging toward the start edge (right in RTL) shows the next photo from the left.
    await slowDrag(page, drag, area.x, area.y, area.width * 0.3)
    expect(await slideLeft(page, 1)).toBeCloseTo(-area.width * (1 - 0.3 * (7 / 8)), -1)
    for (const dx of [0.4, 0.5]) await drag.move(area.x + area.width * dx, area.y)
    await drag.up()
    await expect(counter(page)).toHaveText('2 / 12')
    await expect.poll(() => slideLeft(page).then(Math.round)).toBe(0)
  })

  test('pans a zoomed photo with a horizontal drag and keeps it', async ({ page }, testInfo) => {
    const area = await openPhoto(page, 0)
    await page.getByRole('button', { name: 'Zoom', exact: true }).dispatchEvent('click')
    const media = page.locator('.np-lightbox__media')
    await expect(media).toHaveAttribute('data-zoomed', 'true')
    // Let the zoom spring finish before the drag.
    await page.waitForTimeout(700)
    const zoom = page.locator('[data-np-slide][data-np-active] [data-np-slide-zoom]')
    const panX = () =>
      zoom.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
    await expect.poll(async () => Math.round(await panX())).toBe(0)
    const drag = await pointerFor(page, testInfo.project.name === 'mobile-chromium')
    await slowDrag(page, drag, area.x, area.y, -100)
    await drag.up()
    await expect.poll(panX).toBeLessThan(-40)
    await expect(counter(page)).toHaveText('1 / 12')
    await expect(media).toHaveAttribute('data-zoomed', 'true')
  })

  // Pointer moves write styles straight to the elements; none re-renders a Vue component. The
  // ambient glow behind the photo follows a swipe with at most one write of its own.
  test('drag and pan cost no Vue render and one style write per move', async ({
    page,
  }, testInfo) => {
    await stubImageRequests(page)
    await gotoPlayground(page)
    await page.evaluate(() => {
      const counts = { updates: 0, styles: 0, glow: 0 }
      Object.assign(window, { counts })
      const app = (document.querySelector('#__nuxt') as unknown as { __vue_app__: any }).__vue_app__
      app.mixin({ updated: () => counts.updates++ })
      new MutationObserver((records) => {
        for (const record of records)
          if ((record.target as Element).closest('[data-np-ambient]')) counts.glow++
          else counts.styles++
      }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] })
    })
    await page.locator('.np-album__item').first().click()
    await expect(page.locator('[data-np-transition-frame]')).toBeHidden()
    // Both neighbours mount once the photo has loaded; measure after that.
    await expect(page.locator('[data-np-slide]')).toHaveCount(3)
    const box = (await page.locator('.np-lightbox__media').boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    const drag = await pointerFor(page, testInfo.project.name === 'mobile-chromium')
    const read = () => page.evaluate(() => ({ ...(window as any).counts }))

    async function costPerMove(dx: number, dy: number) {
      await drag.down(x, y)
      await drag.move(x + Math.sign(dx) * 30, y + Math.sign(dy) * 30)
      await page.waitForTimeout(100)
      const before = await read()
      for (let step = 1; step <= 10; step++) {
        await drag.move(x + Math.sign(dx) * 30 + dx * step, y + Math.sign(dy) * 30 + dy * step)
        await page.evaluate(() => new Promise(requestAnimationFrame))
      }
      const after = await read()
      await page.waitForTimeout(250)
      await drag.up()
      await page.waitForTimeout(700)
      return {
        updates: after.updates - before.updates,
        styles: (after.styles - before.styles) / 10,
        glow: (after.glow - before.glow) / 10,
      }
    }

    const swipe = await costPerMove(-6, 0)
    expect({ updates: swipe.updates, styles: swipe.styles }).toEqual({ updates: 0, styles: 1 })
    expect(swipe.glow).toBeLessThanOrEqual(1)
    await page.getByRole('button', { name: 'Zoom', exact: true }).dispatchEvent('click')
    await expect(page.locator('.np-lightbox__media')).toHaveAttribute('data-zoomed', 'true')
    await page.waitForTimeout(700)
    expect(await costPerMove(-4, -4)).toEqual({ updates: 0, styles: 1, glow: 0 })
  })
})
