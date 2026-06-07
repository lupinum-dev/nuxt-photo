// @vitest-environment jsdom

import EmblaCarousel from 'embla-carousel'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readEmblaSnapStateUnsafe } from '../../src/components/internal/emblaSnapState'

function makeApi(options: {
  slidesBySnap?: unknown
  snapBySlide?: unknown
  snapList?: number[]
  throws?: boolean
}) {
  return {
    snapList: vi.fn(() => options.snapList ?? []),
    internalEngine: vi.fn(() => {
      if (options.throws) throw new Error('internal shape changed')
      return {
        scrollSnapList: {
          slidesBySnap: options.slidesBySnap,
          snapBySlide: options.snapBySlide,
        },
      }
    }),
  } as any
}

describe('readEmblaSnapStateUnsafe', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false
        },
      })),
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('reads usable Embla grouped snap state', () => {
    const api = makeApi({
      slidesBySnap: [
        [0, 1],
        [2, 3],
      ],
      snapBySlide: { 0: 0, 1: 0, 2: 1, 3: 1 },
      snapList: [0, 100],
    })

    expect(readEmblaSnapStateUnsafe(api, 4, 2)).toEqual({
      slidesBySnap: [
        [0, 1],
        [2, 3],
      ],
      snapBySlide: { 0: 0, 1: 0, 2: 1, 3: 1 },
      snapTotal: 2,
    })
  })

  it('falls back to slidesToScroll groups when Embla reports one unusable snap', () => {
    const api = makeApi({
      slidesBySnap: [[0, 1, 2, 3]],
      snapBySlide: { 0: 0, 1: 0, 2: 0, 3: 0 },
      snapList: [0],
    })

    expect(readEmblaSnapStateUnsafe(api, 4, 2)).toEqual({
      slidesBySnap: [
        [0, 1],
        [2, 3],
      ],
      snapBySlide: { 0: 0, 1: 0, 2: 1, 3: 1 },
      snapTotal: 2,
    })
  })

  it('falls back when Embla internals are missing or throw', () => {
    const api = makeApi({ throws: true, snapList: [] })

    expect(readEmblaSnapStateUnsafe(api, 3, 2)).toEqual({
      slidesBySnap: [[0, 1], [2]],
      snapBySlide: { 0: 0, 1: 0, 2: 1 },
      snapTotal: 2,
    })
  })

  it('reads grouped snap state from a real Embla carousel', () => {
    const viewport = document.createElement('div')
    const container = document.createElement('div')
    viewport.appendChild(container)
    document.body.appendChild(viewport)

    for (let i = 0; i < 4; i++) {
      const slide = document.createElement('div')
      Object.defineProperty(slide, 'offsetWidth', { value: 100 })
      Object.defineProperty(slide, 'offsetHeight', { value: 100 })
      container.appendChild(slide)
    }

    Object.defineProperty(viewport, 'offsetWidth', { value: 200 })
    Object.defineProperty(container, 'offsetWidth', { value: 400 })

    const api = EmblaCarousel(viewport, {
      containScroll: false,
      slidesToScroll: 2,
    })

    try {
      const state = readEmblaSnapStateUnsafe(api, 4, 2)
      expect(state.slidesBySnap).toEqual([
        [0, 1],
        [2, 3],
      ])
      expect(state.snapBySlide).toEqual({ 0: 0, 1: 0, 2: 1, 3: 1 })
      expect(state.snapTotal).toBe(2)
    } finally {
      api.destroy()
    }
  })
})
