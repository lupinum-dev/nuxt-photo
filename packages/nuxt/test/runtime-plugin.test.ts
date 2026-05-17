import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageAdapterKey } from '@nuxt-photo/vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'

const mocks = vi.hoisted(() => {
  const image = vi.fn((src: string, options: { width: number; quality: number }) => {
    return `/_ipx/w_${options.width},q_${options.quality}${src}`
  }) as any

  image.getSizes = vi.fn(
    (src: string, options: { sizes: string; quality: number }) => ({
      src: `/_ipx/thumb,q_${options.quality}${src}`,
      srcset: `/_ipx/thumb-400,q_${options.quality}${src} 400w, /_ipx/thumb-800,q_${options.quality}${src} 800w`,
      sizes: options.sizes,
    }),
  )

  return {
    image,
    provide: vi.fn(),
  }
})

vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: unknown) => plugin,
}))

vi.mock('#imports', () => ({
  useImage: () => mocks.image,
}))

const photo: PhotoItem = {
  id: 'nuxt-image',
  src: '/photos/full.jpg',
  thumbSrc: '/photos/thumb.jpg',
  width: 1600,
  height: 1000,
}

describe('nuxt image runtime plugin', () => {
  beforeEach(() => {
    mocks.image.mockClear()
    mocks.image.getSizes.mockClear()
    mocks.provide.mockClear()
  })

  it('provides an adapter that generates separate thumbnail and slide sources', async () => {
    const plugin = (await import('../src/runtime/plugin')).default

    plugin.setup({
      vueApp: {
        provide: mocks.provide,
      },
    } as any)

    expect(mocks.provide).toHaveBeenCalledWith(
      ImageAdapterKey,
      expect.any(Function),
    )

    const adapter = mocks.provide.mock.calls[0]![1] as ImageAdapter
    const thumb = adapter(photo, 'thumb')
    const slide = adapter(photo, 'slide')

    expect(mocks.image.getSizes).toHaveBeenCalledWith('/photos/thumb.jpg', {
      sizes: 'sm:100vw md:50vw lg:400px',
      quality: 80,
    })
    expect(thumb).toEqual({
      src: '/_ipx/thumb,q_80/photos/thumb.jpg',
      srcset:
        '/_ipx/thumb-400,q_80/photos/thumb.jpg 400w, /_ipx/thumb-800,q_80/photos/thumb.jpg 800w',
      sizes: 'sm:100vw md:50vw lg:400px',
      width: 1600,
      height: 1000,
    })

    expect(slide).toEqual({
      src: '/_ipx/w_1240,q_85/photos/full.jpg',
      srcset:
        '/_ipx/w_640,q_85/photos/full.jpg 640w, /_ipx/w_960,q_85/photos/full.jpg 960w, /_ipx/w_1240,q_85/photos/full.jpg 1240w, /_ipx/w_1600,q_85/photos/full.jpg 1600w, /_ipx/w_2000,q_85/photos/full.jpg 2000w',
      sizes: 'min(1240px, calc(100vw - 72px))',
      width: 1600,
      height: 1000,
    })
  })
})
