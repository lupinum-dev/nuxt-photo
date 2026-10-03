import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { findFixturePort } from './fixture-port'

describe('local public image dimensions', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/local-images', import.meta.url)),
    port: await findFixturePort(47050),
  })

  it('SSR renders real dimensions without width or height in app data', async () => {
    const html = await $fetch<string>('/gallery/')
    const images = html.match(/<img\b[^>]*>/g) ?? []
    for (const [src, width, height] of [
      ['/gallery/photo.jpg?cache=1#photo', 32, 24],
      ['/nested/photo.png', 18, 12],
      ['/photo.svg', 26, 16],
      ['/gallery/with%20space.png', 14, 10],
      ['/oriented.jpg', 20, 40],
    ] as const) {
      const image = images.find((tag) => tag.includes(`src="${src}"`))
      expect(image).toBeDefined()
      expect(image).toContain(`width="${width}"`)
      expect(image).toContain(`height="${height}"`)
    }
  })
})
