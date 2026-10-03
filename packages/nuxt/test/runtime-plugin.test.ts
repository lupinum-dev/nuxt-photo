import { describe, expect, it, vi } from 'vite-plus/test'
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
  it.each([
    ['thumb', [256, 640, 1280]],
    ['slide', [256, 640, 1280]],
    ['thumb', [1280, 640, 256, 640, 1280, 256]],
  ] as const)('caps %s candidates and honors quality and sizes', (context, widths) => {
    const adapter = createNuxtImageAdapter(image, {
      thumb: { widths: [...widths], quality: 72, sizes: '400px' },
      slide: { widths: [...widths], maxWidth: 800, quality: 72, sizes: '90vw' },
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
  })

  it.each(['thumb', 'slide'] as const)('drops repeated provider URLs for %s', (context) => {
    const rounded: NuxtImageFunction = (src, modifiers) =>
      image(src, { ...modifiers, width: modifiers.width <= 640 ? 640 : 960 })
    const adapter = createNuxtImageAdapter(rounded, {
      thumb: { widths: [256, 384, 640, 828, 1280] },
      slide: { widths: [256, 384, 640, 828, 1280] },
    })
    expect(adapter({ ...photo, thumbSrc: undefined }, context).srcset).toBe(
      context === 'thumb'
        ? '/full.jpg?w=640&q=80 640w, /full.jpg?w=960&q=80 960w'
        : '/full.jpg?w=640&q=85 640w, /full.jpg?w=960&q=85 960w',
    )
  })

  it.each([
    ['ipx', undefined, '/full.jpg?w=300&q=80&f=webp', '/full.jpg?w=24&q=30&f=webp'],
    ['ipxStatic', 'avif', '/full.jpg?w=300&q=80&f=avif', '/full.jpg?w=24&q=30&f=avif'],
    ['ipx', 'auto', '/full.jpg?w=300&q=80', '/full.jpg?w=24&q=30'],
    ['vercel', 'webp', '/full.jpg?w=300&q=80', undefined],
    ['netlify', 'avif', '/full.jpg?w=300&q=80', undefined],
    ['cloudinary', 'webp', '/full.jpg?w=300&q=80', undefined],
    [
      'ipx',
      'webp',
      '/vector%20art.SVG?version=1#preview.gif',
      undefined,
      '/vector%20art.SVG?version=1#preview.gif',
    ],
    [
      'ipx',
      'avif',
      '/animated.GIF?version=1#preview.jpg?w=300&q=80',
      '/animated.GIF?version=1#preview.jpg?w=24&q=30',
      '/animated.GIF?version=1#preview.jpg',
    ],
    [
      'ipx',
      'webp',
      '/still.JPG?version=1#preview.svg?w=300&q=80&f=webp',
      '/still.JPG?version=1#preview.svg?w=24&q=30&f=webp',
      '/still.JPG?version=1#preview.svg',
    ],
  ] as const)(
    'uses provider defaults for %s / %s',
    (provider, format, src, placeholderSrc, source?: string) => {
      const originalSrc = source ?? '/full.jpg'
      const imageMock = vi.fn(image)
      const adapter = createNuxtImageAdapter(
        imageMock,
        { format, thumb: { widths: [300] } },
        provider,
      )
      const tiny = { ...photo, src: originalSrc, thumbSrc: undefined, width: 300 }
      const thumb = adapter(tiny, 'thumb')
      const slide = adapter(tiny, 'slide')
      expect(thumb.src).toBe(src)
      expect(thumb.placeholderSrc).toBe(placeholderSrc)
      expect(slide.placeholderSrc).toBe(placeholderSrc)
      if (originalSrc === '/vector%20art.SVG?version=1#preview.gif') {
        for (const context of ['thumb', 'slide'] as const) {
          expect(
            adapter({ ...tiny, placeholderSrc: '/explicit.jpg' }, context).placeholderSrc,
          ).toBe('/explicit.jpg')
        }
        expect(thumb).toEqual({
          src: '/vector%20art.SVG?version=1#preview.gif',
          sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px',
          width: 300,
          height: 600,
        })
        expect(slide).toEqual({
          src: '/vector%20art.SVG?version=1#preview.gif',
          sizes: 'min(1240px, calc(100vw - 72px))',
          width: 300,
          height: 600,
        })
        expect(imageMock).not.toHaveBeenCalled()
      } else {
        expect(thumb.srcset).toBe(`${src} 300w`)
        if (originalSrc === '/animated.GIF?version=1#preview.jpg') {
          expect(slide.src).toBe('/animated.GIF?version=1#preview.jpg?w=300&q=85')
          expect(slide.srcset).toBe('/animated.GIF?version=1#preview.jpg?w=300&q=85 300w')
        }
      }
    },
  )

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
