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
import { LightboxControls, LightboxSlide } from '@nuxt-photo/vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { PhotoGroupContextKey, type PhotoGroupContext } from '@nuxt-photo/vue/internal'
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
    return () => h(LightboxControls, null, {
      default: ({ photos }: { photos: PhotoItem[] }) => h(
        'div',
        { 'data-testid': 'test-lightbox' },
        photos.map((photo, index) => h(LightboxSlide, {
          key: photo.id,
          photo,
          index,
        })),
      ),
    })
  },
})

async function flushUi(iterations = 6) {
  for (let i = 0; i < iterations; i++) {
    await Promise.resolve()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
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
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
      unobserve() {}
    })
    vi.stubGlobal('Image', createImmediateImage())
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now() + 1000), 0),
    )
    vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders plain Photo with thumb semantics instead of slide semantics', async () => {
    const photo = makePhoto({ id: 'plain-photo' })
    const adapter = vi.fn((item: PhotoItem, context: 'thumb' | 'slide' | 'preload') => ({
      src: `/${context}/${item.id}.jpg`,
      width: item.width,
      height: item.height,
    }))

    const mounted = await mountComponent(Photo, {
      props: { photo, adapter },
    })

    const img = mounted.container.querySelector('img')

    expect(img?.getAttribute('src')).toBe('/thumb/plain-photo.jpg')
    expect(new Set(adapter.mock.calls.map(([, context]) => context))).toEqual(new Set(['thumb']))

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
      photos: computed(() => photos.value),
      hiddenPhoto: computed(() => null),
    }

    const Wrapper = defineComponent({
      setup() {
        return () => h(PhotoAlbum, {
          photos: photos.value,
          lightbox: false,
        })
      },
    })

    const mounted = await mountComponent(Wrapper, {
      provideValues: [[PhotoGroupContextKey, parentGroup]],
    })

    // Initial: a and b registered
    expect(register.mock.calls.map(call => call[1].id)).toEqual(['a', 'b'])

    // Reorder + insert c: only c is newly registered (diff-based — a and b preserved)
    photos.value = [b, a, c]
    await flushUi()
    expect(register.mock.calls.map(call => call[1].id)).toEqual(['a', 'b', 'c'])
    expect(unregister).not.toHaveBeenCalled()

    // Remove b: only b gets unregistered; c and a are preserved
    photos.value = [c, a]
    await flushUi()
    expect(register).toHaveBeenCalledTimes(3) // no new registrations
    expect(unregister).toHaveBeenCalledTimes(1) // b removed

    // Unmount: remaining registrations (c, a) cleaned up
    mounted.unmount()
    expect(unregister).toHaveBeenCalledTimes(3) // b + c + a
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
          h('div', { 'data-testid': 'solo-custom-slide' }, `Solo ${slidePhoto.id}`),
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
          h(Photo, { photo }, {
            slide: ({ photo: slidePhoto }: { photo: PhotoItem }) =>
              h('div', { 'data-testid': 'grouped-custom-slide' }, `Grouped ${slidePhoto.id}`),
          }),
        ],
      },
    })

    await flushUi()

    expect(mounted.container.querySelector('[data-testid="grouped-custom-slide"]')?.textContent).toContain('grouped-slide')

    mounted.unmount()
  })
})
