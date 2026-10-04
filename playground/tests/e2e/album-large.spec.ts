import { expect, stubImageRequests, test } from './helpers'

test('navigation from a far thumbnail preserves the close-flight destination in a 1000-photo album', async ({
  page,
}) => {
  await stubImageRequests(page)
  await page.goto('/album-large')
  await expect(page.locator('[data-ready=true]')).toBeVisible()
  await page.locator('#mount-album').click()
  const thumbnail = page.locator('.np-album__item').nth(900)
  await thumbnail.scrollIntoViewIfNeeded()
  const image = thumbnail.locator('img')
  const before = await image.boundingBox()
  await thumbnail.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('.np-lightbox__counter')).toContainText('901 / 1000')
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                ((animation.effect as KeyframeEffect).target as HTMLElement)?.hasAttribute(
                  'data-np-transition-frame',
                ),
            ).length,
      ),
    )
    .toBe(0)
  const flight = await page.getByRole('button', { name: 'Close' }).evaluate(async (button) => {
    ;(button as HTMLElement).click()
    for (let frame = 0; frame < 60; frame++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const animation = document
        .getAnimations()
        .find((animation) =>
          ((animation.effect as KeyframeEffect).target as HTMLElement)?.hasAttribute(
            'data-np-transition-frame',
          ),
        )
      if (!animation) continue
      animation.pause()
      animation.currentTime = Number(animation.effect!.getTiming().duration)
      const rect = (
        (animation.effect as KeyframeEffect).target as HTMLElement
      ).getBoundingClientRect()
      const destination = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      animation.play()
      return destination
    }
    throw new Error('Close flight never started')
  })
  for (const key of ['x', 'y', 'width', 'height'] as const)
    expect(Math.abs(flight[key] - before![key])).toBeLessThan(1)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const after = await image.boundingBox()
  for (const key of ['x', 'y', 'width', 'height'] as const)
    expect(Math.abs(after![key] - before![key])).toBeLessThan(1)
})

test('folder navigation fetches just one folder and hydration preserves its ids', async ({
  page,
}) => {
  await page.goto('/album-large')
  await expect(page.locator('[data-ready=true]')).toBeVisible()
  const request = page.waitForResponse((response) =>
    response.url().includes('/__nuxt_photo/folder'),
  )
  await page.locator('#folder-link').click()
  const records = await (await request).json()
  expect(records.length).toBe(12)
  expect(
    records.every(
      (photo: { id: string; placeholderSrc: string }) =>
        photo.id.startsWith('photos/') &&
        photo.placeholderSrc.startsWith('data:image/webp;base64,'),
    ),
  ).toBe(true)
  await expect(page.locator('[data-ready=true]')).toBeVisible()
  await expect(page.locator('.np-album__item')).toHaveCount(12)
  const ids = await page.locator('#folder-data').textContent()
  await page.reload()
  await expect(page.locator('[data-ready=true]')).toBeVisible()
  await expect(page.locator('#folder-data')).toHaveText(ids!)
  // Catches a shallow async-data ref leaving recipes stale after an in-place append.
  await page.goto('/folder-images?append=1')
  await expect(page.locator('[data-ready=true]')).toBeVisible()
  await expect(page.locator('.np-album__item')).toHaveCount(13)
  await expect(page.locator('#folder-data')).toContainText('photos/client-appended')
})
