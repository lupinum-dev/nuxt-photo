// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { computed, createApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { makePhoto } from '@test-fixtures/photos'
import { computeFrameLayout } from '../src/core/index'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoGroup from '../src/components/PhotoGroup.vue'
import type { GalleryHandle } from '../src/gallery/runtime'
import { PhotoGroupContextKey, type PhotoGroupContext } from '../src/components/photo-group/context'
import { flushUi, installBrowserStubs } from './support/runtime'

describe('collection lightbox handles', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('keeps mosaic reading order and hidden-photo handles aligned', async () => {
    const photos = Array.from({ length: 8 }, (_, index) =>
      makePhoto({
        id: `mosaic-${index}`,
        alt: `Photo ${index}`,
        width: 900 + index * 200,
        height: 1000,
      }),
    )
    const frame = computeFrameLayout({ type: 'mosaic', photos, max: 5, containerName: 'test' })
    const album = ref<GalleryHandle | null>(null)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () =>
        h(
          PhotoAlbum,
          {
            ref: album,
            photos,
            layout: { type: 'mosaic', max: 5 },
            lightbox: { transition: 'none' },
          },
          {
            thumbnail: ({ photo }: { photo: { id: string } }) =>
              h('span', { 'data-photo': photo.id }),
          },
        ),
    })
    app.mount(host)
    await flushUi()
    const items = Array.from(host.querySelectorAll('.np-album__item'))
    expect(
      items.map((item) => item.querySelector('[data-photo]')?.getAttribute('data-photo')),
    ).toEqual(frame.order.slice(0, 5).map((index) => photos[index]!.id))
    expect(items.at(-1)?.getAttribute('aria-label')).toBe(`Photo ${frame.order[4]}`)
    const opening = album.value!.open(6)
    await flushUi()
    expect(document.body.querySelector('.np-lightbox__counter')?.textContent).toContain('7 / 8')
    expect(document.body.querySelector('[data-np-active] img')?.getAttribute('alt')).toBe('Photo 6')
    document.body
      .querySelectorAll('.np-lightbox img')
      .forEach((image) => image.dispatchEvent(new Event('load')))
    await opening
    await expect(album.value!.open(99)).rejects.toThrow('[nuxt-photo] No photo found at index 99')
    app.unmount()
    host.remove()
  })

  it('maps nested album-local indexes through stable photo ids', async () => {
    const canonical = [
      makePhoto({ id: 'before' }),
      makePhoto({ id: 'album-a' }),
      makePhoto({ id: 'album-b' }),
      makePhoto({ id: 'after' }),
    ]
    const albumPhotos = canonical.slice(1, 3)
    const album = ref<GalleryHandle | null>(null)
    const activateById = vi.fn(async () => {})
    const close = vi.fn(async () => {})
    const context: PhotoGroupContext = {
      enabled: true,
      hasPhoto: (id) => canonical.some((photo) => photo.id === id),
      replaceCapabilities: vi.fn(),
      removeCapabilities: vi.fn(),
      open: vi.fn(async () => {}),
      close,
      activateById,
      photos: computed(() => canonical),
      hiddenPhoto: computed(() => null),
      isOpen: computed(() => true),
      activeId: computed(() => canonical[0]?.id ?? null),
      activePhoto: computed(() => canonical[0] ?? null),
    }

    const App = defineComponent({
      setup() {
        provide(PhotoGroupContextKey, context)
        return () => h(PhotoAlbum, { ref: album, photos: albumPhotos })
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await nextTick()

    await album.value!.open(1)
    expect(activateById).toHaveBeenLastCalledWith('album-b', expect.anything())
    expect(album.value!.isOpen).toBe(true)

    await album.value!.close()
    await album.value!.openById('album-a')
    expect(close).toHaveBeenCalledOnce()
    expect(activateById).toHaveBeenLastCalledWith('album-a', expect.anything())

    app.unmount()
    host.remove()
  })

  it('rejects ids outside an album even when its parent group contains them', async () => {
    const canonical = [makePhoto({ id: 'inside' }), makePhoto({ id: 'outside' })]
    const album = ref<GalleryHandle | null>(null)
    const App = defineComponent({
      setup: () => () =>
        h(PhotoGroup, { photos: canonical, lightbox: { transition: 'none' } }, () =>
          h(PhotoAlbum, { ref: album, photos: [canonical[0]!] }),
        ),
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await nextTick()

    await expect(album.value!.openById('outside')).rejects.toThrow(/No photo found/)
    app.unmount()
    host.remove()
  })

  it('exposes the collection handle from PhotoGroup', async () => {
    const group = ref<GalleryHandle | null>(null)
    const photos = [makePhoto({ id: 'group-photo' })]
    const App = defineComponent({
      setup: () => () => h(PhotoGroup, { ref: group, photos, lightbox: false }),
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await nextTick()

    expect(group.value?.isOpen).toBe(false)
    await expect(group.value?.openById('missing')).rejects.toThrow(/No photo found/)
    app.unmount()
    host.remove()
  })

  it('keeps Embla navigation aligned after opening a nested album photo by id', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(600)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.classList.contains('np-lightbox__slide')
          ? Array.from(this.parentElement?.children ?? []).indexOf(this) * 600
          : 0
      },
    )
    const photos = Array.from({ length: 8 }, (_, index) => makePhoto({ id: `group-${index + 1}` }))
    const group = ref<GalleryHandle | null>(null)
    const App = defineComponent({
      setup: () => () =>
        h(PhotoGroup, { ref: group, photos, lightbox: { transition: 'none' } }, () => [
          h(PhotoAlbum, { photos: photos.slice(0, 3) }),
          h(PhotoAlbum, { photos: photos.slice(3) }),
        ]),
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await flushUi()

    const opening = group.value!.openById('group-4')
    await flushUi()
    expect(document.body.querySelector('.np-lightbox__counter')?.textContent).toContain('4 / 8')
    document.body
      .querySelectorAll('.np-lightbox img')
      .forEach((image) => image.dispatchEvent(new Event('load')))
    await opening

    ;(document.body.querySelector('.np-lightbox__btn--next') as HTMLButtonElement).click()
    await flushUi()
    expect(document.body.querySelector('.np-lightbox__counter')?.textContent).toContain('5 / 8')

    app.unmount()
    host.remove()
  })

  it('keeps valid group photos and reports dropped entries', async () => {
    const invalidPhotos = vi.fn()
    const photos = [makePhoto({ id: 'valid' }), { id: 'invalid', src: '', width: 1, height: 1 }]
    const App = defineComponent({
      setup: () => () =>
        h(
          PhotoGroup,
          {
            photos,
            validation: 'drop',
            lightbox: false,
            onInvalidPhotos: invalidPhotos,
          },
          {
            default: ({ photos: validPhotos }: { photos: readonly unknown[] }) =>
              h('span', { 'data-count': validPhotos.length }),
          },
        ),
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await flushUi()

    expect(host.querySelector('[data-count]')?.getAttribute('data-count')).toBe('1')
    expect(invalidPhotos).toHaveBeenCalledOnce()
    app.unmount()
    host.remove()
  })
})
