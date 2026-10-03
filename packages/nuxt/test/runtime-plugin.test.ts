import { describe, expect, it } from 'vite-plus/test'
import type { PhotoItem } from '@lupinum/vue-photo'
import { createNuxtImageAdapter, type NuxtImageFunction } from '../src/runtime/image-adapter'

const image: NuxtImageFunction = (src, { width, quality, format }) =>
  `${src}?w=${width}&q=${quality}${format ? `&f=${format}` : ''}`
const photo: PhotoItem = {
  id: 'nuxt-image',
  src: '/full.jpg',
  thumbSrc: '/thumb.jpg',
  width: 960,
  height: 600,
}

describe('nuxt image adapter', () => {
  it.each(['thumb', 'slide'] as const)(
    'caps %s candidates and honors quality and sizes',
    (context) => {
      const adapter = createNuxtImageAdapter(image, {
        thumb: { widths: [256, 640, 1280], quality: 72, sizes: '400px' },
        slide: { widths: [256, 640, 1280], maxWidth: 800, quality: 72, sizes: '90vw' },
      })
      const result = adapter(photo, context)
      expect(result).toEqual({
        src: context === 'thumb' ? '/thumb.jpg?w=960&q=72' : '/full.jpg?w=800&q=72',
        srcset:
          context === 'thumb'
            ? '/thumb.jpg?w=256&q=72 256w, /thumb.jpg?w=640&q=72 640w, /thumb.jpg?w=960&q=72 960w'
            : '/full.jpg?w=256&q=72 256w, /full.jpg?w=640&q=72 640w, /full.jpg?w=960&q=72 960w',
        sizes: context === 'thumb' ? '400px' : '90vw',
        placeholderSrc: undefined,
        width: 960,
        height: 600,
      })
    },
  )

  it.each(['thumb', 'slide'] as const)('drops repeated provider URLs for %s', (context) => {
    const rounded: NuxtImageFunction = (src, modifiers) =>
      image(src, { ...modifiers, width: modifiers.width <= 640 ? 640 : 960 })
    const adapter = createNuxtImageAdapter(rounded, {
      thumb: { widths: [256, 384, 640, 828, 1280] },
      slide: { widths: [256, 384, 640, 828, 1280] },
    })
    expect(adapter({ ...photo, thumbSrc: undefined }, context).srcset).toBe(
      context === 'thumb'
        ? '/full.jpg?w=640&q=80 256w, /full.jpg?w=960&q=80 828w'
        : '/full.jpg?w=640&q=85 256w, /full.jpg?w=960&q=85 828w',
    )
  })

  it.each([
    ['ipx', undefined, '/full.jpg?w=300&q=80&f=webp', '/full.jpg?w=24&q=30&f=webp'],
    ['ipxStatic', 'avif', '/full.jpg?w=300&q=80&f=avif', '/full.jpg?w=24&q=30&f=avif'],
    ['ipx', 'auto', '/full.jpg?w=300&q=80', '/full.jpg?w=24&q=30'],
    ['vercel', 'webp', '/full.jpg?w=300&q=80', undefined],
    ['netlify', 'avif', '/full.jpg?w=300&q=80', undefined],
    ['cloudinary', 'webp', '/full.jpg?w=300&q=80', undefined],
  ] as const)('uses provider defaults for %s / %s', (provider, format, src, placeholderSrc) => {
    const adapter = createNuxtImageAdapter(image, { format }, provider)
    const tiny = { ...photo, thumbSrc: undefined, width: 300 }
    expect(adapter(tiny, 'thumb')).toMatchObject({ src, placeholderSrc })
    expect(adapter(tiny, 'slide').placeholderSrc).toBe(placeholderSrc)
  })

  it.each(['thumb', 'slide'] as const)('respects placeholder overrides for %s', (context) => {
    expect(
      createNuxtImageAdapter(image, { placeholder: false }, 'ipx')(photo, context).placeholderSrc,
    ).toBeUndefined()
    expect(
      createNuxtImageAdapter(image, { placeholder: true }, 'vercel')(photo, context).placeholderSrc,
    ).toBe(context === 'thumb' ? '/thumb.jpg?w=24&q=30' : '/full.jpg?w=24&q=30')
    expect(
      createNuxtImageAdapter(
        image,
        { placeholder: false },
        'ipx',
      )({ ...photo, placeholderSrc: '/explicit.jpg' }, context).placeholderSrc,
    ).toBe('/explicit.jpg')
    expect(
      createNuxtImageAdapter(
        image,
        undefined,
        'ipx',
      )({ ...photo, placeholderSrc: '/explicit.jpg' }, context).placeholderSrc,
    ).toBe('/explicit.jpg')
  })

  it.each([
    ['/photos/with%20space.jpg', '/photos/with space.jpg?w=300&q=80'],
    ['/photos/with%2520space.jpg', '/photos/with%20space.jpg?w=300&q=80'],
    ['/photos/bad%escape.jpg', '/photos/bad%escape.jpg?w=300&q=80'],
    ['https://example.com/with%20space.jpg', 'https://example.com/with%20space.jpg?w=300&q=80'],
    ['//example.com/with%20space.jpg', '//example.com/with%20space.jpg?w=300&q=80'],
  ])('decodes only local paths once: %s', (src, expected) => {
    expect(
      createNuxtImageAdapter(image)({ ...photo, src, thumbSrc: undefined, width: 300 }, 'thumb')
        .src,
    ).toBe(expected)
  })

  it.each([
    [300, undefined, '/thumb.jpg?w=300&q=80'],
    [1600, undefined, '/thumb.jpg?w=1080&q=80'],
    [3000, [1200, 2000], '/thumb.jpg?w=1200&q=80'],
    [3000, [256, 640], '/thumb.jpg?w=640&q=80'],
    [3000, [828, 256], '/thumb.jpg?w=828&q=80'],
    [3000, [2000, 1200], '/thumb.jpg?w=1200&q=80'],
  ])('chooses the thumb fallback for source width %s', (width, widths, expected) => {
    expect(
      createNuxtImageAdapter(image, { thumb: { widths } })({ ...photo, width }, 'thumb').src,
    ).toBe(expected)
  })
})
