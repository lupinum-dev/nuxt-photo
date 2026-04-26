// @vitest-environment jsdom

import {
  computed,
  createApp,
  defineComponent,
  h,
  nextTick,
  provide,
  ref,
  type Component,
  type InjectionKey,
} from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LightboxControls,
  LightboxSlide,
  PhotoGroupContextKey,
  type PhotoGroupContext,
  useLightbox,
} from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { makePhoto } from '@test-fixtures/photos'
import Photo from '../src/components/Photo.vue'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoGroup from '../src/components/PhotoGroup.vue'

function createImmediateImage() {
  return class ImmediateImage {
    onload: null | (() => void) = null
    onerror: null | (() => void) = null
    complete = true

    decode() {
      return Promise.resolve()
    }

    set src(_value: string) {
      queueMicrotask(() => {
        this.onload?.()
      })
    }
  }
}

const TestLightbox = defineComponent({
  name: 'TestLightbox',
  setup() {
    return () =>
      h(LightboxControls, null, {
        default: ({ photos }: { photos: PhotoItem[] }) =>
          h(
            'div',
            { 'data-testid': 'test-lightbox' },
            photos.map((photo, index) =>
              h(LightboxSlide, {
                key: photo.id,
                photo,
                index,
              }),
            ),
          ),
      })
  },
})

