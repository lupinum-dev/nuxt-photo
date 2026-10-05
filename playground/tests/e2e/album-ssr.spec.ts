import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { createServer, request as httpRequest } from 'node:http'

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
      shifts: {
        value: number
        startTime: number
        sources: {
          node: string | null
          previousRect: DOMRectReadOnly
          currentRect: DOMRectReadOnly
        }[]
      }[]
    }
    __streamProof: { shifts: number[] }
  }
}

// Catch free-space redistribution of columns that have already painted while
// the HTML parser waits for later siblings. A fulfilled route cannot stream.
for (const { width, height, columns, count } of [
  { width: 1440, height: 900, columns: 4, count: 200 },
  { width: 375, height: 812, columns: 6, count: 40 },
])
  test(`columns and masonry stay in place while SSR HTML streams at ${width}`, async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.use.browserName !== 'chromium', 'Layout Instability API proof')
    await page.setViewportSize({ width, height })
    await page.addInitScript(() => {
      window.__streamProof = { shifts: [] }
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number
            hadRecentInput: boolean
            sources: { node?: Node }[]
          }
          if (
            !shift.hadRecentInput &&
            shift.sources.some(({ node }) => node instanceof Element && node.closest('.np-album'))
          )
            window.__streamProof.shifts.push(shift.value)
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    for (const layout of ['columns', 'masonry']) {
      const path = `/lab/album?layout=${layout}&columns=${columns}&n=${count}`
      const response = await request.get(path)
      expect(response.ok()).toBe(true)
      const html = await response.text()
      const starts = [...html.matchAll(/<div[^>]*class="np-album__column"/g)].map(
        (match) => match.index,
      )
      expect(starts).toHaveLength(columns)
      // Pause inside the second column too: space-between used to spread its
      // first two items over a complete sibling's height, then move them back.
      const partial = [...html.matchAll(/<div[^>]*class="np-album__item"/g)].filter(
        (match) => match.index > starts[1]! && match.index < starts[2]!,
      )[2]!.index
      const ends = [starts[1]!, partial, ...starts.slice(2), html.length]
      const releases: (() => void)[] = []
      const gates = ends.map(() => new Promise<void>((resolve) => releases.push(resolve)))
      const base = new URL(testInfo.project.use.baseURL!)
      const server = createServer(async (incoming, outgoing) => {
        if (incoming.url === path) {
          outgoing.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
          let start = 0
          for (const [index, end] of ends.entries()) {
            outgoing.write(html.slice(start, end))
            start = end
            await gates[index]
          }
          outgoing.end()
        } else {
          try {
            const url = new URL(incoming.url ?? '/', base)
            if (url.origin !== base.origin) {
              outgoing.writeHead(403).end()
              return
            }
            const asset = await fetch(url, { redirect: 'error' })
            outgoing.writeHead(asset.status, {
              'content-type': asset.headers.get('content-type') ?? 'application/octet-stream',
            })
            outgoing.end(Buffer.from(await asset.arrayBuffer()))
          } catch {
            outgoing.writeHead(502).end()
          }
        }
      })
      const port = 47080 + testInfo.workerIndex
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', resolve)
      })
      const positions: number[][] = []
      try {
        // Absolute and protocol-relative request targets must never leave the local app.
        for (const target of ['http://example.invalid/asset', '//example.invalid/asset']) {
          const status = await new Promise<number | undefined>((resolve, reject) => {
            const probe = httpRequest({ hostname: '127.0.0.1', port, path: target }, (response) => {
              response.resume()
              resolve(response.statusCode)
            })
            probe.once('error', reject)
            probe.end()
          })
          expect(status).toBe(403)
        }
        await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'commit' })
        expect(
          await page.evaluate(() =>
            PerformanceObserver.supportedEntryTypes.includes('layout-shift'),
          ),
        ).toBe(true)
        for (const [stage, end] of ends.entries()) {
          await expect(page.locator('.np-album__column')).toHaveCount(
            starts.filter((start) => start < end).length,
          )
          await page.waitForFunction(
            () => getComputedStyle(document.querySelector('.np-album')!).display === 'flex',
          )
          await page.evaluate(() => Promise.all([...document.fonts].map((font) => font.load())))
          // Keep each incomplete document painted before delivering the next column.
          await page.waitForTimeout(200)
          positions.push(
            await page
              .locator('.np-album__column')
              .evaluateAll((columns) => columns.map((column) => column.getBoundingClientRect().x)),
          )
          releases[stage]!()
        }
        await page.waitForLoadState('networkidle')
        await expect(page.locator('.np-album img')).toHaveCount(count)
        const shifts = await page.evaluate(() => window.__streamProof.shifts)
        const cls = shifts.reduce((sum, value) => sum + value, 0)
        await writeFile(
          testInfo.outputPath(`stream-${layout}.json`),
          JSON.stringify({ layout, positions, shifts, cls }, null, 2),
        )
        expect.soft(cls, `${layout} streamed CLS`).toBe(0)
        expect
          .soft(
            positions.map((stage) => stage[0]),
            `${layout} first column x`,
          )
          .toEqual(Array(ends.length).fill(positions[0]![0]))
        for (const [index, stage] of positions.entries())
          expect
            .soft(stage, `${layout} existing columns at stage ${index + 1}`)
            .toEqual(positions.at(-1)!.slice(0, stage.length))
      } finally {
        releases.forEach((release) => release())
        server.closeAllConnections()
        await new Promise<void>((resolve) => server.close(() => resolve()))
      }
    }
  })

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
        const cpuRate = Number(process.env.ALBUM_CPU_RATE ?? 1)
        if (cpuRate > 1 && testInfo.project.use.browserName === 'chromium') {
          const cdp = await context.newCDPSession(page)
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate })
        }
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
            shifts: [],
          }
          if (window.__albumProof.supported) {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const shift = entry as PerformanceEntry & {
                  value: number
                  hadRecentInput: boolean
                  sources: {
                    node?: Node
                    previousRect: DOMRectReadOnly
                    currentRect: DOMRectReadOnly
                  }[]
                }
                if (!shift.hadRecentInput)
                  window.__albumProof.shifts.push({
                    value: shift.value,
                    startTime: shift.startTime,
                    sources: shift.sources.map(({ node, previousRect, currentRect }) => ({
                      node: node instanceof Element ? node.outerHTML.slice(0, 500) : null,
                      previousRect: previousRect.toJSON(),
                      currentRect: currentRect.toJSON(),
                    })),
                  })
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
            shifts: window.__albumProof.shifts,
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
