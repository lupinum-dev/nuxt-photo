import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import type { LabSummary } from '../../lab/measurement'

const viewports = [
  { width: 375, height: 812, deviceScaleFactor: 3 },
  { width: 1440, height: 900, deviceScaleFactor: 2 },
]
const scenarios = [
  { name: 'album rows', path: '/lab/album?layout=rows' },
  { name: 'album columns 6', path: '/lab/album?layout=columns&columns=6' },
  { name: 'album masonry', path: '/lab/album?layout=masonry' },
  { name: 'carousel', path: '/lab/carousel' },
  { name: 'photo', path: '/lab/photo' },
  { name: 'lightbox', path: '/lab/lightbox' },
]
const badge =
  /^need \d+px · got \d+px · \d+\.\d{2}× · \d+\.\d KB · [\w+.-]+ · (eager|lazy)(, high)?( · floor)?( · reused)?$/

test('image budget lab counts an already downloaded thumbnail file as in range', async ({
  page,
}, testInfo) => {
  await page.goto('/lab/photo')
  await page.waitForFunction(
    () => window.__lab?.summary().images === 2 && !window.__lab.summary().pending,
  )
  await page.waitForLoadState('networkidle')
  const before = await page.evaluate(() => window.__lab!.summary())
  const transferBytes = () =>
    page.evaluate(() => {
      const url = document.querySelector<HTMLImageElement>('.lab-content img')!.currentSrc
      return (performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[]).reduce(
        (total, entry) => total + entry.transferSize,
        0,
      )
    })
  const transferredBefore = await transferBytes()
  await page.evaluate(() => {
    const original = document.querySelector<HTMLImageElement>('.lab-content img')!
    const thumbnail = document.createElement('img')
    thumbnail.alt = original.alt
    thumbnail.src = original.currentSrc
    thumbnail.style.cssText = 'position:fixed;top:400px;left:100px;width:64px;height:64px'
    document.querySelector('.lab-content')!.append(thumbnail)
  })
  await page.waitForFunction(
    () => window.__lab?.summary().images === 3 && !window.__lab.summary().pending,
  )
  await page.getByRole('button', { name: 'Show overlay', exact: true }).click()
  const reused = page.locator('.lab-badge').filter({ hasText: ' · reused' })
  await expect(reused).toHaveCount(1)
  await expect(reused).toContainText('need 64px')
  await expect(reused).toHaveCSS('background-color', 'rgb(22, 163, 74)')
  const after = await page.evaluate(() => window.__lab!.summary())
  expect(after.max).toBeGreaterThan(2)
  expect(after.inRangePercent).toBe(100)
  await page.waitForLoadState('networkidle')
  const transferredAfter = await transferBytes()
  await writeFile(
    testInfo.outputPath('reuse.json'),
    JSON.stringify({ before, after, transferredBefore, transferredAfter }, null, 2),
  )
  // WebKit repeats nonzero transfer sizes for cache hits; byte equality is not a
  // reliable network proof there. Both browsers still check the badge and summary.
  if (testInfo.project.use.browserName === 'chromium')
    expect(transferredAfter).toBe(transferredBefore)
  await page.screenshot({ path: testInfo.outputPath('reuse.png') })
})