async function flushUi(iterations = 6) {
  for (let i = 0; i < iterations; i++) {
    await Promise.resolve()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

async function mountComponent(
  component: Component,
  options?: {
    props?: Record<string, unknown>
    slots?: Record<string, (...args: any[]) => any>
    provideValues?: Array<[InjectionKey<any> | string, unknown]>
  },
) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    setup() {
      for (const [key, value] of options?.provideValues ?? []) {
        provide(key as any, value)
      }

      return () => h(component, options?.props ?? {}, options?.slots ?? {})
    },
  })

  app.mount(container)
  await flushUi(2)

  return {
    app,
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('recipe contracts', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    )
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return []
        }
      },
    )
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false
        },
      })),
    )
    vi.stubGlobal('Image', createImmediateImage())
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now() + 1000), 0),
    )
    vi.stubGlobal('cancelAnimationFrame', (id: number) =>
      window.clearTimeout(id),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders plain Photo with thumb semantics instead of slide semantics', async () => {
    const photo = makePhoto({ id: 'plain-photo' })
    const imageAdapter = vi.fn(
      (item: PhotoItem, context: 'thumb' | 'slide' | 'preload') => ({
        src: `/${context}/${item.id}.jpg`,
        width: item.width,
        height: item.height,
      }),
    )

    const mounted = await mountComponent(Photo, {
      props: { photo, imageAdapter },
    })

    const img = mounted.container.querySelector('img')

    expect(img?.getAttribute('src')).toBe('/thumb/plain-photo.jpg')
    expect(
      new Set(imageAdapter.mock.calls.map(([, context]) => context)),
    ).toEqual(new Set(['thumb']))

    mounted.unmount()
  })

  it('refreshes PhotoAlbum parent-group registrations when photos reorder, insert, or remove', async () => {
    const a = makePhoto({ id: 'a' })
    const b = makePhoto({ id: 'b' })
    const c = makePhoto({ id: 'c' })
    const photos = ref<PhotoItem[]>([a, b])
    const register = vi.fn()
    const unregister = vi.fn()

    const parentGroup: PhotoGroupContext = {
      mode: 'explicit',
      register,
      unregister,
      open: vi.fn(async () => {}),
      openPhoto: vi.fn(async () => {}),
      openById: vi.fn(async () => {}),
      photos: computed(() => photos.value),
      hiddenPhoto: computed(() => null),
    }

    const Wrapper = defineComponent({
      setup() {
        return () =>
          h(PhotoAlbum, {
            photos: photos.value,
            lightbox: false,
          })
      },
    })

    const mounted = await mountComponent(Wrapper, {
      provideValues: [[PhotoGroupContextKey, parentGroup]],
    })

    // Initial: a and b registered
    expect(register.mock.calls.map((call) => call[1].id)).toEqual(['a', 'b'])

    register.mockClear()
    unregister.mockClear()

    // Reorder + insert c: registrations are rebuilt in render order.
    photos.value = [b, a, c]
    await flushUi()
    expect(unregister).toHaveBeenCalledTimes(2)
    expect(register.mock.calls.map((call) => call[1].id)).toEqual([
      'b',
      'a',
      'c',
    ])

    register.mockClear()
    unregister.mockClear()

    // Remove b: registrations are rebuilt again so Map insertion order stays correct.
    photos.value = [c, a]
    await flushUi()
    expect(unregister).toHaveBeenCalledTimes(3)
    expect(register.mock.calls.map((call) => call[1].id)).toEqual(['c', 'a'])

    register.mockClear()
    unregister.mockClear()

    // Unmount: current registrations (c, a) cleaned up.
    mounted.unmount()
    expect(unregister).toHaveBeenCalledTimes(2)
  })

  it('renders custom solo slide content through a custom lightbox recipe', async () => {
    const photo = makePhoto({ id: 'solo-slide' })

    const mounted = await mountComponent(Photo, {
      props: {
        photo,
        lightbox: TestLightbox,
      },
      slots: {
        slide: ({ photo: slidePhoto }: { photo: PhotoItem }) =>
          h(
            'div',
            { 'data-testid': 'solo-custom-slide' },
            `Solo ${slidePhoto.id}`,
          ),
      },
    })

    await flushUi()

    expect(mounted.container.innerHTML).toContain('solo-custom-slide')
    expect(mounted.container.textContent ?? '').toContain('solo-slide')

    mounted.unmount()
  })

  it('renders custom grouped slide content through a custom lightbox recipe', async () => {
    const photo = makePhoto({ id: 'grouped-slide' })

    const mounted = await mountComponent(PhotoGroup, {
      props: {
        lightbox: TestLightbox,
      },
      slots: {
        default: () => [
          h(
            Photo,
            { photo },
            {
              slide: ({ photo: slidePhoto }: { photo: PhotoItem }) =>
                h(
                  'div',
                  { 'data-testid': 'grouped-custom-slide' },
                  `Grouped ${slidePhoto.id}`,
                ),
            },
          ),
        ],
      },
    })

    await flushUi()

    expect(
      mounted.container.querySelector('[data-testid="grouped-custom-slide"]')
        ?.textContent,
    ).toContain('grouped-slide')

    mounted.unmount()
  })

  it('exposes the documented headless PhotoGroup slot helpers and methods', async () => {
    const photos = [
      makePhoto({ id: 'headless-a' }),
      makePhoto({ id: 'headless-b' }),
    ]

    let slotProps: Record<string, any> | null = null
    let groupApi: any = null
    let lightboxApi: ReturnType<typeof useLightbox> | null = null

    const Probe = defineComponent({
      setup() {
        lightboxApi = useLightbox()
        return () => null
      },
    })

    const Wrapper = defineComponent({
      setup() {
        const groupRef = ref()
        groupApi = groupRef

        return () =>
          h(
            PhotoGroup,
            {
              ref: groupRef,
              photos,
              lightbox: false,
            },
            {
              default: (props: Record<string, any>) => {
                slotProps = props
                return [h(Probe)]
              },
            },
          )
      },
    })

    const mounted = await mountComponent(Wrapper)

    expect(slotProps).toBeTruthy()
    expect(slotProps?.photos).toHaveLength(2)
    expect(typeof slotProps?.open).toBe('function')
    expect(typeof slotProps?.openPhoto).toBe('function')
    expect(typeof slotProps?.openById).toBe('function')
    expect(typeof slotProps?.setThumbRef).toBe('function')
    expect(typeof slotProps?.trigger).toBe('function')
    expect(typeof groupApi?.value?.open).toBe('function')
    expect(typeof groupApi?.value?.openPhoto).toBe('function')
    expect(typeof groupApi?.value?.openById).toBe('function')

    await groupApi.value.openById('headless-b')
    await flushUi()
    expect(lightboxApi?.isOpen.value).toBe(true)
    expect(lightboxApi?.activeIndex.value).toBe(1)

    await groupApi.value.openPhoto(photos[0]!)
    await flushUi()
    expect(lightboxApi?.activeIndex.value).toBe(0)

    await groupApi.value.openById('missing-photo')
    await flushUi()
    expect(lightboxApi?.activeIndex.value).toBe(0)

    mounted.unmount()
  })

  it('moves focus into the lightbox and restores it to the trigger on close', async () => {
    const photo = makePhoto({ id: 'focus-photo' })

    const mounted = await mountComponent(Photo, {
      props: { photo, lightbox: true },
    })

    const trigger = mounted.container.querySelector(
      'figure',
    ) as HTMLElement | null
    expect(trigger).toBeTruthy()

    trigger?.focus()
    trigger?.click()
    await flushUi()

    const dialog = document.body.querySelector(
      '.np-lightbox[tabindex="-1"]',
    ) as HTMLElement | null
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-label')).toBe('Photo viewer')
    expect(dialog?.contains(document.activeElement)).toBe(true)

    const closeButton = document.body.querySelector(
      '.np-lightbox__btn--close',
    ) as HTMLButtonElement | null
    expect(closeButton).toBeTruthy()
    closeButton?.click()
    await flushUi()

    expect(document.activeElement).toBe(trigger)

    mounted.unmount()
  })
})
