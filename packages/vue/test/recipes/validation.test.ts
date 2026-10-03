// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, createSSRApp, h, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'
import PhotoCarousel from '../../src/components/PhotoCarousel.vue'
import type { PhotoItem } from '../../src/core/index'
import { PhotoValidationError } from '../../src/core/photo/normalize'
import { flushUi, installBrowserStubs, mountComponent } from '../support/runtime'

describe('recipe validation', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
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
      expect(errors.length).toBeGreaterThan(0)
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
