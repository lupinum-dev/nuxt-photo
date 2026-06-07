// @vitest-environment jsdom

import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PhotoItem } from '../src/core/index'
import { makePhoto } from '@test-fixtures/photos'
import { useLightbox, useLightboxProvider } from '../src/composables'
import { useLightboxRuntimeState } from '../src/composables/useLightboxRuntimeState'
import {
  createKeydownBinding,
  useLightboxWindowLifecycle,
  watchPhotoCollection,
} from '../src/composables/lightboxWatchers'

async function flushWatchers() {
  await nextTick()
  await Promise.resolve()
}

async function flushUntil(predicate: () => boolean, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    if (predicate()) return
    await flushWatchers()
  }
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

describe('lightbox lifecycle invariants', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(performance.now())
      return 0
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  })

  it('closes immediately while an opening image decode is pending', async () => {
    let resolveDecode: (() => void) | null = null
    vi.stubGlobal(
      'Image',
      class {
        onerror: null | (() => void) = null
        set src(_value: string) {}
        decode() {
          return new Promise<void>((resolve) => {
            resolveDecode = resolve
          })
        }
      },
    )

    const photos = [
      makePhoto({ id: 'delayed-close', src: '/delayed-close.jpg' }),
    ]
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null

    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState(photos, 'none')
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    const openPromise = api!.open(0)
    await flushUntil(() => typeof resolveDecode === 'function')
    expect(resolveDecode).toEqual(expect.any(Function))
    expect(api!.lifecycleStatus.value).toBe('opening')
    expect(api!.isOpen.value).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')

    const closePromise = api!.close()
    await closePromise
    await flushWatchers()

    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)
    expect(document.body.style.overflow).toBe('')

    resolveDecode?.()
    await openPromise
    await flushWatchers()

    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)
    expect(document.body.style.overflow).toBe('')

    app.unmount()
    host.remove()
  })

  it('does not run a queued open after close cancels the active open', async () => {
    let resolveFirst: (() => void) | null = null
    vi.stubGlobal(
      'Image',
      class {
        onerror: null | (() => void) = null
        private value = ''
        set src(value: string) {
          this.value = value
        }
        decode() {
          if (this.value.includes('queued-first')) {
            return new Promise<void>((resolve) => {
              resolveFirst = resolve
            })
          }
          return Promise.resolve()
        }
      },
    )

    const photos = [
      makePhoto({ id: 'queued-first', src: '/queued-first.jpg' }),
      makePhoto({ id: 'queued-second', src: '/queued-second.jpg' }),
    ]
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null

    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState(photos, 'none')
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    const firstOpen = api!.open(0)
    await flushUntil(() => typeof resolveFirst === 'function')
    const secondOpen = api!.open(1)
    await flushWatchers()

    await api!.close()
    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)

    resolveFirst?.()
    await firstOpen
    await secondOpen
    await flushWatchers()

    expect(api!.activeIndex.value).toBe(0)
    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)

    app.unmount()
    host.remove()
  })

  it('does not leak a failed slide image into the next active slide', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'Image',
      class {
        onerror: null | (() => void) = null
        private value = ''
        set src(value: string) {
          this.value = value
        }
        decode() {
          return this.value.includes('fail')
            ? Promise.reject(new Error('decode failed'))
            : Promise.resolve()
        }
      },
    )

    const photos = [
      makePhoto({ id: 'failed-slide', src: '/fail-slide.jpg' }),
      makePhoto({ id: 'good-slide', src: '/good-slide.jpg' }),
    ]
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null

    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState(photos, 'none')
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    await api!.open(0)
    await flushWatchers()
    expect(api!.activeImageLoadFailed.value).toBe(true)
    expect(api!.lifecycleStatus.value).toBe('open')

    await api!.open(1)
    await flushWatchers()
    expect(api!.activeIndex.value).toBe(1)
    expect(api!.activeImageLoadFailed.value).toBe(false)
    expect(api!.lifecycleStatus.value).toBe('open')

    app.unmount()
    host.remove()
    warn.mockRestore()
  })

  it('serializes quick open requests and lands on the last requested slide', async () => {
    let resolveFirst: (() => void) | null = null
    vi.stubGlobal(
      'Image',
      class {
        onerror: null | (() => void) = null
        private value = ''
        set src(value: string) {
          this.value = value
        }
        decode() {
          if (this.value.includes('first-open')) {
            return new Promise<void>((resolve) => {
              resolveFirst = resolve
            })
          }
          return Promise.resolve()
        }
      },
    )

    const photos = [
      makePhoto({ id: 'first-open', src: '/first-open.jpg' }),
      makePhoto({ id: 'second-open', src: '/second-open.jpg' }),
    ]
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null

    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState(photos, 'none')
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    const firstOpen = api!.open(0)
    await flushWatchers()
    const secondOpen = api!.open(1)
    await flushWatchers()

    expect(api!.activeIndex.value).toBe(0)
    resolveFirst?.()
    await firstOpen
    await secondOpen
    await flushWatchers()

    expect(api!.activeIndex.value).toBe(1)
    expect(api!.isOpen.value).toBe(true)
    expect(api!.lifecycleStatus.value).toBe('open')

    app.unmount()
    host.remove()
  })

  it('attaches keydown once and detaches cleanly', () => {
    const onKeydown = vi.fn()
    const binding = createKeydownBinding(onKeydown)

    binding.attach()
    binding.attach()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onKeydown).toHaveBeenCalledTimes(1)

    binding.detach()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onKeydown).toHaveBeenCalledTimes(1)
  })

  it('clears hidden thumbnail state after close', async () => {
    vi.stubGlobal(
      'Image',
      class {
        onerror: null | (() => void) = null
        set src(_value: string) {}
        decode() {
          return Promise.resolve()
        }
      },
    )

    const photos = [
      makePhoto({ id: 'cleanup-thumb', src: '/cleanup-thumb.jpg' }),
    ]
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null

    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState(photos, 'none')
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    await api!.open(0)
    expect(api!.lifecycleStatus.value).toBe('open')
    api!.hiddenThumbIndex.value = 0
    await api!.close()
    await flushWatchers()

    expect(api!.hiddenThumbIndex.value).toBeNull()
    expect(api!.isOpen.value).toBe(false)
    expect(api!.lifecycleStatus.value).toBe('closed')

    app.unmount()
    host.remove()
  })

  it('releases scroll lock and keydown ownership on provider unmount', async () => {
    vi.stubGlobal(
      'Image',
      class {
        onerror: null | (() => void) = null
        set src(_value: string) {}
        decode() {
          return Promise.resolve()
        }
      },
    )
    const addKeydown = vi.spyOn(window, 'addEventListener')
    const removeKeydown = vi.spyOn(window, 'removeEventListener')

    const photos = [makePhoto({ id: 'unmount-open', src: '/unmount-open.jpg' })]
    let api: ReturnType<typeof useLightboxProvider> | null = null

    const App = defineComponent({
      setup() {
        api = useLightboxProvider(photos, { transition: 'none' })
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    await api!.open(0)
    await flushWatchers()
    expect(document.body.style.overflow).toBe('hidden')
    expect(addKeydown).toHaveBeenCalledWith('keydown', expect.any(Function))

    app.unmount()
    host.remove()
    await flushWatchers()

    expect(document.body.style.overflow).toBe('')
    expect(removeKeydown).toHaveBeenCalledWith('keydown', expect.any(Function))
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
