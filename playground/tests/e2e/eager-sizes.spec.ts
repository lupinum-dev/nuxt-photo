import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })

declare global {
  interface Window {
    __releaseAhead: () => void
    __placeholderFlashes: string[]
  }
}

test('nuxt image load-ahead keeps px candidates and does not restore a painted placeholder', async ({
  page,
}, testInfo) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'image' && request.url().includes('/lab/normal-05.jpg'))
      requests.push(request.url())
  })
  // Let native lazy loading paint first, then deliver the real load-ahead observer entries.
  await page.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver
    const release: (() => void)[] = []
    window.__releaseAhead = () => release.splice(0).forEach((deliver) => deliver())
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super((entries, observer) => {
          if (options?.rootMargin) release.push(() => callback(entries, observer))
          else callback(entries, observer)
        }, options)
      }
    }
  })
  await page.goto('/lab/photo')
  const image = page.locator('.lab-content img').nth(1)
  await expect(image).toHaveAttribute('loading', 'lazy')
  await expect(image).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await image.evaluate((element) => {
    window.__placeholderFlashes = []
    new MutationObserver((records) => {
      // oldValue catches a background that was added and removed in the same microtask.
      for (const record of records) {
        if (/background-(color|image)/.test(record.oldValue ?? ''))
          window.__placeholderFlashes.push(record.oldValue!)
      }
      if (element.style.backgroundColor || element.style.backgroundImage)
        window.__placeholderFlashes.push(element.style.cssText)
    }).observe(element, { attributes: true, attributeFilter: ['style'], attributeOldValue: true })
  })
  await page.evaluate(() => window.__releaseAhead())
  await expect(image).toHaveAttribute('loading', 'eager')
  await page.waitForLoadState('networkidle')
  const proof = await image.evaluate(async (element: HTMLImageElement) => {
    const file = new Image()
    file.src = element.currentSrc
    await file.decode()
    return {
      sizes: element.sizes,
      needed: element.getBoundingClientRect().width * devicePixelRatio,
      got: file.naturalWidth,
      url: element.currentSrc,
      flashes: window.__placeholderFlashes,
    }
  })
  await testInfo.attach('promotion', {
    body: JSON.stringify(proof),
    contentType: 'application/json',
  })
  await writeFile(
    testInfo.outputPath('promotion.json'),
    JSON.stringify({ ...proof, requests }, null, 2),
  )
  await page.screenshot({ path: testInfo.outputPath('promotion.png') })
  expect(proof.got).toBeLessThanOrEqual(proof.needed * 2)
  expect(requests).toContain(proof.url)
  for (const url of requests) {
    const width = Number(url.match(/\/w_(\d+)/)?.[1])
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThanOrEqual(proof.needed * 2)
  }
  expect(proof.flashes).toEqual([])
  expect(proof.sizes).not.toMatch(/^auto/)
})

test('nuxt image eager carousel thumbnail requests its px candidate', async ({
  page,
}, testInfo) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'image' && request.url().includes('/lab/huge.jpg'))
      requests.push(request.url())
  })
  await page.goto('/eager-sizes')
  const image = page.locator('.np-carousel__thumb-img').first()
  await expect(image).toHaveCount(1)
  await expect(image).toHaveAttribute('loading', 'eager')
  await page.waitForLoadState('networkidle')
  const proof = await image.evaluate(async (element: HTMLImageElement) => {
    const file = new Image()
    file.src = element.currentSrc
    await file.decode()
    return {
      sizes: element.sizes,
      needed: element.getBoundingClientRect().width * devicePixelRatio,
      got: file.naturalWidth,
      url: element.currentSrc,
    }
  })
  await testInfo.attach('thumbnail', {
    body: JSON.stringify({ ...proof, requests }),
    contentType: 'application/json',
  })
  await writeFile(
    testInfo.outputPath('thumbnail.json'),
    JSON.stringify({ ...proof, requests }, null, 2),
  )
  await page.screenshot({ path: testInfo.outputPath('thumbnail.png') })
  expect(requests).toContain(proof.url)
  expect(proof.got).toBeLessThanOrEqual(proof.needed * 2)
  expect(proof.sizes).not.toMatch(/^auto/)
})
