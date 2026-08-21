// @vitest-environment jsdom

import EmblaCarousel from 'embla-carousel'
import { describe, expect, it } from 'vite-plus/test'
import {
  validatePhotoCarouselAutoplayOptions,
  validatePhotoCarouselBehavior,
} from '../../src/components/photo-carousel/usePhotoCarouselRuntime'

function setRect(element: HTMLElement, rect: { left: number; width: number; height?: number }) {
  for (const [name, value] of Object.entries({
    offsetLeft: rect.left,
    offsetTop: 0,
    offsetWidth: rect.width,
    offsetHeight: rect.height ?? 400,
  })) {
    Object.defineProperty(element, name, { configurable: true, value })
  }
}

function createCarousel(slideCount: number, slideWidth: number, direction: 'ltr' | 'rtl' = 'ltr') {
  class NoopObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  window.IntersectionObserver = NoopObserver as unknown as typeof window.IntersectionObserver
  window.ResizeObserver = NoopObserver as unknown as typeof window.ResizeObserver
  globalThis.ResizeObserver = NoopObserver as unknown as typeof ResizeObserver
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia

  const root = document.createElement('div')
  const container = document.createElement('div')
  const slides = Array.from({ length: slideCount }, (_, index) => {
    const slide = document.createElement('div')
    setRect(slide, { left: index * slideWidth, width: slideWidth })
    return slide
  })
  setRect(root, { left: 0, width: 600 })
  setRect(container, { left: 0, width: 600 })
  container.append(...slides)
  root.append(container)
  document.body.append(root)

  const api = EmblaCarousel(root, {
    align: 'start',
    containScroll: 'keepSnaps',
    direction,
    slidesToScroll: 1,
    watchResize: false,
    watchSlides: false,
  })
  return { api, root }
}

describe('stable Embla carousel contract', () => {
  it.each([
    [5, 300, 5],
    [5, 200, 5],
    [4, 150, 1],
  ])(
    'uses stable public snaps for %i variable-width slides',
    (slideCount, slideWidth, snapCount) => {
      const { api, root } = createCarousel(slideCount, slideWidth)

      expect(api.scrollSnapList()).toHaveLength(snapCount)
      api.scrollTo(snapCount - 1, true)
      expect(api.selectedScrollSnap()).toBe(snapCount - 1)

      api.destroy()
      root.remove()
    },
  )

  it('accepts only the direct public behavior props', () => {
    expect(() => validatePhotoCarouselBehavior({ loop: true, dragFree: true })).not.toThrow()
    expect(() => validatePhotoCarouselBehavior({ direction: 'sideways' as 'ltr' })).toThrow(
      /direction/,
    )
  })

  it('uses Embla RTL navigation semantics', () => {
    const { api, root } = createCarousel(5, 300, 'rtl')

    expect(api.selectedScrollSnap()).toBe(0)
    api.scrollNext(true)
    expect(api.selectedScrollSnap()).toBe(1)
    api.scrollPrev(true)
    expect(api.selectedScrollSnap()).toBe(0)

    api.destroy()
    root.remove()
  })

  it('rejects unsafe autoplay values before the plugin sees them', () => {
    for (const delayMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => validatePhotoCarouselAutoplayOptions({ delayMs })).toThrow(
        /positive finite number/,
      )
    }
    expect(() =>
      validatePhotoCarouselAutoplayOptions({
        delayMs: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ).not.toThrow()
  })
})
