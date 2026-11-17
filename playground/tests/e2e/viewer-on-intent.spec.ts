import type { Page } from '@playwright/test'
import { expect, gotoPlayground, stubImageRequests, test } from './helpers'

// An album page loads the viewer chunk (engine and lightbox) only when a visitor is likely
// to open a photo. The chunk is recognised by a string only the viewer engine contains.
const VIEWER_MARK = 'nuxt-photo:lightbox-owner'

async function watchViewerChunk(page: Page, saveData: boolean) {
  await page.addInitScript((saveData) => {
    Object.defineProperty(Navigator.prototype, 'connection', {
      configurable: true,
      get: () => ({ saveData }),
    })
  }, saveData)
  const requests: string[] = []
  page.on('response', async (response) => {
    if (!response.url().endsWith('.js')) return
    const body = await response.text().catch(() => '')
    if (body.includes(VIEWER_MARK)) requests.push(response.url())
  })
  return requests
}

test.describe('viewer on intent', () => {
  test('album loads no viewer code before a thumbnail is hovered when saving data', async ({
    page,
  }) => {
    await stubImageRequests(page)
    const requests = await watchViewerChunk(page, true)
    await gotoPlayground(page, '/layouts?layout=masonry')
    await page.waitForLoadState('networkidle')
    // Longer than the idle fallback, which saving data turns off.
    await page.waitForTimeout(2500)
    expect(requests).toEqual([])

    await page.locator('.np-album__item').first().hover()
    await expect.poll(() => requests.length).toBe(1)
  })

  test('first click on a cold album opens the lightbox from the thumbnail', async ({ page }) => {
    await stubImageRequests(page)
    const requests = await watchViewerChunk(page, true)
    // A slow stylesheet: the viewer must not open before its CSS applies, or the open could not
    // measure the lightbox and would fade in beside a still visible thumbnail.
    await page.route(/ViewerHost\w*\.[\w-]+\.css$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.continue()
    })
    await gotoPlayground(page, '/layouts?layout=masonry')
    await page.waitForLoadState('networkidle')
    expect(requests).toEqual([])

    const thumbnail = page.locator('.np-album__item').nth(1)
    await thumbnail.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    // The flight hides the clicked thumbnail while its copy is in the lightbox.
    await expect(thumbnail.locator(':scope > div')).toHaveCSS('opacity', '0')
    expect(requests).toHaveLength(1)

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(thumbnail).toBeFocused()
  })

  test('page without photo components loads no lightbox CSS', async ({ page }) => {
    // Save-data turns off NuxtLink prefetch, which would load the CSS of the linked pages.
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'connection', { value: { saveData: true } }),
    )
    const stylesheets: string[] = []
    page.on('response', async (response) => {
      if (response.request().resourceType() === 'stylesheet')
        stylesheets.push(await response.text().catch(() => ''))
    })
    await gotoPlayground(page, '/plain')
    await page.waitForLoadState('networkidle')
    const inline = await page.locator('style').allTextContents()
    expect([...stylesheets, ...inline].filter((css) => css.includes('.np-lightbox'))).toEqual([])
    // The album CSS is still global, so the check would see global CSS if it were there.
    expect([...stylesheets, ...inline].some((css) => css.includes('.np-album'))).toBe(true)
  })

  // The lightbox CSS loads with the viewer; the carousel's live region must not wait for it.
  test('carousel keeps its slide status hidden before the viewer loads', async ({ page }) => {
    await stubImageRequests(page)
    const requests = await watchViewerChunk(page, true)
    await gotoPlayground(page, '/carousel')
    const status = page.locator('.np-carousel [data-np-sr-only]').first()
    await expect(status).toHaveCSS('position', 'absolute')
    await expect(status).toHaveCSS('width', '1px')
    expect(requests).toEqual([])
  })

  test('album loads the viewer once the browser is idle, without interaction', async ({ page }) => {
    await stubImageRequests(page)
    const requests = await watchViewerChunk(page, false)
    await gotoPlayground(page, '/layouts?layout=masonry')
    await expect.poll(() => requests.length, { timeout: 10_000 }).toBe(1)
  })

  test('app CSS keeps its lightbox variables when the viewer CSS loads later', async ({ page }) => {
    await stubImageRequests(page)
    await watchViewerChunk(page, true)
    await gotoPlayground(page, '/layouts?layout=masonry')
    await page.waitForLoadState('networkidle')
    // Stands in for the app's own stylesheet: it is in the page before the viewer CSS arrives.
    await page.addStyleTag({
      content: '.np-lightbox { --np-btn-bg: rgb(1, 2, 3); --np-frame-inset-inline: 33px; }',
    })

    await page.locator('.np-album__item').first().click()
    const lightbox = page.locator('.np-lightbox')
    await expect(lightbox).toBeVisible()
    const variable = (name: string) =>
      lightbox.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), name)
    expect(await variable('--np-btn-bg')).toBe('rgb(1, 2, 3)')
    expect(await variable('--np-frame-inset-inline')).toBe('33px')
  })
})
