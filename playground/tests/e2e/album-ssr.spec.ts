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

// Catch photos that move once later photos arrive while the HTML parser waits
// for them. A fulfilled route cannot stream.
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
      const starts = [...html.matchAll(/<div[^>]*class="np-album__item[ "]/g)].map(
        (match) => match.index,
      )
      expect(starts).toHaveLength(count)
      // Pause before a quarter, half and three quarters of the photos.
      const ends = [1, 2, 3].map((part) => starts[(count * part) / 4]!).concat(html.length)
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
          // Forward only the path; host and port are fixed to the local app.
          const forwardPath = incoming.url ?? '/'
          if (!forwardPath.startsWith('/') || forwardPath.startsWith('//')) {
            outgoing.writeHead(403).end()
            return
          }
          const upstream = httpRequest(
            { hostname: base.hostname, port: base.port, path: forwardPath },
            (asset) => {
              outgoing.writeHead(asset.statusCode ?? 502, {
                'content-type': asset.headers['content-type'] ?? 'application/octet-stream',
              })
              asset.pipe(outgoing)
            },
          )
          upstream.once('error', () => outgoing.writeHead(502).end())
          upstream.end()
        }
      })
      const port = 47080 + testInfo.parallelIndex
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, '127.0.0.1', resolve)
      })
      const positions: string[][] = []
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
          await expect(page.locator('.np-album__item')).toHaveCount(
            starts.filter((start) => start < end).length,
          )
          await page.waitForFunction(
            () =>
              getComputedStyle(document.querySelector('.np-album__frame')!).position === 'relative',
          )
          await page.evaluate(() => Promise.all([...document.fonts].map((font) => font.load())))
          // Keep each incomplete document painted before delivering the next photos.
          await page.waitForTimeout(200)
          positions.push(
            await page.locator('.np-album__item').evaluateAll((items) =>
              items.map((item) => {
                const { x, y } = item.getBoundingClientRect()
                return `${x}:${y}`
              }),
            ),
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
        for (const [index, stage] of positions.entries())
          expect
            .soft(stage, `${layout} existing photos at stage ${index + 1}`)
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
            () =>
              getComputedStyle(document.querySelector('.np-album__frame')!).position === 'relative',
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

// Rows are positioned by generated CSS alone, so the server HTML without
// JavaScript and the hydrated album must place every photo identically.
for (const width of [375, 820, 1440])
  test(`rows album renders the same with and without JavaScript at ${width}`, async ({
    browser,
  }, testInfo) => {
    const rects = async (javaScriptEnabled: boolean) => {
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width, height: 900 },
        javaScriptEnabled,
      })
      try {
        const page = await context.newPage()
        await page.goto('/lab/album?layout=rows&n=40')
        if (javaScriptEnabled)
          await page.waitForFunction(
            () => window.__lab?.summary().images && window.__lab.summary().pending === 0,
          )
        await page.waitForLoadState('networkidle')
        await expect(page.locator('.np-album__item')).toHaveCount(40)
        return await page.locator('.np-album__frame').evaluate((frame) => ({
          frame: frame.getBoundingClientRect().toJSON() as DOMRect,
          gap: parseFloat(getComputedStyle(frame).columnGap),
          items: [...frame.querySelectorAll('.np-album__item')].map(
            (item) => item.getBoundingClientRect().toJSON() as DOMRect,
          ),
        }))
      } finally {
        await context.close()
      }
    }
    const server = await rects(false)
    const hydrated = await rects(true)
    await writeFile(
      testInfo.outputPath('rows.json'),
      JSON.stringify({ width, server, hydrated }, null, 2),
    )

    for (const [index, item] of server.items.entries())
      for (const key of ['x', 'y', 'width', 'height'] as const)
        expect
          .soft(Math.abs(item[key] - hydrated.items[index]![key]), `item ${index} ${key}`)
          .toBeLessThanOrEqual(0.5)

    // Every row fills the width exactly and keeps one height.
    const rows = new Map<number, DOMRect[]>()
    for (const item of hydrated.items) {
      const top = Math.round(item.y)
      rows.set(top, [...(rows.get(top) ?? []), item])
    }
    expect(rows.size).toBeGreaterThan(1)
    for (const [top, row] of rows) {
      const filled =
        row.reduce((sum, item) => sum + item.width, 0) + hydrated.gap * (row.length - 1)
      expect
        .soft(Math.abs(filled - hydrated.frame.width), `row at ${top} width`)
        .toBeLessThanOrEqual(1)
      const heights = row.map((item) => item.height)
      expect
        .soft(Math.max(...heights) - Math.min(...heights), `row at ${top} heights`)
        .toBeLessThanOrEqual(1)
    }
  })

