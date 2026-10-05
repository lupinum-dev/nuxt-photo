import { expect, test } from '@playwright/test'

for (const [priority, count] of [
  [0, 0],
  [3, 3],
  [10, 6],
]) {
  test(`nuxt image priority ${priority} emits ${count} matching SSR preloads`, async ({
    request,
    page,
  }) => {
    const response = await request.get(`/lab/album?priority=${priority}`)
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
