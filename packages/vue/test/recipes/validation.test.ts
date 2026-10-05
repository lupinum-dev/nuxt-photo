// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, createSSRApp, h, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { makePhoto } from '@test-fixtures/photos'
import { createPhoto } from '../../src'
import { provideLightbox } from '../../src/composables/provideLightbox'
import Photo from '../../src/components/Photo.vue'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'
import PhotoCarousel from '../../src/components/PhotoCarousel.vue'
import type { PhotoItem } from '../../src/core/index'
import { PhotoValidationError } from '../../src/core/photo/normalize'
import { flushUi, installBrowserStubs, mountComponent } from '../support/runtime'

describe('recipe validation', () => {
  // Catch fills that mask bad data, mutate app data, or happen after validation.
  it.each([
    ['missing', {}, true, true],
    ['null', { width: null, height: null }, true, true],
    ['mixed missing', { width: null }, true, true],
    ['width only', { width: 640 }, true, false],
    ['height only', { height: 480 }, true, false],
    ['zero', { width: 0, height: 0 }, true, false],
    ['unknown source', { src: '/unknown.jpg' }, true, false],
    ['no key', {}, false, false],
    ['provided dimensions', { width: 20, height: 10 }, true, true],
  ])('resolves dimensions for %s before validation', async (_name, fields, withKey, valid) => {
    const raw = Object.freeze({ id: 'local', src: '/known.jpg', ...fields })
    const app = createSSRApp({
      render: () => h(PhotoAlbum, { photos: [raw] as unknown as PhotoItem[], lightbox: false }),
    })
    if (withKey)
      app.use(
        createPhoto({
          dimensions: (src) => (src === '/known.jpg' ? { width: 640, height: 480 } : undefined),
        }),
      )
    if (valid) {
      const html = await renderToString(app)
      expect(html).toContain(`width="${'width' in fields ? (fields.width ?? 640) : 640}"`)
      expect(html).toContain(`height="${'height' in fields ? (fields.height ?? 480) : 480}"`)
    } else {
      await expect(renderToString(app)).rejects.toBeInstanceOf(PhotoValidationError)
    }
    expect(raw).toEqual({ id: 'local', src: '/known.jpg', ...fields })
  })

  it.each([Photo, PhotoCarousel, PhotoGroup])(
    'uses the injected resolver in every recipe',
    async (component) => {
      const photo = { id: 'local', src: '/known.jpg' } as PhotoItem
      const app = createSSRApp({
        render: () =>
          component === Photo
            ? h(Photo, { photo, lightbox: false })
            : component === PhotoGroup
              ? h(
                  PhotoGroup,
                  { photos: [photo], lightbox: false },
                  { default: () => h(Photo, { photo }) },
                )
              : h(PhotoCarousel, { photos: [photo], lightbox: false }),
      })
      app.use(createPhoto({ dimensions: () => ({ width: 640, height: 480 }) }))
      const html = await renderToString(app)
      expect(html).toContain('width="640"')
      expect(html).toContain('height="480"')
    },
  )

  it('resolves dimensions for provideLightbox before validation', async () => {
    const app = createSSRApp({
      setup() {
        const controller = provideLightbox([{ id: 'local', src: '/known.jpg' }] as PhotoItem[])
        return () =>
          h('p', `${controller.photos.value[0]?.width}x${controller.photos.value[0]?.height}`)
      },
    })
    app.use(createPhoto({ dimensions: () => ({ width: 640, height: 480 }) }))
    expect(await renderToString(app)).toContain('640x480')
  })

  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  // Catch rendering invalid input, missing reports, or a stale empty render after replacement.
  it('drops an invalid Photo and emits one report, then renders a valid replacement', async () => {
    const onInvalidPhotos = vi.fn()
    const photo = ref<PhotoItem | null>(null)
    const mounted = await mountComponent({
      render: () =>
        h(Photo, { photo: photo.value as PhotoItem, validation: 'drop', onInvalidPhotos }),
    })
    expect(mounted.container.querySelector('figure')).toBeNull()
    expect(mounted.container.querySelector('img')).toBeNull()
    expect(onInvalidPhotos).toHaveBeenCalledOnce()
    expect(onInvalidPhotos.mock.calls[0]?.[0]).toMatchObject({ owner: 'Photo' })
    photo.value = makePhoto({ id: 'replacement' })
    await flushUi()
    expect(mounted.container.querySelector('img')?.getAttribute('src')).toBe(
      '/photos/replacement.jpg',
    )
    expect(onInvalidPhotos).toHaveBeenCalledOnce()
    mounted.unmount()
  })

  it.each([
    ['PhotoAlbum', PhotoAlbum],
    ['PhotoGroup', PhotoGroup],
    ['PhotoCarousel', PhotoCarousel],
  ])('preserves the original validation error from %s', async (owner, component) => {
    const errors: unknown[] = []
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp({
      render: () =>
        h(component, {
          photos: [{ id: 'one', src: '/x.jpg', width: 0, height: 800 }],
          lightbox: false,
        }),
    })
    app.config.errorHandler = (error) => errors.push(error)
    try {
      app.mount(container)
      await flushUi()
      expect(errors).toHaveLength(1)
      for (const error of errors) {
        expect(error).toBeInstanceOf(PhotoValidationError)
        expect((error as Error).message).toContain(owner + ': photo "one" has invalid width 0')
        expect((error as Error).message).toContain(
          'https://nuxt-photo.lupinum.com/docs/help/troubleshooting',
        )
      }
      expect(errors.some((error) => error instanceof TypeError)).toBe(false)
    } finally {
      app.unmount()
      container.remove()
    }
  })

  it.each([
    ['PhotoAlbum', PhotoAlbum],
    ['PhotoCarousel', PhotoCarousel],
  ])(
    'drops invalid entries and emits one structured report from %s after mount',
    async (owner, component) => {
      const onInvalidPhotos = vi.fn()
      const mounted = await mountComponent(component, {
        props: {
          photos: [makePhoto({ id: 'valid' }), null, { id: 'bad', src: '', width: 10, height: 10 }],
          validation: 'drop',
          onInvalidPhotos,
          lightbox: false,
        },
      })
      expect(mounted.container.querySelectorAll('img')).toHaveLength(1)
      expect(onInvalidPhotos).toHaveBeenCalledOnce()
      expect(onInvalidPhotos).toHaveBeenCalledWith(
        expect.objectContaining({
          owner,
          issues: expect.arrayContaining([
            expect.objectContaining({ code: 'invalid-item' }),
            expect.objectContaining({ code: 'missing-src' }),
          ]),
        }),
      )
      await flushUi()
      expect(onInvalidPhotos).toHaveBeenCalledOnce()
      mounted.unmount()
    },
  )

  it.each([
    ['PhotoAlbum', PhotoAlbum],
    ['PhotoCarousel', PhotoCarousel],
  ])('does not emit invalid-photo reports while %s renders on the server', async (_, component) => {
    const onInvalidPhotos = vi.fn()
    const app = createSSRApp({
      render: () =>
        h(component, {
          photos: [null] as unknown as PhotoItem<object>[],
          validation: 'drop',
          onInvalidPhotos,
          lightbox: false,
        }),
    })

    await renderToString(app)
    expect(onInvalidPhotos).not.toHaveBeenCalled()
  })

  it('batches reactive invalid-photo reports after rendering', async () => {
    const photos = ref<readonly unknown[]>([makePhoto({ id: 'valid' })])
    const onInvalidPhotos = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp({
      render: () =>
        h(PhotoAlbum, {
          photos: photos.value as unknown as PhotoItem<object>[],
          validation: 'drop',
          onInvalidPhotos,
          lightbox: false,
        }),
    })

    app.mount(container)
    await flushUi()
    expect(onInvalidPhotos).not.toHaveBeenCalled()

    photos.value = [null]
    photos.value = [null, { id: 'bad', src: '', width: 10, height: 10 }]
    await flushUi()

    expect(onInvalidPhotos).toHaveBeenCalledOnce()
    expect(onInvalidPhotos).toHaveBeenCalledWith(
      expect.objectContaining({
        rawPhotos: photos.value,
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'invalid-item' }),
          expect.objectContaining({ code: 'missing-src' }),
        ]),
      }),
    )

    app.unmount()
    container.remove()
  })
})
