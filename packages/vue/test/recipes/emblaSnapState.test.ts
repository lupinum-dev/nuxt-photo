// @vitest-environment jsdom

import EmblaCarousel from 'embla-carousel'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readEmblaSnapStateUnsafe } from '../../src/integrations/embla/snapState'

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

  function createRealEmbla(
    photoCount: number,
    options: Record<string, unknown>,
  ) {
    const viewport = document.createElement('div')
    const container = document.createElement('div')
    viewport.appendChild(container)
    document.body.appendChild(viewport)

    for (let i = 0; i < photoCount; i++) {
      const slide = document.createElement('div')
      Object.defineProperty(slide, 'offsetWidth', { value: 100 })
      Object.defineProperty(slide, 'offsetHeight', { value: 100 })
      container.appendChild(slide)
    }

    Object.defineProperty(viewport, 'offsetWidth', { value: 200 })
    Object.defineProperty(container, 'offsetWidth', { value: photoCount * 100 })

    return EmblaCarousel(viewport, {
      containScroll: false,
      ...options,
    })
  }

  it('reads real Embla snap state for slidesToScroll: 1', () => {
    const api = createRealEmbla(4, { slidesToScroll: 1 })

    try {
      const state = readEmblaSnapStateUnsafe(api, 4, 1)
      expect(state.slidesBySnap).toEqual([[0], [1], [2], [3]])
      expect(state.snapBySlide).toEqual({ 0: 0, 1: 1, 2: 2, 3: 3 })
      expect(state.snapTotal).toBe(4)
    } finally {
      api.destroy()
    }
  })

  it('reads real Embla grouped snap state for slidesToScroll: 2', () => {
    const api = createRealEmbla(4, { slidesToScroll: 2 })

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

  it('keeps grouped snap state available when loop is enabled', () => {
    const api = createRealEmbla(4, { loop: true, slidesToScroll: 2 })

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

  it('handles photo counts smaller than slidesToScroll', () => {
    const api = createRealEmbla(2, { slidesToScroll: 3 })

    try {
      const state = readEmblaSnapStateUnsafe(api, 2, 3)
      expect(state.slidesBySnap).toEqual([[0, 1]])
      expect(state.snapBySlide).toEqual({ 0: 0, 1: 0 })
      expect(state.snapTotal).toBe(1)
    } finally {
      api.destroy()
    }
  })

  it('updates grouped snap state after Embla reInit', () => {
    const api = createRealEmbla(4, { slidesToScroll: 1 })

    try {
      expect(readEmblaSnapStateUnsafe(api, 4, 1).slidesBySnap).toEqual([
        [0],
        [1],
        [2],
        [3],
      ])

      api.reInit({ slidesToScroll: 2 })

      expect(readEmblaSnapStateUnsafe(api, 4, 2).slidesBySnap).toEqual([
        [0, 1],
        [2, 3],
      ])
    } finally {
      api.destroy()
    }
  })
})
