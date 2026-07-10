// @vitest-environment jsdom

import EmblaCarousel from 'embla-carousel'
import { describe, expect, it } from 'vitest'
import { readEmblaSnapModel } from '../../src/integrations/embla/snapModel'
import {
  validatePhotoCarouselAutoplayOptions,
  validatePhotoCarouselOptions,
} from '../../src/components/photo-carousel/usePhotoCarouselRuntime'

function setRect(
  element: HTMLElement,
  rect: { left: number; width: number; height?: number },
) {
  for (const [name, value] of Object.entries({
    offsetLeft: rect.left,
    offsetTop: 0,
    offsetWidth: rect.width,
    offsetHeight: rect.height ?? 400,
  })) {
    Object.defineProperty(element, name, { configurable: true, value })
  }
}

function createCarousel(
  slideCount: number,
  slideWidth: number,
  groupSize: number,
) {
  class NoopObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  window.IntersectionObserver =
    NoopObserver as unknown as typeof window.IntersectionObserver
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
    containScroll: 'trimSnaps',
    slidesToScroll: groupSize,
    resize: false,
    slideChanges: false,
  })
  return { api, root }
}

describe('Embla snap model', () => {
  it.each([
    [5, 300, 1, [[0], [1], [2], [3, 4]]],
    [5, 200, 1, [[0], [1], [2, 3, 4]]],
    [
      5,
      200,
      2,
      [
        [0, 1],
        [2, 3, 4],
      ],
    ],
    [4, 150, 2, [[0, 1, 2, 3]]],
  ])(
    'uses real trimmed groups for %i slides at %ipx grouped by %i',
    (slideCount, slideWidth, groupSize, expectedGroups) => {
      const { api, root } = createCarousel(slideCount, slideWidth, groupSize)
      const model = readEmblaSnapModel(api)

      expect(model.slidesBySnap).toEqual(expectedGroups)
      expect(model.snapBySlide).toEqual(
        Object.fromEntries(
          expectedGroups.flatMap((slides, snap) =>
            slides.map((slide) => [slide, snap]),
          ),
        ),
      )

      api.destroy()
      root.remove()
    },
  )

  it('rejects invalid public grouping values before Embla sees them', () => {
    for (const slidesToScroll of [0, -1, 0.5, Number.NaN]) {
      expect(() => validatePhotoCarouselOptions({ slidesToScroll })).toThrow(
        /positive integer/,
      )
    }
    expect(() =>
      validatePhotoCarouselOptions({ slidesToScroll: 2 }),
    ).not.toThrow()
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
