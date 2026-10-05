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
  it('transfers only the requested folder with stable ids, descending names and overrides', async () => {
    const html = await $fetch<string>('/gallery/folder')
    const rawPayload = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1]
    expect(rawPayload).toBeDefined()
    const payload = JSON.stringify(JSON.parse(rawPayload!))
    expect(payload).toContain('nested/constructor')
    expect(payload).toContain('nested/photo')
    expect(payload).not.toContain('oriented.jpg')
    expect(payload).not.toContain('with space.png')
    expect(payload).toContain('data:image/webp;base64,')
    const pre = html.match(/<pre id="folder-data">([\s\S]*?)<\/pre>/)![1]!.replaceAll('&quot;', '"')
    const photos = JSON.parse(pre)
    expect(photos.map((photo: { id: string }) => photo.id)).toEqual([
      'nested/photo',
      'nested/constructor',
    ])
    expect(photos[0]).toMatchObject({
      src: '/gallery/nested/photo.png',
      width: 18,
      height: 12,
      alt: 'Nested image',
      caption: 'Caption',
    })
    expect(photos[1]).not.toHaveProperty('alt')
    expect(photos[1]).not.toHaveProperty('caption')
    expect(await $fetch('/gallery/__nuxt_photo/folder?folder=missing')).toEqual([])
    expect(await $fetch('/gallery/__nuxt_photo/folder?folder=../')).toEqual([])
  })
  it('exposes exactly the Nuxt app API under the real Nuxt runtime', async () => {
    const html = await $fetch<string>('/gallery/exports')
    const contract = JSON.parse(
      html.match(/<pre id="exports">([\s\S]*?)<\/pre>/)![1]!.replaceAll('&quot;', '"'),
    )
    expect(contract.responsive).toBe(1)
    expect(contract.exports).toEqual({
      Lightbox: 'object',
      LightboxAmbient: 'object',
      LightboxCaption: 'object',
      LightboxControls: 'object',
      LightboxOverlay: 'object',
      LightboxProvider: 'object',
      LightboxRoot: 'object',
      LightboxSlide: 'object',
      LightboxViewport: 'object',
      Photo: 'object',
      PhotoAlbum: 'object',
      PhotoCarousel: 'object',
      PhotoGroup: 'object',
      PhotoImage: 'object',
      PhotoTrigger: 'object',
      PhotoValidationError: 'function',
      createPhoto: 'function',
      definePhotoProvider: 'function',
      validatePhotos: 'function',
      responsive: 'function',
      useLightbox: 'function',
      usePhotoLabels: 'function',
      usePhotoFolder: 'function',
    })
  })
})
