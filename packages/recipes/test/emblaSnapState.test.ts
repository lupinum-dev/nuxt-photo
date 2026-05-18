import { describe, expect, it, vi } from 'vitest'
import { readEmblaSnapStateUnsafe } from '../src/components/internal/emblaSnapState'

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
})
