// @vitest-environment jsdom

import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import type { PhotoItem } from '../src/core/index'
import { makePhoto } from '@test-fixtures/photos'
import { useLightbox, provideLightbox } from '../src/composables'
import { getMountedSlideIndices, useLightboxRuntimeState } from '../src/lightbox/runtime'
import {
  createKeydownBinding,
  useLightboxWindowLifecycle,
  watchPhotoCollection,
} from '../src/lightbox/watchers'

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

describe('lightbox media window', () => {
  it.each([
    { active: 0, count: 5, expected: [0, 1, 4] },
    { active: 2, count: 5, expected: [1, 2, 3] },
    { active: 4, count: 5, expected: [0, 3, 4] },
    { active: 0, count: 1, expected: [0] },
    { active: 1, count: 2, expected: [0, 1] },
  ])('mounts modular neighbors for $active of $count', ({ active, count, expected }) => {
    expect([...getMountedSlideIndices(active, count)].sort((a, b) => a - b)).toEqual(expected)
  })
})

describe('lightbox controller surface', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('returns the same controller behavior from provider and injected consumer', async () => {
    const photos = [makePhoto({ id: 'controller-a' })]
    let providerApi: ReturnType<typeof provideLightbox> | null = null
    let consumerApi: ReturnType<typeof useLightbox> | null = null

    const Consumer = defineComponent({
      setup() {
        consumerApi = useLightbox()
        return () => null
      },
    })

    const App = defineComponent({
      setup() {
        providerApi = provideLightbox(photos, { transition: 'none' })
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
        'photos',
        'prev',
        'toggleZoom',
      ].sort(),
    )
    expect(consumerApi!.photos.value).toEqual(providerApi!.photos.value)
    expect(consumerApi!.activeIndex.value).toBe(providerApi!.activeIndex.value)
    expect(consumerApi!.open).toBe(providerApi!.open)

    app.unmount()
    host.remove()
  })

  it('rejects invalid controller targets without opening', async () => {
    const photos = [makePhoto({ id: 'controller-a' })]
    let providerApi: ReturnType<typeof provideLightbox> | null = null

    const App = defineComponent({
      setup() {
        providerApi = provideLightbox(photos, { transition: 'none' })
        return () => null
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await flushWatchers()

    await expect(providerApi!.open(-1)).rejects.toThrow(RangeError)
    await expect(providerApi!.openById('missing-controller')).rejects.toThrow(RangeError)
    await flushWatchers()

    expect(providerApi!.isOpen.value).toBe(false)
    expect(providerApi!.activeIndex.value).toBe(0)
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

  it('honors a close intent issued while open is still reconciling', async () => {
    const photos = [makePhoto({ id: 'delayed-close', src: '/delayed-close.jpg' })]
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
    const closePromise = api!.close()
    await Promise.all([openPromise, closePromise])
    await flushWatchers()

    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)
    expect(document.body.style.overflow).toBe('')

    app.unmount()
    host.remove()
  })

  it('settles closed after close supersedes queued open intents', async () => {
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
    const secondOpen = api!.open(1)
    await api!.close()
    await firstOpen
    await secondOpen
    await flushWatchers()

    expect(api!.activeIndex.value).toBe(0)
    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)

    app.unmount()
    host.remove()
  })

  it('cancels stale open work and lands on the last requested slide', async () => {
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
    const secondOpen = api!.open(1)
    await firstOpen
    await secondOpen
    await flushWatchers()

    expect(api!.activeIndex.value).toBe(1)
    expect(api!.isOpen.value).toBe(true)
    expect(api!.lifecycleStatus.value).toBe('open')

    app.unmount()
    host.remove()
  })

  it('reopens to the latest slide while a close is active', async () => {
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
    const photos = [makePhoto({ id: 'reopen-a' }), makePhoto({ id: 'reopen-b' })]
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent({
        setup() {
          api = useLightboxRuntimeState(photos, 'none')
          return () => null
        },
      }),
    )
    app.mount(host)

    await api!.open(0)
    const closing = api!.close()
    const reopening = api!.open(1)
    await Promise.all([closing, reopening])

    expect(api!.lifecycleStatus.value).toBe('open')
    expect(api!.activeIndex.value).toBe(1)
    app.unmount()
    host.remove()
  })

  it('hands modal ownership to the latest provider', async () => {
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
    const photo = makePhoto({ id: 'owner' })
    let first: ReturnType<typeof useLightboxRuntimeState> | null = null
    let second: ReturnType<typeof useLightboxRuntimeState> | null = null
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent({
        setup() {
          first = useLightboxRuntimeState([photo], 'none')
          second = useLightboxRuntimeState([photo], 'none')
          return () => null
        },
      }),
    )
    app.mount(host)

    await first!.open(0)
    await second!.open(0)

    expect(first!.lifecycleStatus.value).toBe('closed')
    expect(second!.lifecycleStatus.value).toBe('open')
    app.unmount()
    host.remove()
  })

  it('closes autonomously through Escape', async () => {
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null
    const photo = makePhoto({ id: 'escape-error' })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent({
        setup() {
          api = useLightboxRuntimeState([photo], 'none')
          return () => null
        },
      }),
    )
    app.mount(host)

    await api!.open(0)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushUntil(() => api!.lifecycleStatus.value === 'closed')

    expect(api!.lifecycleStatus.value).toBe('closed')
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

    const photos = [makePhoto({ id: 'cleanup-thumb', src: '/cleanup-thumb.jpg' })]
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
    let api: ReturnType<typeof provideLightbox> | null = null

    const App = defineComponent({
      setup() {
        api = provideLightbox(photos, { transition: 'none' })
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

  it('settles closed and rethrows adapter failures during open', async () => {
    const failure = new Error('adapter-open-failure')
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null
    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState(
          [makePhoto({ id: 'adapter-open' })],
          'none',
          undefined,
          () => {
            throw failure
          },
        )
        return () => null
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    await expect(api!.open()).rejects.toBe(failure)
    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)
    expect(document.body.style.overflow).toBe('')
    app.unmount()
  })

  it('does not resolve the image adapter again during an instant close', async () => {
    let fail = false
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null
    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState(
          [makePhoto({ id: 'adapter-close' })],
          'none',
          undefined,
          (photo) => {
            if (fail) throw new Error('adapter unexpectedly called during close')
            return { src: photo.src }
          },
        )
        return () => null
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    await api!.open()
    fail = true
    await expect(api!.close()).resolves.toBeUndefined()
    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(api!.isOpen.value).toBe(false)
    expect(document.body.style.overflow).toBe('')
    app.unmount()
  })

  it('aborts pending image continuation when the provider unmounts', async () => {
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
    let api: ReturnType<typeof useLightboxRuntimeState> | null = null
    const App = defineComponent({
      setup() {
        api = useLightboxRuntimeState([makePhoto({ id: 'unmount-pending' })], 'none')
        return () => null
      },
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)

    const opening = api!.open()
    await flushUntil(() => !!resolveDecode)
    app.unmount()
    host.remove()
    resolveDecode?.()
    await opening
    await flushWatchers()

    expect(api!.lifecycleStatus.value).toBe('closed')
    expect(document.body.style.overflow).toBe('')
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
        isMounted: ref(true),
        goTo,
        close,
        reportAsyncError: (_operation, task) => void task,
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
        isMounted: ref(true),
        goTo,
        close,
        reportAsyncError: (_operation, task) => void task,
      },
    )

    photos.value = [a]
    await flushWatchers()

    expect(close).toHaveBeenCalledTimes(1)
    expect(goTo).toHaveBeenCalledWith(0, true)
  })

  it('hands collection-close failures to the autonomous error reporter', async () => {
    const a = makePhoto({ id: 'a' })
    const b = makePhoto({ id: 'b' })
    const photos = ref<PhotoItem[]>([a, b])
    const failure = new Error('collection close failed')
    const close = vi.fn(() => Promise.reject(failure))
    const reported: Array<{ operation: string; task: Promise<unknown> }> = []

    watchPhotoCollection(
      computed(() => photos.value),
      {
        activeIndex: ref(1),
        isMounted: ref(true),
        goTo: vi.fn(),
        close,
        reportAsyncError(operation, task) {
          reported.push({ operation, task })
        },
      },
    )

    photos.value = [a]
    await flushWatchers()

    expect(reported).toHaveLength(1)
    expect(reported[0]?.operation).toBe('collection-close')
    await expect(reported[0]!.task).rejects.toBe(failure)
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

    function mountOwner(isMounted: typeof mountedA) {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createApp(
        defineComponent({
          setup() {
            useLightboxWindowLifecycle({
              isMounted,
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
