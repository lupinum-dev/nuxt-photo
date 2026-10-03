import { describe, expect, it } from 'vite-plus/test'
import type { PhotoItem } from '../../src/core/types'
import { computeColumnsLayout } from '../../src/core/layout/columns'
import { computeRowsLayout } from '../../src/core/layout/rows'
import { computeMasonryLayout } from '../../src/core/layout/masonry'

function random(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function photos(count: number, next: () => number): PhotoItem[] {
  return Array.from({ length: count }, (_, index) => {
    const choice = next()
    const aspect = choice < 0.05 ? 1 / 20 : choice < 0.1 ? 20 : 0.5 + next() * 2
    return { id: String(index), src: `/${index}.jpg`, width: aspect * 1000, height: 1000 }
  })
}

describe('layout scaling', () => {
  // A cubic column search or a full photo rescan per row freezes large albums.
  it.each([
    ['rows', computeRowsLayout],
    ['columns', computeColumnsLayout],
    ['masonry', computeMasonryLayout],
  ] as const)('%s lays out 5,000 photos within 250 ms', (_name, layout) => {
    const options = { photos: photos(5000, random(0xabcdef)), containerWidth: 1200, columns: 3 }
    layout(options)
    const start = performance.now()
    const result = layout(options)
    const elapsed = performance.now() - start
    expect(result.flatMap((group) => group.entries)).toHaveLength(5000)
    expect(elapsed).toBeLessThan(250)
  })
})
