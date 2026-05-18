// @vitest-environment jsdom

import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PhotoItem } from '@nuxt-photo/core'
import { makePhoto } from '@test-fixtures/photos'
import { useLightbox, useLightboxProvider } from '../src/composables'
import {
  useLightboxWindowLifecycle,
  watchPhotoCollection,
} from '../src/composables/lightboxWatchers'

async function flushWatchers() {
  await nextTick()
  await Promise.resolve()
}

describe('lightbox controller surface', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('returns the same controller behavior from provider and injected consumer', async () => {
    const photos = [makePhoto({ id: 'controller-a' })]
    let providerApi: ReturnType<typeof useLightboxProvider> | null = null
    let consumerApi: ReturnType<typeof useLightbox> | null = null

    const Consumer = defineComponent({
      setup() {
        consumerApi = useLightbox()
        return () => null
      },
    })

    const App = defineComponent({
      setup() {
        providerApi = useLightboxProvider(photos, { transition: 'none' })
        return () => h(Consumer)
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await flushWatchers()

    expect(Object.keys(consumerApi!).sort()).toEqual(
      [
        'activeIndex',
        'activePhoto',
        'close',
        'count',
        'isOpen',
        'next',
        'open',
        'openById',
        'openPhoto',
        'photos',
        'prev',
        'toggleZoom',
      ].sort(),
    )
    expect(consumerApi!.photos).toBe(providerApi!.photos)
    expect(consumerApi!.activeIndex).toBe(providerApi!.activeIndex)
    expect(consumerApi!.open).toBe(providerApi!.open)

    app.unmount()
    host.remove()
  })

  it('does not open the first photo for missing controller targets', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const photos = [makePhoto({ id: 'controller-a' })]
    let providerApi: ReturnType<typeof useLightboxProvider> | null = null

    const App = defineComponent({
      setup() {
        providerApi = useLightboxProvider(photos, { transition: 'none' })
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await flushWatchers()

    await providerApi!.openPhoto(makePhoto({ id: 'missing-controller' }))
    await providerApi!.open(-1)
    await flushWatchers()

    expect(providerApi!.isOpen.value).toBe(false)
    expect(providerApi!.activeIndex.value).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No photo found'))

    warn.mockRestore()
    app.unmount()
    host.remove()
  })
})

describe('lightbox state collection handling', () => {
  it('keeps the same active photo selected across reorder, insert, and remove-before-active changes', async () => {
    const a = makePhoto({ id: 'a' })
    const b = makePhoto({ id: 'b' })
    const c = makePhoto({ id: 'c' })
    const photos = ref<PhotoItem[]>([a, b, c])
    const activeIndex = ref(1)
    const goTo = vi.fn((index: number) => {
      activeIndex.value = index
    })
    const close = vi.fn(async () => {})

    watchPhotoCollection(
      computed(() => photos.value),
      {
        activeIndex,
        lightboxMounted: ref(true),
        goTo,
        close,
      },
    )

    photos.value = [c, a, b]
    await flushWatchers()
    expect(goTo).toHaveBeenLastCalledWith(2, true)
    expect(close).not.toHaveBeenCalled()

    goTo.mockClear()
    photos.value = [a, b]
    await flushWatchers()
    expect(goTo).toHaveBeenLastCalledWith(1, true)
    expect(close).not.toHaveBeenCalled()
  })

  it('closes when the active photo disappears from an open lightbox', async () => {
    const a = makePhoto({ id: 'a' })
    const b = makePhoto({ id: 'b' })
    const photos = ref<PhotoItem[]>([a, b])
    const goTo = vi.fn()
    const close = vi.fn(async () => {})

    watchPhotoCollection(
      computed(() => photos.value),
      {
        activeIndex: ref(1),
        lightboxMounted: ref(true),
        goTo,
        close,
      },
    )

    photos.value = [a]
    await flushWatchers()

    expect(close).toHaveBeenCalledTimes(1)
    expect(goTo).toHaveBeenCalledWith(0, true)
  })
})

describe('lightbox state scroll lock ownership', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  it('does not release body scroll when an inactive provider unmounts', async () => {
    const mountedA = ref(false)
    const mountedB = ref(false)

    function mountOwner(lightboxMounted: typeof mountedA) {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp(
        defineComponent({
          setup() {
            useLightboxWindowLifecycle({
              lightboxMounted,
              cancelTapTimer: vi.fn(),
              detachKeydown: vi.fn(),
              syncGeometry: vi.fn(() => null),
              refreshZoomState: vi.fn(),
            })
            return () => null
          },
        }),
      )
      app.mount(host)
      return {
        unmount() {
          app.unmount()
          host.remove()
        },
      }
    }

    const ownerA = mountOwner(mountedA)
    const ownerB = mountOwner(mountedB)

    mountedA.value = true
    await flushWatchers()
    expect(document.body.style.overflow).toBe('hidden')

    ownerB.unmount()
    await flushWatchers()
    expect(document.body.style.overflow).toBe('hidden')

    mountedA.value = false
    await flushWatchers()
    expect(document.body.style.overflow).toBe('')

    ownerA.unmount()
  })
})
