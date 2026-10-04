import type { Page } from '@playwright/test'
import { expect, test, stubImageRequests, gotoPlayground } from './helpers'

const hydrationErrors = new WeakMap<Page, string[]>()

async function gotoFeatures(page: Page, path: string) {
  await gotoPlayground(page, path)
  await expect(page.locator('.proof-page')).toHaveAttribute('data-ready', 'true')
}

test.beforeEach(async ({ page }) => {
  await stubImageRequests(page)
  const errors: string[] = []
  hydrationErrors.set(page, errors)
  page.on('console', (message) => {
    if (/hydration.*mismatch/i.test(message.text())) errors.push(message.text())
  })
})

test.afterEach(async ({ page }) => {
  expect(hydrationErrors.get(page)).toEqual([])
})

test('lightbox navigation history closes on Back without router, middleware or scroll changes', async ({
  page,
}) => {
  await gotoFeatures(page, '/lightbox-features?link=off')
  await page.locator('.np-album__item').first().scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollTo(0, 180))
  const before = await page.evaluate(() => ({
    url: location.href,
    scroll: scrollY,
    state: history.state,
  }))
  expect(before.scroll).toBe(180)
  const middleware = await page.getByTestId('middleware-runs').textContent()
  await page.locator('.np-album__item').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => location.href)).toBe(before.url)
  expect(await page.evaluate(() => history.state.position)).toBe(before.state.position)
  await page.evaluate(() => history.back())
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => ({ url: location.href, scroll: scrollY }))).toEqual({
    url: before.url,
    scroll: before.scroll,
  })
  await expect(page.getByTestId('router-runs')).toHaveText('0')
  await expect(page.getByTestId('middleware-runs')).toHaveText(middleware!)
})

test('lightbox navigation UI close consumes its history entry before normal page Back', async ({
  page,
}) => {
  await gotoPlayground(page, '/layouts')
  await gotoFeatures(page, '/lightbox-features?link=off')
  await page.evaluate(() => window.scrollTo(0, 180))
  const before = await page.evaluate(() => ({ url: location.href, scroll: scrollY }))
  const middleware = await page.getByTestId('middleware-runs').textContent()
  await page.locator('.np-album__item').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => ({ url: location.href, scroll: scrollY }))).toEqual(before)
  await expect(page.getByTestId('router-runs')).toHaveText('0')
  await expect(page.getByTestId('middleware-runs')).toHaveText(middleware!)
  expect(await page.evaluate(() => history.state.__nuxtPhoto)).toBeUndefined()
  await page.goBack()
  await expect(page).toHaveURL(/\/layouts$/)
})

test('lightbox navigation deep link is rendered on the server, opens without animation, and closes by replacement', async ({
  page,
  request,
}) => {
  const response = await request.get('/lightbox-features?photo=feature-250&keep=yes')
  const html = await response.text()
  expect(html).toContain('data-np-lightbox-root')
  expect(html).toContain('data-np-initial')
  expect(html).toContain('251 / 500')
  await gotoFeatures(page, '/lightbox-features?photo=feature-250&keep=yes')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.np-lightbox__counter')).toHaveText('251 / 500')
  await expect(page.getByTestId('tools-slot')).toHaveAttribute('data-photo', 'feature-250')
  expect(await page.evaluate(() => history.state.__nuxtPhoto)).toBeUndefined()
  const length = await page.evaluate(() => history.length)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/lightbox-features\?keep=yes$/)
  expect(await page.evaluate(() => history.length)).toBe(length)
  await expect(page.getByTestId('router-runs')).toHaveText('0')
})

test('lightbox navigation ignores unknown ids and keeps two gallery parameters independent', async ({
  page,
}) => {
  await gotoFeatures(page, '/lightbox-features?photo=unknown&portrait=unknown&keep=yes')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.locator('.np-album__item').first().click()
  await expect(page.getByTestId('tools-slot')).toHaveAttribute('data-photo', 'feature-0')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByTestId('tools-slot')).toHaveAttribute('data-photo', 'feature-1')
  expect(
    await page.evaluate(() => Object.fromEntries(new URL(location.href).searchParams)),
  ).toEqual({ photo: 'feature-1', portrait: 'unknown', keep: 'yes' })
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByTestId('second-gallery').locator('.np-album__item').nth(1).click()
  await expect(page.locator('.np-lightbox__counter')).toHaveText('2 / 3')
  expect(
    await page.evaluate(() => Object.fromEntries(new URL(location.href).searchParams)),
  ).toEqual({ photo: 'unknown', portrait: 'portrait-1', keep: 'yes' })
  await expect(page.getByRole('link', { name: 'Download', exact: true })).toHaveAttribute(
    'href',
    'https://example.com/portrait.jpg',
  )
  await expect(page.getByRole('link', { name: 'Download', exact: true })).toHaveAttribute(
    'target',
    '_blank',
  )
  await expect(page.getByRole('link', { name: 'Download', exact: true })).toHaveAttribute(
    'rel',
    'noopener',
  )
})

