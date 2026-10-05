import { expect, gotoPlayground, stubImageRequests, test } from './helpers'

test('layout explorer switches layouts and still opens the lightbox', async ({ page }) => {
  await stubImageRequests(page)
  await gotoPlayground(page, '/layouts')

  for (const name of [
    'rows',
    'columns',
    'masonry',
    'grid',
    'bento',
    'mosaic',
    'accordion',
  ] as const) {
    await page.getByRole('button', { name }).click()
    await expect(page.locator('.np-album__item')).toHaveCount(name === 'mosaic' ? 5 : 12)
    if (name === 'mosaic') {
      await expect(page.locator('.np-album__more')).toHaveText('+7')
    }
  }

  await page.getByRole('button', { name: 'Dandelion seed heads in evening light' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.locator('.np-lightbox__counter')).toContainText('2 / 12')

  await expect(dialog.getByRole('button', { name: 'Close' })).toBeEnabled()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('css-only layouts render the same tile boxes before and after hydration', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000)

  for (const name of ['grid', 'bento', 'mosaic', 'accordion'] as const) {
    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const snapshots = []
      for (const javaScriptEnabled of [false, true]) {
        const context = await browser.newContext({ baseURL, javaScriptEnabled, viewport })
        try {
          const page = await context.newPage()
          await stubImageRequests(page)
          await gotoPlayground(page, `/layouts?layout=${name}`)
          if (javaScriptEnabled) {
            // Vue sets __vue_app__ on the root after mount (including hydration) completes.
            await page.waitForFunction(() =>
              Boolean(
                (
                  document.querySelector('#__nuxt') as
                    | (HTMLElement & { __vue_app__?: unknown })
                    | null
                )?.__vue_app__,
              ),
            )
          }
          await page.evaluate(() => document.fonts.ready.then(() => undefined))
          // Accordion hover changes its widths, so keep the pointer outside the album.
          await page.mouse.move(0, 0)
          const items = await page.locator('.np-album__item').evaluateAll((elements) =>
            elements.map((element) => {
              const { x, y, width, height } = element.getBoundingClientRect()
              return {
                identity: element.getAttribute('aria-label') ?? element.querySelector('img')?.alt,
                x,
                y,
                width,
                height,
              }
            }),
          )
          const albumWidth = await page
            .locator('.np-album')
            .evaluate((element) => element.getBoundingClientRect().width)
          snapshots.push({ items, albumWidth })
        } finally {
          await context.close()
        }
      }

      const [before, after] = snapshots
      if (!before || !after) throw new Error('Missing SSR or hydrated snapshot')
      const label = `${name} at ${viewport.width}px`
      await test.info().attach(label, {
        body: JSON.stringify({ before, after }, null, 2),
        contentType: 'application/json',
      })
      expect.soft(before.items.length, label).toBeGreaterThan(0)
      expect.soft(after.items.length, label).toBe(before.items.length)
      expect
        .soft(
          after.items.map((item) => item.identity),
          label,
        )
        .toEqual(before.items.map((item) => item.identity))
      for (const [index, item] of before.items.entries()) {
        const hydrated = after.items[index]
        if (!hydrated) continue
        for (const dimension of ['x', 'y', 'width', 'height'] as const) {
          expect
            .soft(
              Math.abs(item[dimension] - hydrated[dimension]),
              `${label}, item ${index}, ${dimension}`,
            )
            .toBeLessThanOrEqual(1)
        }
      }
      for (const snapshot of snapshots) {
        if (name === 'grid' || name === 'bento') {
          expect
            .soft(new Set(snapshot.items.map((item) => `${item.x}:${item.width}`)).size, label)
            .toBeGreaterThan(1)
        }
        if (name === 'bento') {
          if (viewport.width === 390) {
            // Two columns: a tile spans one or both, never a third of the width.
            for (const item of snapshot.items) {
              const half = Math.abs(item.width * 2 - snapshot.albumWidth) < snapshot.albumWidth / 4
              const full = Math.abs(item.width - snapshot.albumWidth) <= 1
              expect.soft(half || full, label).toBe(true)
            }
          } else {
            expect
              .soft(
                snapshot.items.some((item) => item.width < snapshot.albumWidth / 3),
                label,
              )
              .toBe(true)
          }
        }
      }
    }
  }
})
