import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const viewports = [
  { width: 1440, height: 900, deviceScaleFactor: 2 },
  { width: 375, height: 812, deviceScaleFactor: 3 },
]

declare global {
  interface Window {
    __albumProof: {
      cls: number
      supported: boolean
      images: HTMLImageElement[]
    }
  }
}

for (const layout of ['columns', 'masonry']) {
  for (const viewport of viewports) {
    for (const delay of [0, 1500]) {
      test(`image budget SSR ${layout} ${viewport.width}@${viewport.deviceScaleFactor} delay ${delay}`, async ({
        browser,
      }, testInfo) => {
        const context = await browser.newContext({
          baseURL: testInfo.project.use.baseURL,
          viewport,
          deviceScaleFactor: viewport.deviceScaleFactor,
        })
        const page = await context.newPage()
        const errors: string[] = []
        const imageRequests: string[] = []
        page.on('request', (request) => {
          if (request.method() === 'GET' && request.resourceType() === 'image')
            imageRequests.push(request.url())
        })
        page.on('pageerror', (error) => errors.push(error.message))
        await page.addInitScript(() => {
          window.__albumProof = {
            cls: 0,
            supported: PerformanceObserver.supportedEntryTypes.includes('layout-shift'),
            images: [],
          }
          if (window.__albumProof.supported) {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const shift = entry as PerformanceEntry & {
                  value: number
                  hadRecentInput: boolean
                  sources: { node?: Node }[]
                }
                if (
                  !shift.hadRecentInput &&
                  shift.sources.some(
                    ({ node }) => node instanceof Element && node.closest('.np-album'),
                  )
                )
                  window.__albumProof.cls += shift.value
              }
            }).observe({ type: 'layout-shift', buffered: true })
          }
        })
        // Hold hydration until the SSR boxes can be read. The two cases differ only in
        // image response timing; neither changes the provider or image candidates.
        let hydrate!: () => void
        const hydration = new Promise<void>((resolve) => {
          hydrate = resolve
        })
        await page.route(/\/_nuxt\/.*\.js(?:\?|$)/, async (route) => {
          await hydration
          await route.continue()
        })
        if (delay)
          await page.route(/\/_ipx\/.*w_(\d+)/, async (route) => {
            const width = Number(
              route
                .request()
                .url()
                .match(/w_(\d+)/)![1],
            )
            const response = await route.fetch()
            if (width >= 512) await new Promise((resolve) => setTimeout(resolve, delay))
            await route.fulfill({ response })
          })
        try {
          const response = await page.goto(
            `/lab/album?layout=${layout}${layout === 'columns' ? '&columns=6' : ''}`,
            {
              waitUntil: 'commit',
            },
          )
          const html = await response!.text()
          await writeFile(testInfo.outputPath('ssr.html'), html)
          const albumSizes = [
            ...html.matchAll(
              /<img[^>]*class="np-album__img"[^>]*>|<img[^>]*class="np-album__img [^"]*"[^>]*>/g,
            ),
          ].map(([tag]) => tag.match(/sizes="([^"]*)"/)?.[1])
          await expect(page.locator('.np-album img')).toHaveCount(40)
          await page.waitForFunction(
            () => getComputedStyle(document.querySelector('.np-album')!).display === 'flex',
          )
          await page.evaluate(() => Promise.all([...document.fonts].map((font) => font.load())))
          const boxes = () =>
            page.locator('.np-album img').evaluateAll((images) =>
              images.map((image) => {
                const box = image.getBoundingClientRect()
                return {
                  alt: image.getAttribute('alt'),
                  x: box.x,
                  y: box.y,
                  width: box.width,
                  height: box.height,
                }
              }),
            )
          const before = await boxes()
          await page.evaluate(() => {
            window.__albumProof.images = [
              ...document.querySelectorAll<HTMLImageElement>('.np-album img'),
            ]
          })
          hydrate()
          await page.waitForFunction(
            () => window.__lab?.summary().images && window.__lab.summary().pending === 0,
          )
          // Let image completion, the first observer delivery, and lab measurements settle.
          await page.waitForLoadState('networkidle')
          const after = await boxes()
          const proof = await page.evaluate(() => ({
            cls: window.__albumProof.cls,
            supported: window.__albumProof.supported,
            retained: [...document.querySelectorAll('.np-album img')].every(
              (image, index) => image === window.__albumProof.images[index],
            ),
            summary: window.__lab!.summary(),
            fallbackSrc: document.querySelector<HTMLImageElement>(
              '.np-album img[alt="Synthetic normal-00 800×800"]',
            )!.src,
          }))
          await writeFile(
            testInfo.outputPath('geometry.json'),
            JSON.stringify(
              { layout, viewport, delay, before, after, ...proof, imageRequests },
              null,
              2,
            ),
          )
          expect(albumSizes).toHaveLength(40)
          expect(albumSizes.every((sizes) => sizes && !sizes.includes('100vw'))).toBe(true)
          expect(errors).toEqual([])
          expect(proof.retained).toBe(true)
          expect(imageRequests).not.toContain(proof.fallbackSrc)
          expect(after).toEqual(before)
          // WebKit lacks layout-shift entries: identical real boxes are the substitute proof.
          if (proof.supported) expect(proof.cls).toBe(0)
          else expect(testInfo.project.use.browserName).toBe('webkit')
          expect(proof.summary.inRangePercent).toBeGreaterThanOrEqual(90)
        } finally {
          hydrate()
          await context.close()
        }
      })
    }
  }
}