test('lightbox navigation mounts seven slide components for 500 photos and keeps navigating', async ({
  page,
}) => {
  await gotoFeatures(page, '/lightbox-features')
  await page.getByTestId('open-middle').click()
  await expect(page.locator('.np-lightbox__counter')).toHaveText('251 / 500')
  await expect(page.locator('[data-np-slide]')).toHaveCount(7)
  await expect(page.locator('[data-np-slide][data-np-active] img')).toHaveAttribute(
    'alt',
    'Feature photo 250',
  )
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.np-lightbox__counter')).toHaveText('252 / 500')
  await expect(page.locator('[data-np-slide]')).toHaveCount(7)
  await expect(page.locator('[data-np-slide][data-np-active] img')).toHaveAttribute(
    'alt',
    'Feature photo 251',
  )
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.np-lightbox__counter')).toHaveText('251 / 500')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('lightbox navigation tools follow capability checks, share the deep link and toggle fullscreen', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        ;(window as unknown as { shared: ShareData }).shared = data
      },
    })
    let fullscreen: Element | null = null
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreen,
    })
    Element.prototype.requestFullscreen = async function () {
      fullscreen = document.querySelector('[data-np-lightbox-root]')
      document.dispatchEvent(new Event('fullscreenchange'))
    }
    document.exitFullscreen = async () => {
      fullscreen = null
      document.dispatchEvent(new Event('fullscreenchange'))
    }
  })
  await gotoFeatures(page, '/lightbox-features')
  await page.locator('.np-album__item').first().click()
  await expect(page.getByTestId('tools-slot')).toHaveAttribute('data-index', '0')
  const download = page.getByRole('link', { name: 'Download', exact: true })
  await expect(download).toHaveAttribute('download', '')
  await expect(download).not.toHaveAttribute('target', '_blank')
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  expect(await page.evaluate(() => (window as unknown as { shared: ShareData }).shared)).toEqual({
    title: 'Feature photo 0',
    url: new URL('/lightbox-features?photo=feature-0', page.url()).href,
  })
  await page.getByRole('button', { name: 'Full screen', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Exit full screen', exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => document.fullscreenElement?.hasAttribute('data-np-lightbox-root')),
  ).toBe(true)
  await page.getByRole('button', { name: 'Exit full screen', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Full screen', exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('tools-desktop.png') })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({ path: testInfo.outputPath('tools-mobile.png') })
  const toolIcons = await page.locator('.np-lightbox__tools svg').evaluateAll((icons) =>
    icons.map((icon) => {
      const style = getComputedStyle(icon)
      return {
        viewBox: icon.getAttribute('viewBox'),
        stroke: style.strokeWidth,
        cap: style.strokeLinecap,
        join: style.strokeLinejoin,
      }
    }),
  )
  expect(toolIcons).toHaveLength(5)
  expect(toolIcons).toEqual(
    Array.from({ length: 5 }, () => ({
      viewBox: '0 0 24 24',
      stroke: '1.75px',
      cap: 'round',
      join: 'round',
    })),
  )
})

test('lightbox navigation supports native fullscreen when available', async ({
  page,
}, testInfo) => {
  await gotoFeatures(page, '/lightbox-features')
  await page.locator('.np-album__item').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const supported = await page.evaluate(
    () =>
      typeof document.querySelector<HTMLElement>('[data-np-lightbox-root]')?.requestFullscreen ===
        'function' &&
      typeof document.exitFullscreen === 'function' &&
      document.fullscreenEnabled !== false,
  )
  testInfo.annotations.push({
    type: 'fullscreen',
    description: supported
      ? 'Native fullscreen enter/exit exercised'
      : 'Unsupported API: button absent',
  })
  if (supported) {
    await page.getByRole('button', { name: 'Full screen', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Exit full screen', exact: true })).toBeVisible()
    expect(
      await page.evaluate(() => document.fullscreenElement?.hasAttribute('data-np-lightbox-root')),
    ).toBe(true)
    await page.getByRole('button', { name: 'Exit full screen', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Full screen', exact: true })).toBeVisible()
  } else {
    await expect(page.getByRole('button', { name: 'Full screen', exact: true })).toHaveCount(0)
  }
})

test('lightbox navigation respects history opt-out and opens the second gallery deep link', async ({
  page,
}) => {
  await gotoFeatures(page, '/lightbox-features?history=off&link=off')
  const length = await page.evaluate(() => history.length)
  await page.locator('.np-album__item').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(await page.evaluate(() => history.length)).toBe(length)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => history.length)).toBe(length)
  await gotoFeatures(page, '/lightbox-features?portrait=portrait-2')
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(page.locator('.np-lightbox__counter')).toHaveText('3 / 3')
  await expect(page.getByTestId('tools-slot')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page).toHaveURL(/\/lightbox-features$/)
})

test('lightbox navigation UI close preserves a foreign entry above its own history entry', async ({
  page,
}) => {
  await gotoFeatures(page, '/lightbox-features')
  await page.locator('.np-album__item').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const foreign = await page.evaluate(() => {
    const url = new URL(location.href)
    url.searchParams.set('photo', 'foreign')
    const state = {
      ...history.state,
      position: history.state.position + 1,
      __nuxtPhoto: undefined,
      application: 'other',
    }
    history.pushState(state, '', url)
    return { url: location.href, state: history.state, length: history.length }
  })
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(
    await page.evaluate(() => ({
      url: location.href,
      state: history.state,
      length: history.length,
    })),
  ).toEqual(foreign)
  await expect(page.getByTestId('router-runs')).toHaveText('0')
})

test('lightbox navigation hides unsupported tools and actions remain a full replacement with activePhoto', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      configurable: true,
      value: undefined,
    })
  })
  await gotoFeatures(page, '/lightbox-features')
  await page.locator('.np-album__item').first().click()
  await expect(page.getByRole('link', { name: 'Download', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Full screen', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await gotoFeatures(page, '/lightbox-features?actions=replace')
  await page.locator('.np-album__item').first().click()
  await expect(page.getByTestId('actions-slot')).toHaveAttribute('data-photo', 'feature-0')
  await expect(page.locator('.np-lightbox__tools')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0)
  await page.getByTestId('actions-slot').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
