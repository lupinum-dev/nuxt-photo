// @vitest-environment jsdom

import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  type Component,
} from 'vue'
import { renderToString } from '@vue/server-renderer'
import useEmblaCarousel from 'embla-carousel-vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import type { PhotoItem } from '../../src/core/index'
import PhotoCarousel from '../../src/components/PhotoCarousel.vue'

// Observe the real composable's results without replacing Embla or autoplay.
vi.mock('embla-carousel-vue', { spy: true })

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
  component: Component,
  props: Record<string, unknown> = {},
  slots: Record<string, unknown> = {},
) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const Wrapper = defineComponent({
    setup() {
      return () => h(component, props, slots)
    },
  })

  const app = createApp(Wrapper)
  app.mount(container)

  return {
    app,
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

function setCarouselRect(element: Element, left: number, width: number) {
  for (const [name, value] of Object.entries({
    offsetLeft: left,
    offsetTop: 0,
    offsetWidth: width,
    offsetHeight: 400,
  })) {
    Object.defineProperty(element, name, { configurable: true, value })
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
    window.ResizeObserver = NoopObserver as unknown as typeof window.ResizeObserver
    window.IntersectionObserver = NoopObserver as unknown as typeof window.IntersectionObserver
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
    expect(m.container.querySelectorAll('.np-carousel__slide').length).toBe(photos.length)
    const images = Array.from(m.container.querySelectorAll('.np-carousel__media'))
    expect(images.map((image) => image.getAttribute('loading'))).toEqual([
      'eager',
      'lazy',
      'lazy',
      'lazy',
    ])
    expect(images.map((image) => image.getAttribute('fetchpriority'))).toEqual([
      'high',
      null,
      null,
      null,
    ])
    m.unmount()
  })

  it('renders thumbnails by default', async () => {
    const m = mount(PhotoCarousel, { photos })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__thumb').length).toBe(photos.length)
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
    const m = mount(PhotoCarousel, {
      photos: [photos[0]],
      controls: ['arrows', 'thumbnails', 'counter', 'dots'],
    })
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
        thumb: ({ photo }: { photo: PhotoItem }) => h('span', { class: 'custom-thumb' }, photo.id),
      },
    )
    await flushUi()
    expect(m.container.querySelectorAll('.custom-thumb').length).toBe(photos.length)
    m.unmount()
  })

  it('hides arrows when controls omit arrows', async () => {
    const m = mount(PhotoCarousel, { photos, controls: ['thumbnails', 'counter'] })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__arrow').length).toBe(0)
    m.unmount()
  })

  it('shows dots when controls include dots', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      controls: ['arrows', 'counter', 'dots'],
    })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__dot').length).toBe(1)
    m.unmount()
  })

  it('reconciles dot count from real geometry after Embla reinitializes', async () => {
    const fivePhotos = [...photos, makePhoto({ id: 'c-5' })]
    const props = reactive({
      photos: fivePhotos,
      controls: ['arrows', 'counter', 'dots'],
      slideSize: '33.333%',
      dragFree: false,
    })
    const m = mount(PhotoCarousel, props)
    await flushUi()

    const viewport = m.container.querySelector('.np-carousel__viewport')!
    const container = m.container.querySelector('.np-carousel__container')!
    const slides = [...m.container.querySelectorAll('.np-carousel__slide')]
    setCarouselRect(viewport, 0, 600)
    setCarouselRect(container, 0, 600)
    slides.forEach((slide, index) => setCarouselRect(slide, index * 200, 200))

    props.dragFree = true
    await flushUi(10)

    expect(m.container.querySelectorAll('.np-carousel__dot')).toHaveLength(5)
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
    expect(root.style.getPropertyValue('--np-carousel-slide-aspect')).toBe('4 / 3')
    expect(root.style.getPropertyValue('--np-carousel-gap')).toBe('2rem')
    expect(root.style.getPropertyValue('--np-carousel-thumb-size')).toBe('8rem')
    m.unmount()
  })

  it('accepts library-owned autoplay options', async () => {
    const m = mount(PhotoCarousel, {
      photos,
      autoplay: { delayMs: 3000, stopOnMouseEnter: true },
    })
    await flushUi()
    expect(m.container.querySelectorAll('.np-carousel__slide')).toHaveLength(4)
    m.unmount()
  })

  it('keeps one autoplay subscription and timer after repeated prop changes', async () => {
    vi.mocked(useEmblaCarousel).mockClear()
    const props = reactive({ photos, autoplay: false })
    const m = mount(PhotoCarousel, props)
    try {
      await flushUi()
      const api = vi.mocked(useEmblaCarousel).mock.results[0]!.value[1].value!
      const on = vi.spyOn(api, 'on')
      const off = vi.spyOn(api, 'off')
      const viewport = m.container.querySelector('.np-carousel__viewport')!
      const container = m.container.querySelector('.np-carousel__container')!
      setCarouselRect(viewport, 0, 600)
      setCarouselRect(container, 0, 600)
      m.container
        .querySelectorAll('.np-carousel__slide')
        .forEach((slide, index) => setCarouselRect(slide, index * 600, 600))
      vi.useFakeTimers()
      const timers = vi.spyOn(window, 'setTimeout')
      const cleared = vi.spyOn(window, 'clearTimeout')
      for (let change = 0; change < 9; change++) {
        props.autoplay = !props.autoplay
        await nextTick()
        await vi.advanceTimersByTimeAsync(0)
      }
      for (const event of ['select', 'autoplay:play', 'autoplay:stop'] as const) {
        const subscriptions = on.mock.calls.filter(([name]) => name === event)
        const removals = off.mock.calls.filter(([name]) => name === event)
        const remaining = subscriptions.filter(
          ([, listener]) => !removals.some(([, removed]) => removed === listener),
        )
        expect(remaining, event).toHaveLength(1)
        // Includes the one initial subscription registered before these method spies.
        expect(1 + subscriptions.length - removals.length, event).toBe(1)
      }
      // Count autoplay's 4000ms timers, excluding Embla's observer/frame scheduling.
      const pending = timers.mock.calls.filter(
        ([, delay], index) =>
          delay === 4000 &&
          !cleared.mock.calls.some(([id]) => id === timers.mock.results[index]!.value),
      )
      expect(pending).toHaveLength(1)
      expect(m.container.querySelector('.np-carousel__autoplay')?.getAttribute('aria-label')).toBe(
        'Pause slideshow',
      )
    } finally {
      m.unmount()
      vi.restoreAllMocks()
      vi.useRealTimers()
    }
  })

  it('enables autoplay reactively while retaining Embla default delay', async () => {
    const props = reactive({ photos, autoplay: false as boolean | { delayMs?: number } })
    const m = mount(PhotoCarousel, props)
    await flushUi()

    const viewport = m.container.querySelector('.np-carousel__viewport')!
    const container = m.container.querySelector('.np-carousel__container')!
    const slides = [...m.container.querySelectorAll('.np-carousel__slide')]
    setCarouselRect(viewport, 0, 600)
    setCarouselRect(container, 0, 600)
    slides.forEach((slide, index) => setCarouselRect(slide, index * 600, 600))

    vi.useFakeTimers()
    try {
      props.autoplay = true
      await nextTick()
      await Promise.resolve()

      const counter = m.container.querySelector('.np-carousel__counter')!
      const next = m.container.querySelector('.np-carousel__arrow--next') as HTMLButtonElement
      expect(next.disabled).toBe(false)
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      expect(counter.textContent).toContain('1 / 4')
      await vi.advanceTimersByTimeAsync(3999)
      expect(counter.textContent).toContain('1 / 4')

      await vi.advanceTimersByTimeAsync(1001)
      await nextTick()
      expect(counter.textContent).toContain('2 / 4')
    } finally {
      vi.useRealTimers()
    }

    expect(m.container.querySelectorAll('.np-carousel__slide')).toHaveLength(4)
    m.unmount()
  })

  // Embla starts autoplay only once the slides have a size, so size them first.
  async function mountAutoplayCarousel() {
    const props = reactive({ photos, autoplay: false, loop: false })
    const m = mount(PhotoCarousel, props)
    await flushUi()
    const viewport = m.container.querySelector('.np-carousel__viewport')!
    const container = m.container.querySelector('.np-carousel__container')!
    setCarouselRect(viewport, 0, 600)
    setCarouselRect(container, 0, 600)
    m.container
      .querySelectorAll('.np-carousel__slide')
      .forEach((slide, index) => setCarouselRect(slide, index * 600, 600))
    props.autoplay = true
    await flushUi()
    return {
      ...m,
      props,
      counter: () => m.container.querySelector('.np-carousel__counter')!.textContent,
      pauseButton: () => m.container.querySelector<HTMLButtonElement>('.np-carousel__autoplay'),
    }
  }

  it('does not autoplay under reduced motion, and starts when the preference is removed', async () => {
    let reduce = true
    const listeners = new Set<() => void>()
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          get matches() {
            return query.includes('reduce') && reduce
          },
          media: query,
          addEventListener: (_: string, listener: () => void) => listeners.add(listener),
          removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
        }) as unknown as MediaQueryList,
    )
    const m = await mountAutoplayCarousel()
    vi.useFakeTimers()
    try {
      await vi.advanceTimersByTimeAsync(9000)
      expect(m.counter()).toContain('1 / 4')
      expect(m.pauseButton()).toBeNull()

      reduce = false
      for (const listener of listeners) listener()
      await nextTick()
      await vi.advanceTimersByTimeAsync(4100)
      expect(m.pauseButton()?.getAttribute('aria-label')).toBe('Pause slideshow')
      expect(m.counter()).toContain('2 / 4')
      m.unmount()
    } finally {
      vi.useRealTimers()
      vi.restoreAllMocks()
    }
  })

  it('pauses autoplay from its visible button', async () => {
    const m = await mountAutoplayCarousel()
    vi.useFakeTimers()
    try {
      const button = m.pauseButton()!
      expect(button.getAttribute('aria-label')).toBe('Pause slideshow')

      button.click()
      await nextTick()
      expect(button.getAttribute('aria-label')).toBe('Play slideshow')
      await vi.advanceTimersByTimeAsync(9000)
      expect(m.counter()).toContain('1 / 4')

      // Embla reinitializes on option, size, and slide changes; the pause must hold.
      m.props.loop = true
      await nextTick()
      await vi.advanceTimersByTimeAsync(9000)
      expect(button.getAttribute('aria-label')).toBe('Play slideshow')
      expect(m.counter()).toContain('1 / 4')

      button.click()
      await nextTick()
      await vi.advanceTimersByTimeAsync(4100)
      expect(m.counter()).toContain('2 / 4')
      m.unmount()
    } finally {
      vi.useRealTimers()
    }
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

  it.each([
    ['without lightbox', false],
    ['with lightbox', true],
  ])('forwards public layout slots %s', async (_label, lightbox) => {
    const m = mount(
      PhotoCarousel,
      {
        photos,
        lightbox: lightbox ? { transition: 'none' } : false,
        controls: ['arrows', 'thumbnails', 'counter', 'dots'],
      },
      {
        slide: ({ photo }: { photo: PhotoItem }) => h('span', { class: 'slot-slide' }, photo.id),
        thumb: ({ photo }: { photo: PhotoItem }) => h('span', { class: 'slot-thumb' }, photo.id),
        caption: () => h('span', { class: 'slot-caption' }, 'caption'),
        controls: () => h('span', { class: 'slot-controls' }, 'controls'),
        dots: () => h('span', { class: 'slot-dots' }, 'dots'),
      },
    )
    await flushUi()

    expect(m.container.querySelectorAll('.slot-slide').length).toBe(photos.length)
    expect(m.container.querySelectorAll('.slot-thumb').length).toBe(photos.length)
    expect(m.container.querySelector('.slot-caption')).not.toBeNull()
    expect(m.container.querySelector('.slot-controls')).not.toBeNull()
    expect(m.container.querySelector('.slot-dots')).not.toBeNull()

    m.unmount()
  })

  it.each([
    ['without lightbox', false],
    ['with lightbox', true],
  ])('forwards prev and next slots %s', async (_label, lightbox) => {
    const m = mount(
      PhotoCarousel,
      { photos, lightbox: lightbox ? { transition: 'none' } : false },
      {
        prev: () => h('span', { class: 'slot-prev' }, 'previous'),
        next: () => h('span', { class: 'slot-next' }, 'next'),
      },
    )
    await flushUi()

    expect(m.container.querySelector('.slot-prev')).not.toBeNull()
    expect(m.container.querySelector('.slot-next')).not.toBeNull()

    m.unmount()
  })

  it('opens the selected slide when lightbox is enabled', async () => {
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

    const m = mount(
      PhotoCarousel,
      { photos, lightbox: { transition: 'none' } },
      {
        slide: ({ index, open }: { index: number; open: () => Promise<void> | void }) =>
          h(
            'button',
            {
              class: 'slot-open',
              onClick: open,
            },
            `open ${index}`,
          ),
      },
    )
    await flushUi()
    ;(m.container.querySelectorAll('.slot-open')[1] as HTMLButtonElement).click()
    await flushUi()

    expect(document.body.querySelector('.np-lightbox')).not.toBeNull()
    expect(document.body.querySelector('.np-lightbox__counter')?.textContent).toContain('2 / 4')

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

  it('SSR with lightbox enabled omits the closed modal portal', async () => {
    const app = createSSRApp({
      render: () => h(PhotoCarousel, { photos, lightbox: true }),
    })
    const html = await renderToString(app)
    expect(html).toContain('np-carousel')
    expect(html).not.toContain('teleport start')
    expect(html).not.toContain('role="dialog"')
  })
})
