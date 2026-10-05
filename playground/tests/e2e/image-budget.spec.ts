import { expect, test } from '@playwright/test'
import { demoPhotos } from 'nuxt-photo-demo'
import { writeFile } from 'node:fs/promises'

const viewports = [
  { width: 375, height: 812, deviceScaleFactor: 3 },
  { width: 1440, height: 900, deviceScaleFactor: 2 },
]
const layouts = [
  { kind: 'album', layout: 'rows', columns: 3 },
  { kind: 'album', layout: 'columns', columns: 2 },
  { kind: 'album', layout: 'columns', columns: 6 },
  { kind: 'album', layout: 'masonry', columns: 3 },
  { kind: 'carousel', layout: 'rows', columns: 3 },
  { kind: 'photo', layout: 'rows', columns: 3 },
  { kind: 'lightbox', layout: 'rows', columns: 3 },
]

for (const viewport of viewports) {
  const cases = layouts.map((layout) => ({ ...layout, reuse: false }))
  if (viewport.width === 375)
    cases.push({ kind: 'carousel', layout: 'rows', columns: 3, reuse: true })
  for (const { kind, layout, columns, reuse } of cases) {
    test(`image budget ${kind} ${layout} ${columns} at ${viewport.width}@${viewport.deviceScaleFactor}${reuse ? ' with slide reuse' : ''}`, async ({
      browser,
    }, testInfo) => {
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
      })
      // The phone rows case has the first three photos in the first screen.
      const priority = kind === 'album' && layout === 'rows' && viewport.width === 375 ? 3 : 0
      const page = await context.newPage()
      let releasePreload = () => {}
      if (reuse) {
        const pending = new Promise<void>((resolve) => {
          releasePreload = resolve
        })
        await page.route('**/_ipx/w_1024*/photos/moss-canyon.jpg', async (route) => {
          await pending
          await route.continue()
        })
      }
      const contentTypes: string[] = []
      page.on('response', (response) => {
        if (response.url().includes('/_ipx/'))
          contentTypes.push(response.headers()['content-type'] ?? '')
      })
      await page.addInitScript(() => {
        if (!PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) return
        new PerformanceObserver((list) => {
          const entry = list.getEntries().at(-1) as PerformanceEntry & { element?: Element }
          if (entry?.element)
            document.documentElement.dataset.lcpLoading =
              entry.element.getAttribute('loading') ?? ''
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      })
      try {
        await page.goto(
          `/image-budget?kind=${kind}&layout=${layout}&columns=${columns}&priority=${priority}`,
          { waitUntil: reuse ? 'domcontentloaded' : 'load' },
        )
        if (reuse) {
          await expect(page.getByRole('button', { name: 'Next slide' })).toBeEnabled()
          // Hold the SSR preload until the hydrated slide has painted a smaller file.
          // The thumbnail then reuses the preload that the slide never displayed.
          await page
            .locator('.np-carousel__media')
            .first()
            .evaluate(async (image: HTMLImageElement) => {
              const candidates = image.srcset
              const source = candidates
                .split(',')
                .find((candidate) => /\s768w$/.test(candidate))!
                .trim()
                .split(' ')[0]!
              image.srcset = `${source} 768w`
              image.src = source
              await image.decode()
              image.srcset = candidates
            })
          releasePreload()
          await page
            .locator('.np-carousel__thumb-img')
            .first()
            .evaluate(async (thumb: HTMLImageElement) => {
              const source = thumb.srcset
                .split(',')
                .find((candidate) => /\s1024w$/.test(candidate))!
                .trim()
                .split(' ')[0]!
              thumb.removeAttribute('srcset')
              thumb.src = source
              await thumb.decode()
            })
          await page.waitForFunction(() =>
            performance
              .getEntriesByType('resource')
              .some(
                (entry) =>
                  entry.name.includes('/w_1024') &&
                  (entry as PerformanceResourceTiming).initiatorType === 'link',
              ),
          )
        }
        if (kind === 'lightbox') {
          await page.locator('.np-album__item').first().click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled({
            timeout: 15_000,
          })
          await expect(page.locator('[data-np-transition-frame]')).toBeHidden({ timeout: 15_000 })
        }
        const selector =
          kind === 'carousel'
            ? '.np-carousel img'
            : kind === 'photo'
              ? '.np-photo__img'
              : kind === 'lightbox'
                ? '[data-np-active] img'
                : '.np-album__img'
        const thumbs = page.locator(selector)
        if (kind === 'album') await expect(thumbs).toHaveCount(demoPhotos.length)
        await expect(thumbs.first()).toBeVisible()
        for (const photo of demoPhotos.slice(0, priority)) {
          const image = page.getByAltText(photo.alt!)
          await expect(image).toHaveAttribute('loading', 'eager')
          await expect(image).toHaveAttribute('fetchpriority', 'high')
        }
        await page.waitForFunction((selector) => {
          const images = Array.from(document.querySelectorAll<HTMLImageElement>(selector))
          return (
            images.length > 0 &&
            images
              .filter((image) => {
                const rect = image.getBoundingClientRect()
                return (
                  rect.top < innerHeight &&
                  rect.bottom > 0 &&
                  rect.left < innerWidth &&
                  rect.right > 0
                )
              })
              .every((image) => image.complete && image.naturalWidth > 0)
          )
        }, selector)
        const readings = await thumbs.evaluateAll(async (elements, photos) => {
          const visible = elements.filter((element) => {
            const rect = element.getBoundingClientRect()
            return (
              rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0
            )
          }) as HTMLImageElement[]
          return Promise.all(
            visible.map(async (image) => {
              // An img with srcset reports density-corrected naturalWidth. Decode currentSrc
              // alone to measure the delivered file's actual pixels.
              const file = new Image()
              file.src = image.currentSrc
              await file.decode()
              const photo = photos.find((photo) => photo.alt === image.alt)!
              const sourceWidth = photo.width
              if (sourceWidth === undefined) {
                throw new Error(`Image-budget fixture "${photo.id}" has no source width`)
              }
              const best = Math.min(
                image.getBoundingClientRect().width * devicePixelRatio,
                sourceWidth,
              )
              const fitsLargerOrigin = (width: number) => {
                const originalNeed = Math.min(width, sourceWidth)
                const originalRatio = file.naturalWidth / originalNeed
                return originalNeed > best && originalRatio >= 0.9 && originalRatio <= 2
              }
              const preloaded = performance
                .getEntriesByName(image.currentSrc, 'resource')
                .some((entry) => (entry as PerformanceResourceTiming).initiatorType === 'link')
              // A shared URL is insufficient: require a larger image using this file,
              // or an actual SSR preload whose candidate belongs to that larger image.
              const reused = elements.some(
                (other) =>
                  other instanceof HTMLImageElement &&
                  other !== image &&
                  fitsLargerOrigin(other.getBoundingClientRect().width * devicePixelRatio) &&
                  ((other.complete && other.currentSrc === image.currentSrc) ||
                    (preloaded &&
                      other.srcset
                        .split(',')
                        .some(
                          (candidate) =>
                            new URL(candidate.trim().split(' ')[0]!, location.href).href ===
                            image.currentSrc,
                        ))),
              )
              return {
                needed: best,
                got: file.naturalWidth,
                ratio: file.naturalWidth / best,
                url: image.currentSrc,
                reused,
              }
            }),
          )
        }, demoPhotos)
        const ratios = readings.map((reading) => reading.ratio)
        if (reuse) {
          expect(readings.some((reading) => reading.ratio > 2 && reading.reused)).toBe(true)
        }
        expect(ratios.length).toBeGreaterThan(0)
        const sorted = ratios.toSorted((a, b) => a - b)
        const within =
          readings.filter(
            (reading) => (reading.ratio >= 0.9 && reading.ratio <= 2) || reading.reused,
          ).length / readings.length
        const efficiency = {
          kind,
          layout,
          columns,
          viewport,
          min: sorted[0],
          median:
            (sorted[Math.floor((sorted.length - 1) / 2)]! +
              sorted[Math.floor(sorted.length / 2)]!) /
            2,
          max: sorted.at(-1),
          within,
          count: ratios.length,
          readings,
        }
        await testInfo.attach('efficiency', {
          body: JSON.stringify(efficiency),
          contentType: 'application/json',
        })
        await writeFile(testInfo.outputPath('efficiency.json'), JSON.stringify(efficiency, null, 2))
        expect(within).toBeGreaterThanOrEqual(0.9)
        expect(contentTypes.length).toBeGreaterThan(0)
        expect(contentTypes.every((type) => type.startsWith('image/webp'))).toBe(true)

        if (priority && testInfo.project.use.browserName === 'chromium') {
          await expect
            .poll(() => page.locator('html').getAttribute('data-lcp-loading'))
            .toBe('eager')
        }
        await page.screenshot({ path: testInfo.outputPath('album.png') })
      } finally {
        releasePreload()
        await context.close()
      }
    })
  }
}
