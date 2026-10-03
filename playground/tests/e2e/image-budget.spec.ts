import { expect, test } from '@playwright/test'
import { demoPhotos } from 'nuxt-photo-demo'

const viewports = [
  { width: 375, height: 812, deviceScaleFactor: 3 },
  { width: 1440, height: 900, deviceScaleFactor: 2 },
]
const layouts = [
  { layout: 'rows', columns: 3 },
  { layout: 'columns', columns: 2 },
  { layout: 'columns', columns: 6 },
  { layout: 'masonry', columns: 3 },
]

for (const viewport of viewports) {
  for (const { layout, columns } of layouts) {
    test(`image budget ${layout} ${columns} at ${viewport.width}@${viewport.deviceScaleFactor}`, async ({
      browser,
    }, testInfo) => {
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
      })
      // The phone rows case has the first three photos in the first screen.
      const priority = layout === 'rows' && viewport.width === 375 ? 3 : 0
      const page = await context.newPage()
      const contentTypes: string[] = []
      page.on('response', (response) => {
        if (response.url().includes('/_ipx/'))
          contentTypes.push(response.headers()['content-type'] ?? '')
      })
      await page.addInitScript(() => {
        new PerformanceObserver((list) => {
          const entry = list.getEntries().at(-1) as PerformanceEntry & { element?: Element }
          if (entry?.element)
            document.documentElement.dataset.lcpLoading =
              entry.element.getAttribute('loading') ?? ''
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      })
      try {
        await page.goto(`/image-budget?layout=${layout}&columns=${columns}&priority=${priority}`)
        const thumbs = page.locator('.np-album__img')
        await expect(thumbs).toHaveCount(demoPhotos.length)
        for (const photo of demoPhotos.slice(0, priority)) {
          const image = page.getByAltText(photo.alt!)
          await expect(image).toHaveAttribute('loading', 'eager')
          await expect(image).toHaveAttribute('fetchpriority', 'high')
        }
        await page.waitForFunction(() => {
          const images = Array.from(document.querySelectorAll<HTMLImageElement>('.np-album__img'))
          return (
            images.length > 0 &&
            images
              .filter((image) => {
                const rect = image.getBoundingClientRect()
                return rect.top < innerHeight && rect.bottom > 0
              })
              .every((image) => image.complete && image.naturalWidth > 0)
          )
        })
        const ratios = await thumbs.evaluateAll(async (elements, photos) => {
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
              const best = Math.min(
                image.getBoundingClientRect().width * devicePixelRatio,
                photo.width,
              )
              return file.naturalWidth / best
            }),
          )
        }, demoPhotos)
        expect(ratios.length).toBeGreaterThan(0)
        const sorted = ratios.toSorted((a, b) => a - b)
        const within = ratios.filter((ratio) => ratio >= 0.9 && ratio <= 2).length / ratios.length
        await testInfo.attach('efficiency', {
          body: JSON.stringify({
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
          }),
          contentType: 'application/json',
        })
        expect(within).toBeGreaterThanOrEqual(0.9)
        expect(contentTypes.length).toBeGreaterThan(0)
        expect(contentTypes.every((type) => type.startsWith('image/webp'))).toBe(true)

        if (priority) {
          await expect
            .poll(() => page.locator('html').getAttribute('data-lcp-loading'))
            .toBe('eager')
        }
        await page.screenshot({ path: testInfo.outputPath('album.png') })
      } finally {
        await context.close()
      }
    })
  }
}
