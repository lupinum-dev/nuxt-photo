// @vitest-environment jsdom

import { createApp, createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makePhoto } from '@test-fixtures/photos'
import type { PhotoItem } from '@nuxt-photo/core'
import PhotoCarousel from '../src/components/PhotoCarousel.vue'

const photos = [
  makePhoto({ id: 'c-1' }),
  makePhoto({ id: 'c-2' }),
  makePhoto({ id: 'c-3' }),
  makePhoto({ id: 'c-4' }),
]

async function flushUi(iterations = 6) {
  for (let i = 0; i < iterations; i++) {
    await Promise.resolve()
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
  }
}

function mount(
  component: any,
  props: Record<string, any> = {},
  slots: Record<string, any> = {},
) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const handleRef = ref<any>(null)
  const Wrapper = defineComponent({
    setup() {
      return () => h(component, { ...props, ref: handleRef }, slots)
    },
  })

  const app = createApp(Wrapper)
  app.mount(container)

  return {
    app,
    container,
    get handle() {
      return handleRef.value
    },
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

describe('PhotoCarousel — DOM', () => {
  beforeEach(() => {
    class NoopObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return []
      }
    }
    vi.stubGlobal('ResizeObserver', NoopObserver)
    // Embla looks these up on the element's ownerWindow — jsdom needs them installed there too.
    window.ResizeObserver =
      NoopObserver as unknown as typeof window.ResizeObserver
    window.IntersectionObserver =
      NoopObserver as unknown as typeof window.IntersectionObserver
    if (!window.matchMedia) {
      window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const node of Array.from(document.body.childNodes)) node.remove()
  })

  it('renders one slide element per photo', async () => {
    const m = mount(PhotoCarousel, { photos })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__slide').length).toBe(
      photos.length,
    )
    m.unmount()
  })

  it('renders thumbnails by default', async () => {
    const m = mount(PhotoCarousel, { photos })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__thumb').length).toBe(
      photos.length,
    )
    m.unmount()
  })

  it('renders nothing meaningful when photos is empty', async () => {
    const m = mount(PhotoCarousel, { photos: [] })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__slide').length).toBe(0)
    expect(m.container.querySelectorAll('.np-carousel__thumb').length).toBe(0)
    expect(m.container.querySelectorAll('.np-carousel__arrow').length).toBe(0)
    m.unmount()
  })

  it('suppresses arrows, counter, thumbnails, and dots when only one photo', async () => {
    const m = mount(PhotoCarousel, { photos: [photos[0]], showDots: true })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__slide').length).toBe(1)
    expect(m.container.querySelectorAll('.np-carousel__arrow').length).toBe(0)
    expect(m.container.querySelector('.np-carousel__counter')).toBeNull()
    expect(m.container.querySelectorAll('.np-carousel__thumb').length).toBe(0)
    expect(m.container.querySelector('.np-carousel__dots')).toBeNull()
    m.unmount()
  })

  it('custom #slide slot replaces default PhotoImage', async () => {
    const m = mount(
      PhotoCarousel,
      { photos },
      {
        slide: ({ photo }: { photo: PhotoItem }) =>
          h('div', { class: 'custom-slide', 'data-id': photo.id }, photo.id),
      },
    )
    await flushUi()
    const custom = m.container.querySelectorAll('.custom-slide')
    expect(custom.length).toBe(photos.length)
    expect(m.container.querySelector('.np-carousel__media')).toBeNull()
    m.unmount()
  })

  it('custom #thumb slot replaces default thumbnail', async () => {
    const m = mount(
      PhotoCarousel,
      { photos },
      {
        thumb: ({ photo }: { photo: PhotoItem }) =>
          h('span', { class: 'custom-thumb' }, photo.id),
      },
    )
    await flushUi()
    expect(m.container.querySelectorAll('.custom-thumb').length).toBe(
      photos.length,
    )
    m.unmount()
  })

  it('hides arrows when showArrows is false', async () => {
    const m = mount(PhotoCarousel, { photos, showArrows: false })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__arrow').length).toBe(0)
    m.unmount()
  })

  it('shows dots when showDots is true', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      showDots: true,
      showThumbnails: false,
    })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__dot').length).toBe(
      photos.length,
    )
    m.unmount()
  })

  it('applies layout CSS variables from props', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      slideSize: '80%',
      slideAspect: '4 / 3',
      gap: '2rem',
      thumbSize: '8rem',
    })
    await flushUi()
    const root = m.container.querySelector('.np-carousel') as HTMLElement
    expect(root.style.getPropertyValue('--np-carousel-slide-size')).toBe('80%')
    expect(root.style.getPropertyValue('--np-carousel-slide-aspect')).toBe(
      '4 / 3',
    )
    expect(root.style.getPropertyValue('--np-carousel-gap')).toBe('2rem')
    expect(root.style.getPropertyValue('--np-carousel-thumb-size')).toBe('8rem')
    m.unmount()
  })

  it('warns in dev when autoplay prop and user Autoplay plugin are both supplied', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fakeAutoplayPlugin = {
      name: 'autoplay',
      options: {},
      init() {},
      destroy() {},
      play() {},
      stop() {},
      reset() {},
      isPlaying: () => false,
      timeUntilNext: () => null,
    } as any
    const m = mount(PhotoCarousel, {
      photos,
      autoplay: { delay: 3000 },
      plugins: [fakeAutoplayPlugin],
    })
    await flushUi()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('PhotoCarousel'))
    warn.mockRestore()
    m.unmount()
  })

  it('forwards root attrs to the rendered carousel root', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      id: 'reviewed-carousel',
      'data-test-id': 'carousel-root',
    })
    await flushUi()
    const root = m.container.querySelector('.np-carousel') as HTMLElement
    expect(root.id).toBe('reviewed-carousel')
    expect(root.getAttribute('data-test-id')).toBe('carousel-root')
    m.unmount()
  })
})

describe('PhotoCarousel — SSR', () => {
  it('renders slide markup without throwing', async () => {
    const app = createSSRApp({
      render: () => h(PhotoCarousel, { photos }),
    })
    const html = await renderToString(app)
    expect(html).toContain('np-carousel')
    expect(html).toContain('c-1')
    expect(html).toContain('c-2')
  })

  it('SSR with single photo suppresses navigation chrome', async () => {
    const app = createSSRApp({
      render: () => h(PhotoCarousel, { photos: [photos[0]] }),
    })
    const html = await renderToString(app)
    expect(html).toContain('np-carousel__slide')
    expect(html).not.toContain('np-carousel__arrow')
    expect(html).not.toContain('np-carousel__thumb ')
  })

  it('SSR with lightbox enabled includes PhotoGroup teleport markers', async () => {
    const app = createSSRApp({
      render: () => h(PhotoCarousel, { photos, lightbox: true }),
    })
    const html = await renderToString(app)
    expect(html).toContain('np-carousel')
    expect(html).toContain('teleport start')
    expect(html).toContain('teleport end')
  })
})