for (const viewport of viewports) {
  for (const scenario of scenarios) {
    test(`image budget lab ${scenario.name} at ${viewport.width}@${viewport.deviceScaleFactor}`, async ({
      browser,
    }, testInfo) => {
      // Each scenario owns a new context: no cookies, storage, or HTTP cache from prior measurements.
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport,
        deviceScaleFactor: viewport.deviceScaleFactor,
      })
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      try {
        await page.goto(scenario.path)
        await expect(page.getByRole('button', { name: 'Show overlay', exact: true })).toBeVisible()
        await page.waitForFunction(() => !!window.__lab)
        await page.waitForFunction(() => {
          const summary = window.__lab?.summary()
          return summary && summary.images > 0 && summary.pending === 0
        })
        await page.getByRole('button', { name: 'Show overlay', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Hide overlay', exact: true })).toBeVisible()
        if (scenario.name === 'lightbox') {
          // Exercise a large raster slide rather than the first (320px) GIF.
          await page.locator('.np-album__item').nth(1).click()
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.locator('[data-np-transition-frame]')).toBeHidden({ timeout: 15_000 })
          await expect.poll(() => page.locator('.lab-page > ul li').count()).toBeGreaterThan(0)
          await page.waitForFunction(
            () =>
              document.querySelector('[data-np-active] img') instanceof HTMLImageElement &&
              (document.querySelector('[data-np-active] img') as HTMLImageElement).complete,
          )
        }
        await page.waitForFunction(() => {
          const summary = window.__lab?.summary()
          return summary && summary.images > 0 && summary.pending === 0
        })
        await expect.poll(() => page.locator('.lab-badge').count()).toBeGreaterThan(0)
        const summary: LabSummary = await page.evaluate(() => window.__lab!.summary())
        await testInfo.attach('lab-summary', {
          body: JSON.stringify({ scenario: scenario.name, viewport, ...summary }),
          contentType: 'application/json',
        })
        await writeFile(
          testInfo.outputPath('summary.json'),
          JSON.stringify({ scenario: scenario.name, viewport, ...summary }, null, 2),
        )
        expect(summary.provider).toBe('ipx')
        if (summary.cls !== null) expect(summary.cls).toBe(0)
        expect(summary.blankTotalMs).toBe(0)
        expect(summary.dpr).toBe(viewport.deviceScaleFactor)
        expect(summary.ladder).toEqual([
          128, 256, 384, 512, 640, 768, 1024, 1280, 1536, 1920, 2048, 2560, 3072, 3840, 5120, 6144,
        ])
        expect(summary.ladder).toContain(6144)
        const badges = await page.locator('.lab-badge').allTextContents()
        expect(badges).toHaveLength(summary.images)
        for (const text of badges) expect(text).toMatch(badge)
        const details = await page.locator('.lab-badge').evaluateAll((elements) =>
          elements.map((element) => ({
            title: element.getAttribute('title'),
            text: element.textContent,
            url: element.getAttribute('data-url'),
            srcset: element.getAttribute('data-srcset'),
            background: getComputedStyle(element).backgroundColor,
          })),
        )
        await writeFile(testInfo.outputPath('readings.json'), JSON.stringify(details, null, 2))
        let floors = 0
        for (const detail of details) {
          expect(detail.title).toBe(detail.text)
          const hasFloor = detail.text!.includes(' · floor')
          if (hasFloor) {
            floors++
            const got = Number(detail.text!.match(/ · got (\d+)px/)![1])
            const widths = detail
              .srcset!.split(',')
              .map((candidate) => Number(candidate.trim().split(/\s+/).at(-1)!.replace(/w$/, '')))
            expect(got).toBe(Math.min(...widths))
            expect(detail.background).toBe('rgb(22, 163, 74)')
          }
        }
        expect(floors).toBe(summary.floor)
        await expect(page.locator('.lab-summary')).toContainText(` · Floor: ${summary.floor}`)
        if (scenario.name === 'album columns 6' && viewport.width === 375) {
          // Capped 80px tall-source srcset must qualify, even below the 128px provider floor.
          const tall = details.find((detail) => detail.url?.endsWith('/lab/tall.jpg'))!
          expect(tall.text).toContain('got 80px')
          expect(tall.text).toContain(' · floor')
          expect(tall.background).toBe('rgb(22, 163, 74)')
        }
        const styles = await page.locator('.lab-badge').evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element)
            return {
              whiteSpace: style.whiteSpace,
              overflow: style.overflow,
              textOverflow: style.textOverflow,
              maxWidth: style.maxWidth,
              color: style.color,
              size: style.fontSize,
              padding: style.padding,
              background: style.backgroundColor,
            }
          }),
        )
        for (const style of styles) {
          expect(style.whiteSpace).toBe('nowrap')
          expect(style.overflow).toBe('hidden')
          expect(style.textOverflow).toBe('ellipsis')
          expect(style.maxWidth).toBe('calc(100% - 4px)')
          expect(style.color).toBe('rgb(255, 255, 255)')
          expect(style.size).toBe('11px')
          expect(style.padding).toBe('2px 4px')
          expect(['rgb(22, 163, 74)', 'rgb(217, 119, 6)', 'rgb(220, 38, 38)']).toContain(
            style.background,
          )
        }
        if (scenario.name === 'album columns 6')
          await page.screenshot({
            path: testInfo.outputPath(
              `columns-${viewport.width}@${viewport.deviceScaleFactor}.png`,
            ),
          })
        expect(errors).toEqual([])
        expect(summary.inRangePercent).toBeGreaterThanOrEqual(90)
      } finally {
        await context.close()
      }
    })
  }
}

