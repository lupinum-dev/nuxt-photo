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
  /^need \d+px · got \d+px · \d+\.\d{2}× · \d+\.\d KB · [\w+.-]+ · (eager|lazy)(, high)?$/

for (const viewport of viewports) {
  for (const scenario of scenarios) {
    test(`image budget lab ${scenario.name} at ${viewport.width}@${viewport.deviceScaleFactor}`, async ({
      browser,
    }, testInfo) => {
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
          await expect(page.locator('[data-np-transition-frame]')).toBeHidden()
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
        expect(summary.dpr).toBe(viewport.deviceScaleFactor)
        expect(summary.ladder).toEqual([
          256, 512, 640, 768, 1024, 1280, 1536, 1920, 2048, 2560, 3072, 3840, 5120, 6144,
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
          })),
        )
        await writeFile(testInfo.outputPath('readings.json'), JSON.stringify(details, null, 2))
        for (const detail of details) expect(detail.title).toBe(detail.text)
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

test('image budget lab archive appends 200 after reaching the end', async ({ page }) => {
  await page.goto('/lab/archive?n=1000')
  await page.waitForFunction(() => !!window.__lab)
  await expect(page.locator('.np-album__item')).toHaveCount(1000)
  await page.locator('.np-album__end').scrollIntoViewIfNeeded()
  await expect.poll(() => page.locator('.np-album__item').count()).toBeGreaterThanOrEqual(1200)
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
