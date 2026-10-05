import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

declare global {
  interface Window {
    __prefetchProof: {
      srcset: string
      sizes: string
      priority: string
      decoding: string
      activeLoaded: boolean
      openingSettled: boolean
    }[]
  }
}

for (const [path, count] of [
  ['/lab/album?priority=0', 0],
  ['/lab/album?priority=3', 3],
  ['/lab/album?priority=10', 6],
  ['/lab/photo', 1],
  ['/lab/carousel', 1],
] as const) {
  test(`nuxt image ${path} emits ${count} matching SSR preloads`, async ({ request, page }) => {
    const response = await request.get(path)
    expect(response.ok()).toBe(true)
    const html = await response.text()
    const result = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const links = [...doc.head.querySelectorAll('link[rel="preload"][as="image"]')]
      const images = [...doc.querySelectorAll('img[fetchpriority="high"]')]
      return {
        count: links.length,
        unique: new Set(links.map((link) => link.getAttribute('imagesrcset'))).size,
        matching: links.every(
          (link) =>
            link.getAttribute('fetchpriority') === 'high' &&
            images.some(
              (image) =>
                image.getAttribute('srcset') === link.getAttribute('imagesrcset') &&
                image.getAttribute('sizes') === link.getAttribute('imagesizes') &&
                image.getAttribute('loading') === 'eager',
            ),
        ),
      }
    }, html)
    expect(result).toEqual({ count, unique: count, matching: true })
  })
}

test('nuxt image SSR dedupes matching priority sources', async ({ request }) => {
  const html = await (await request.get('/preload-prefetch?duplicate=1')).text()
  expect([...html.matchAll(/<link[^>]*rel="preload"[^>]*as="image"/g)]).toHaveLength(1)
})

for (const saveData of [false, true]) {
  test(`nuxt image lightbox neighbour prefetch saveData=${saveData}`, async ({
    page,
  }, testInfo) => {
    const requests: string[] = []
    page.on('request', (request) => {
      if (
        request.resourceType() === 'image' &&
        request.url().includes('/lab/normal-') &&
        !request.url().includes('/w_24&')
      )
        requests.push(request.url())
    })
    await page.addInitScript((saveData) => {
      Object.defineProperty(navigator, 'connection', { value: { saveData }, configurable: true })
      window.__prefetchProof = []
      const NativeImage = window.Image
      window.Image = class extends NativeImage {
        override set src(value: string) {
          const active = document.querySelector<HTMLImageElement>('[data-np-active] img')
          const transition = document.querySelector<HTMLElement>('[data-np-transition-frame]')
          if (value.includes('/lab/normal-'))
            window.__prefetchProof.push({
              srcset: this.srcset,
              sizes: this.sizes,
              priority: this.fetchPriority,
              decoding: this.decoding,
              activeLoaded: !!active?.complete && active.naturalWidth > 0,
              openingSettled: !transition || getComputedStyle(transition).display === 'none',
            })
          super.src = value
        }
        override get src() {
          return super.src
        }
      }
    }, saveData)
    await page.goto('/preload-prefetch')
    await page.waitForLoadState('networkidle')
    expect(requests).toEqual([])
    await page.locator('.np-album__item').nth(2).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('[data-np-transition-frame]')).toBeHidden({ timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    const proof = await page.evaluate(() => window.__prefetchProof)
    if (saveData) {
      expect(proof).toEqual([])
      expect(requests).toHaveLength(1)
      expect(requests[0]).toContain('normal-02.jpg')
    } else {
      expect(proof).toHaveLength(2)
      expect(
        proof.every(
          (image) =>
            image.priority === 'low' &&
            image.decoding === 'async' &&
            image.activeLoaded &&
            image.openingSettled,
        ),
      ).toBe(true)
      expect(requests).toHaveLength(3)
      expect(requests.some((url) => url.includes('normal-01.jpg'))).toBe(true)
      expect(requests.some((url) => url.includes('normal-03.jpg'))).toBe(true)
      const neighbours = await page
        .locator('[data-np-slide]:not([data-np-active]) img')
        .evaluateAll((images) =>
          images.map((image) => ({
            srcset: image.getAttribute('srcset'),
            sizes: image.getAttribute('sizes'),
            currentSrc: (image as HTMLImageElement).currentSrc,
          })),
        )
      for (const image of neighbours) {
        expect(proof).toContainEqual(
          expect.objectContaining({ srcset: image.srcset, sizes: image.sizes }),
        )
        expect(requests).toContain(image.currentSrc)
      }
      const prefetchedNext = requests.find((url) => url.includes('normal-03.jpg'))!
      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.locator('[data-np-active] img')).toHaveAttribute('alt', 'Prefetch photo 3')
      await page.waitForLoadState('networkidle')
      expect(
        await page
          .locator('[data-np-active] img')
          .evaluate((image) => (image as HTMLImageElement).currentSrc),
      ).toBe(prefetchedNext)
      expect(requests.filter((url) => url === prefetchedNext)).toHaveLength(1)
      await page.getByRole('button', { name: 'Previous', exact: true }).click()
      await expect(page.locator('[data-np-active] img')).toHaveAttribute('alt', 'Prefetch photo 2')
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => window.__prefetchProof.length)).toBe(3)
    }
    await writeFile(
      testInfo.outputPath('network.json'),
      JSON.stringify({ saveData, proof, requests }, null, 2),
    )
    await testInfo.attach('prefetch-network', {
      body: JSON.stringify({ saveData, proof, requests }, null, 2),
      contentType: 'application/json',
    })
    await page.screenshot({ path: testInfo.outputPath(`prefetch-${saveData}.png`) })
  })
}