// Catches double compensation when the browser already clamps a shrinking horizontal bar.
test('image budget lab keeps scrolled diagnostics visible on lightbox open', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
  })
  const page = await context.newPage()
  try {
    await page.goto('/lab/lightbox')
    await page.waitForFunction(
      () => window.__lab?.summary().images && window.__lab.summary().pending === 0,
    )
    await page.getByRole('button', { name: 'Show overlay', exact: true }).click()
    const toggle = page.locator('.lab-summary button')
    await expect(toggle).toHaveText('Hide overlay')
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.lab-summary').evaluate((element) => {
      element.scrollLeft = element.scrollWidth
    })
    const before = await toggle.boundingBox()
    await page.locator('.np-album__item').nth(1).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('[data-np-transition-frame]')).toBeHidden({ timeout: 15_000 })
    await page.waitForFunction(
      () => window.__lab?.summary().images && window.__lab.summary().pending === 0,
    )
    await page.waitForTimeout(500)
    const after = await toggle.boundingBox()
    await writeFile(testInfo.outputPath('bar-position.json'), JSON.stringify({ before, after }))
    await expect(toggle).toBeInViewport({ ratio: 1 })
    const summary = await page.evaluate(() => window.__lab!.summary())
    if (summary.cls !== null) expect(summary.cls).toBe(0)
  } finally {
    await context.close()
  }
})

test('image budget lab archive appends 200 after reaching the end', async ({ page }) => {
  await page.goto('/lab/archive?n=1000')
  await page.waitForFunction(() => !!window.__lab)
  await expect(page.locator('.np-album__item')).toHaveCount(1000)
  await page.locator('.np-album__end').scrollIntoViewIfNeeded()
  await expect.poll(() => page.locator('.np-album__item').count()).toBeGreaterThanOrEqual(1200)
  await page.waitForTimeout(500)
  const summary = await page.evaluate(() => window.__lab!.summary())
  if (summary.cls !== null) expect(summary.cls).toBe(0)
  expect(summary.blankTotalMs).toBe(0)
})

test('image budget lab index and album controls use the specified contract', async ({ page }) => {
  await page.goto('/lab')
  await expect(page.getByRole('heading', { name: 'Image Lab', exact: true })).toBeVisible()
  await expect(
    page.getByText(
      'Every image on these pages reports what it needed and what it got. Toggle the overlay to inspect each one.',
      { exact: true },
    ),
  ).toBeVisible()
  for (const name of ['Album', 'Carousel', 'Single photo', 'Lightbox', 'Large archive'])
    await expect(
      page.locator('.lab-content').getByRole('link', { name, exact: true }),
    ).toBeVisible()
  await page.locator('.lab-content').getByRole('link', { name: 'Album', exact: true }).click()
  await page.waitForFunction(
    () => window.__lab?.summary().images && window.__lab.summary().images > 0,
  )
  await page.getByLabel('Layout', { exact: true }).selectOption('columns')
  await page.getByLabel('Columns', { exact: true }).fill('6')
  await page.getByLabel('Columns', { exact: true }).dispatchEvent('change')
  await page.getByLabel('Photos', { exact: true }).fill('20')
  await page.getByLabel('Photos', { exact: true }).dispatchEvent('change')
  await expect(page.locator('.np-album__item')).toHaveCount(20)
  await expect(page).toHaveURL(/layout=columns/)
  await expect(page).toHaveURL(/columns=6/)
})