// Columns and masonry are positioned by generated CSS alone: the server HTML
// without JavaScript and the hydrated album place every photo identically, and
// the geometry holds at widths inside a span too.
for (const layout of ['columns', 'masonry'] as const)
  test(`${layout} album renders from CSS alone at every width`, async ({ browser }, testInfo) => {
    test.setTimeout(120_000)
    const measure = async (width: number, javaScriptEnabled: boolean) => {
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width, height: 900 },
        javaScriptEnabled,
      })
      try {
        const page = await context.newPage()
        await page.goto(`/lab/album?layout=${layout}&columns=3&n=40`)
        if (javaScriptEnabled)
          await page.waitForFunction(
            () => window.__lab?.summary().images && window.__lab.summary().pending === 0,
          )
        await page.waitForLoadState('networkidle')
        await expect(page.locator('.np-album__item')).toHaveCount(40)
        return await page.locator('.np-album__frame').evaluate((frame) => {
          const box = (element: Element) => {
            const { x, y, left, top, right, bottom, width, height } =
              element.getBoundingClientRect()
            return { x, y, left, top, right, bottom, width, height }
          }
          return {
            frame: box(frame),
            gap: parseFloat(getComputedStyle(frame).getPropertyValue('--np-gap')),
            items: [...frame.querySelectorAll<HTMLElement>('.np-album__item')].map((item) => {
              const image = item.querySelector('img')!
              return {
                ...box(item),
                content: box(image),
                ratio: Number(image.getAttribute('width')) / Number(image.getAttribute('height')),
              }
            }),
          }
        })
      } finally {
        await context.close()
      }
    }
    for (const width of [375, 500, 820, 1100, 1440]) {
      const hydrated = await measure(width, true)
      const label = `${layout} at ${width}`
      if ([375, 820, 1440].includes(width)) {
        const server = await measure(width, false)
        for (const [index, item] of server.items.entries())
          for (const key of ['x', 'y', 'width', 'height'] as const)
            expect
              .soft(
                Math.abs(item[key] - hydrated.items[index]![key]),
                `${label} item ${index} ${key}`,
              )
              .toBeLessThanOrEqual(0.5)
      }
      await writeFile(testInfo.outputPath(`${width}.json`), JSON.stringify(hydrated, null, 2))
      const { items, frame, gap } = hydrated
      for (const [index, item] of items.entries()) {
        expect
          .soft(
            Math.abs(item.content.width / item.content.height / item.ratio - 1),
            `${label} item ${index} ratio`,
          )
          .toBeLessThanOrEqual(0.01)
        for (const other of items.slice(index + 1)) {
          const overlap =
            Math.min(item.right, other.right) - Math.max(item.left, other.left) > 0.5 &&
            Math.min(item.bottom, other.bottom) - Math.max(item.top, other.top) > 0.5
          expect.soft(overlap, `${label} item ${index} overlaps`).toBe(false)
        }
      }
      // Columns: items that share a left edge, top to bottom.
      const columns = new Map<number, typeof items>()
      for (const item of items) {
        const left = Math.round(item.left)
        columns.set(left, [...(columns.get(left) ?? []), item])
      }
      expect.soft(columns.size, label).toBe(3)
      const ordered = [...columns.values()].sort((a, b) => a[0]!.left - b[0]!.left)
      for (const [index, column] of ordered.entries()) {
        column.sort((a, b) => a.top - b.top)
        for (const [position, item] of column.slice(1).entries())
          expect
            .soft(Math.abs(item.top - column[position]!.bottom - gap), `${label} vertical gap`)
            .toBeLessThanOrEqual(1)
        const next = ordered[index + 1]
        if (next)
          expect
            .soft(Math.abs(next[0]!.left - column[0]!.right - gap), `${label} horizontal gap`)
            .toBeLessThanOrEqual(1)
      }
      if (layout === 'masonry') {
        const widths = ordered.map((column) => column[0]!.width)
        expect
          .soft(Math.max(...widths) - Math.min(...widths), `${label} widths`)
          .toBeLessThanOrEqual(1)
      }
      expect
        .soft(
          Math.abs(Math.max(...items.map((item) => item.bottom)) - frame.bottom),
          `${label} frame height`,
        )
        .toBeLessThanOrEqual(1)
      expect
        .soft(Math.abs(ordered.at(-1)![0]!.right - frame.right), `${label} fills width`)
        .toBeLessThanOrEqual(1)
    }
  })
