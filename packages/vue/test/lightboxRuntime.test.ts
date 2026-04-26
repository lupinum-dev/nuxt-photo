// @vitest-environment jsdom

import { computed, createApp, defineComponent, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PhotoItem } from '@nuxt-photo/core'
import { makePhoto } from '@test-fixtures/photos'
import {
  useLightboxWindowLifecycle,
  watchPhotoCollection,
} from '../src/composables/lightboxContextRuntime'

async function flushWatchers() {
  await nextTick()
  await Promise.resolve()
}

describe('lightbox runtime collection handling', () => {
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

describe('lightbox runtime scroll lock ownership', () => {
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