test('image budget lab cold sources and visible wait are honest', async ({ page }) => {
  const imageAccept = 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
  const heads: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'HEAD') heads.push(request.headers()['accept'] ?? '')
  })
  await page.route('**/_ipx/**/__lab_cold/**', async (route) => {
    if (route.request().method() === 'GET') await new Promise((done) => setTimeout(done, 1500))
    await route.continue()
  })
  const html = await (await page.request.get('/lab/photo?cold=1')).text()
  expect(html).toContain('loading="lazy"')
  expect(html).toContain('decoding="async"')
  expect(html).toContain('background-color:#')
  await page.goto('/lab/photo?cold=1', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !!window.__lab)
  await page.waitForFunction(
    () => window.__lab!.summary().images === 2 && window.__lab!.summary().pending === 0,
  )
  const urls = await page
    .locator('.lab-content img')
    .evaluateAll((images) => images.map((image) => (image as HTMLImageElement).currentSrc))
  expect(new Set(urls).size).toBe(2)
  for (const url of urls) expect(url).toMatch(/\/_ipx\/[^/]+\/__lab_cold\/[\w-]+\/lab\//)
  const firstNonce = urls[0]!.match(/__lab_cold\/([^/]+)/)![1]
  const summary = await page.evaluate(() => window.__lab!.summary())
  expect(summary.waitMaxMs).toBeGreaterThan(500)
  expect(summary.imageTimings.some((image) => image.waitMs > 500)).toBe(true)
  expect(summary.blankTotalMs).toBeGreaterThanOrEqual(0)
  // The LCP observer may select the other image or text; check the priority image's head contract directly.
  await expect(page.locator('head link[rel=preload][as=image]')).toHaveCount(1)
  const priorityImage = page.locator('.lab-content img').first()
  await expect(page.locator('head link[rel=preload][as=image]')).toHaveAttribute(
    'imagesrcset',
    (await priorityImage.getAttribute('srcset'))!,
  )
  expect(heads.length).toBeGreaterThan(0)
  expect(heads.every((accept) => accept === imageAccept)).toBe(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.lab-content img').first()).toHaveAttribute(
    'src',
    new RegExp(`__lab_cold/(?!${firstNonce})`),
  )
})

test('image budget lab reports blank time without a painted placeholder', async ({ page }) => {
  await page.goto('/lab/photo')
  await page.waitForFunction(() => !!window.__lab)
  await page.route('**/lab/normal-05.jpg?blank-proof', async (route) => {
    await new Promise((done) => setTimeout(done, 1200))
    await route.continue()
  })
  await page.evaluate(() => {
    const original = document.querySelector<HTMLImageElement>('.lab-content img')!
    const image = document.createElement('img')
    image.alt = original.alt
    image.width = 200
    image.height = 200
    image.style.cssText = 'position:fixed;top:400px;left:100px;width:200px;height:200px;z-index:63'
    image.src = '/lab/normal-05.jpg?blank-proof'
    document.querySelector('.lab-content')!.append(image)
  })
  await page.waitForFunction(() =>
    window
      .__lab!.summary()
      .imageTimings.some((image) => image.url.includes('blank-proof') && !image.pending),
  )
  const reading = await page.evaluate(() =>
    window.__lab!.summary().imageTimings.find((image) => image.url.includes('blank-proof'))!,
  )
  expect(reading.waitMs).toBeGreaterThan(800)
  expect(reading.blankMs).toBeGreaterThan(800)
  expect(reading.blankMs / 16.7).toBeCloseTo(Math.round(reading.blankMs / 16.7), 10)
  expect(await page.locator('.lab-summary').textContent()).toContain('Blank:')
})

