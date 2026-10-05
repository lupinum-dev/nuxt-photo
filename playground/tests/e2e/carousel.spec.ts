import { expect, gotoPlayground, stubImageRequests, test } from './helpers'

test('first carousel slide downloads once and retains SSR sizes', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium request-selection regression')
  for (const viewport of [
    { width: 375, height: 812, deviceScaleFactor: 3 },
    { width: 1440, height: 900, deviceScaleFactor: 2 },
  ]) {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
    })
    try {
      const page = await context.newPage()
      const requests: string[] = []
      page.on('request', (request) => {
        if (request.resourceType() === 'image') requests.push(request.url())
      })
      // Exclude thumbnail requests: this regression measures the SSR preload and slide.
      const response = await page.goto('/image-budget?kind=carousel&thumbnails=0', {
        waitUntil: 'load',
      })
      expect(response?.ok()).toBe(true)
      const ssr = await page.evaluate(
        (html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html')
          const image = doc.querySelector('.np-carousel__media')!
          const preload = doc.querySelector('link[rel="preload"][as="image"]')!
          return {
            sizes: image.getAttribute('sizes'),
            preloadSizes: preload.getAttribute('imagesizes'),
            srcset: image.getAttribute('srcset')!,
            preloadSrcset: preload.getAttribute('imagesrcset'),
          }
        },
        await response!.text(),
      )
      await expect(page.getByRole('button', { name: 'Next slide' })).toBeEnabled()
      await page.waitForTimeout(2000)
      const image = page.locator('.np-carousel__media').first()
      await expect(image).toBeVisible()
      expect(
        await image.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      ).toBe(true)
      const currentSrc = await image.evaluate((image: HTMLImageElement) => {
        return image.currentSrc
      })
      const candidates = ssr.srcset
        .split(',')
        .map((candidate) => new URL(candidate.trim().split(' ')[0]!, page.url()).href)
      const photoRequests = requests.filter((url) => candidates.includes(url))
      const preloadRequests = await page.evaluate(
        (candidates) =>
          performance
            .getEntriesByType('resource')
            .filter(
              (entry) =>
                candidates.includes(entry.name) &&
                (entry as PerformanceResourceTiming).initiatorType === 'link',
            )
            .map((entry) => entry.name),
        candidates,
      )
      await testInfo.attach(`first-slide-${viewport.width}@${viewport.deviceScaleFactor}`, {
        body: JSON.stringify({ viewport, ssr, currentSrc, photoRequests, preloadRequests }),
        contentType: 'application/json',
      })
      expect(ssr.sizes).toBe('70vw')
      expect(ssr.preloadSizes).toBe(ssr.sizes)
      expect(ssr.preloadSrcset).toBe(ssr.srcset)
      expect.soft(photoRequests).toEqual([currentSrc])
      expect.soft(preloadRequests).toEqual([currentSrc])
      await expect.soft(image).toHaveAttribute('sizes', ssr.sizes!)
    } finally {
      await context.close()
    }
  }
})

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
  // SSR thumbnails are clickable before Vue attaches handlers. Embla enables Next
  // only after initialization, so wait for that existing interactive state.
  await expect(carousel.getByRole('button', { name: 'Next slide' })).toBeEnabled()
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