test('image budget lab counts complete blank frames per interval', async ({ page }) => {
  await page.goto('/lab/photo')
  await page.waitForFunction(() => !!window.__lab)
  await page.evaluate(() => {
    const image = document.createElement('img')
    image.id = 'blank-frames'
    image.style.cssText =
      'position:fixed;top:400px;left:100px;width:200px;height:200px;background-color:red'
    document.querySelector('.lab-content')!.append(image)
  })
  await page.waitForFunction(() =>
    window.__lab!.summary().imageTimings.some((image) => image.url === ''),
  )
  const blanks = await page.evaluate(async () => {
    const image = document.getElementById('blank-frames')!
    const originalNow = performance.now.bind(performance)
    let time = 1000
    performance.now = () => time
    const samples: number[] = []
    // Use real visibility and mutation observers, controlling only the clock.
    const mutations = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
    try {
      for (const duration of [0.3, 16.6, 16.7, 33.5]) {
        image.style.backgroundColor = 'transparent'
        await mutations()
        time += duration
        image.style.backgroundColor = 'red'
        await mutations()
        samples.push(window.__lab!.summary().imageTimings.find((item) => item.url === '')!.blankMs)
        time += 100
      }
      return samples
    } finally {
      performance.now = originalNow
      image.remove()
    }
  })
  expect(blanks.slice(0, 2)).toEqual([0, 0])
  expect(blanks[2]).toBeCloseTo(16.7, 10)
  expect(blanks[3]).toBeCloseTo(50.1, 10)
})

test('image budget lab does not backdate blank time from a delayed intersection', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super((entries, observer) => {
          if (!entries.some((entry) => entry.target.id === 'delayed-intersection')) {
            callback(entries, observer)
            return
          }
          setTimeout(() => {
            document.getElementById('delayed-intersection')!.style.backgroundColor = 'transparent'
            // Let the real MutationObserver see the current appearance before
            // delivering the older visibility entry, as separate browser tasks do.
            setTimeout(() => callback(entries, observer), 0)
          }, 400)
        }, options)
      }
    }
  })
  await page.goto('/lab/photo')
  await page.waitForFunction(() => !!window.__lab)
  await page.route('**/lab/normal-05.jpg?delayed-intersection', async (route) => {
    await new Promise((done) => setTimeout(done, 1400))
    await route.continue()
  })
  await page.evaluate(() => {
    const image = document.createElement('img')
    image.id = 'delayed-intersection'
    image.style.cssText =
      'position:fixed;top:400px;left:100px;width:200px;height:200px;background-color:red'
    image.src = '/lab/normal-05.jpg?delayed-intersection'
    document.querySelector('.lab-content')!.append(image)
  })
  await page.waitForFunction(() =>
    window
      .__labTiming!.snapshot()
      .images.some((image) => image.url.includes('delayed-intersection') && !image.pending),
  )
  await page.waitForTimeout(100)
  const reading = await page.evaluate(() =>
    window
      .__labTiming!.snapshot()
      .images.find((image) => image.url.includes('delayed-intersection'))!,
  )
  expect(reading.blankMs).toBeGreaterThan(500)
  // The first 400 ms had a red placeholder, even though the visibility entry arrived later.
  // Whole-frame counting and a busy browser can shift both ends by a few frames.
  expect(reading.waitMs - reading.blankMs).toBeGreaterThan(250)
})

test('image budget lab CLS counts gallery sources and ignores diagnostic sources', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.use.browserName !== 'chromium',
    'Layout shift entries require Chromium',
  )
  await page.goto('/lab/photo')
  await page.waitForFunction(
    () => window.__lab?.summary().images && window.__lab.summary().pending === 0,
  )
  await page.waitForTimeout(600)
  await page.locator('.lab-summary').evaluate((bar) => {
    bar.style.paddingLeft = '100px'
  })
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.__lab!.summary().cls)).toBe(0)
  await page
    .locator('.lab-content img')
    .first()
    .evaluate((image) => {
      image.style.marginTop = '100px'
    })
  await expect.poll(() => page.evaluate(() => window.__lab!.summary().cls)).toBeGreaterThan(0)
})
