import { describe, expect, it } from 'vite-plus/test'
import { computeAccordionGrow } from '../../src/core/layout/accordion'
import { computeBentoLayout } from '../../src/core/layout/bento'
import { computeMosaicLayout } from '../../src/core/layout/mosaic'
import type { ResolvedPhotoItem as PhotoItem } from '../../src/core/types'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RATIOS = [
  [3, 2, 26],
  [2, 3, 16],
  [4, 3, 12],
  [3, 4, 8],
  [16, 9, 12],
  [1, 1, 10],
  [4, 5, 8],
  [9, 16, 4],
  [21, 9, 4],
] as const
function makePhotos(count: number, seed: number): PhotoItem[] {
  const rnd = mulberry32(seed)
  return Array.from({ length: count }, (_, index) => {
    let x = rnd() * 100
    let pick: (typeof RATIOS)[number] = RATIOS[0]
    for (const ratio of RATIOS) {
      x -= ratio[2]
      if (x < 0) {
        pick = ratio
        break
      }
    }
    // Match the prototype's three decorative random draws between photos.
    rnd()
    rnd()
    rnd()
    return {
      id: `${seed}:${index}`,
      src: '/photo.jpg',
      width: pick[0] * 100,
      height: pick[1] * 100,
    }
  })
}

const seeds = Array.from({ length: 20 }, (_, i) => i + 1)
const counts = Array.from({ length: 40 }, (_, i) => i + 1)

describe('bento', () => {
  it.each([1, 2, 3, 4, 5, 6])(
    'covers the grid once, with bounded moves and deterministic reading order (%i columns)',
    (columns) => {
      for (const count of counts)
        for (const seed of seeds) {
          const photos = makePhotos(count, seed)
          const options = { photos, columns }
          const result = computeBentoLayout(options)
          const label = `columns=${columns}, count=${count}, seed=${seed}`
          expect(result, label).toEqual(computeBentoLayout(options))
          expect(
            result.tiles.map((t) => t.index).sort((a, b) => a - b),
            label,
          ).toEqual(photos.map((_, i) => i))
          const cells = Array<number>(result.rows * columns).fill(0)
          let anchor = -1
          result.tiles.forEach((tile, position) => {
            expect(Math.abs(position - tile.index), label).toBeLessThanOrEqual(4)
            expect(tile.row * columns + tile.column, label).toBeGreaterThan(anchor)
            anchor = tile.row * columns + tile.column
            expect(tile.column, label).toBeGreaterThanOrEqual(0)
            expect(tile.row, label).toBeGreaterThanOrEqual(0)
            expect(tile.columnSpan, label).toBeGreaterThan(0)
            expect(tile.rowSpan, label).toBeGreaterThan(0)
            expect(tile.column + tile.columnSpan, label).toBeLessThanOrEqual(columns)
            expect(tile.row + tile.rowSpan, label).toBeLessThanOrEqual(result.rows)
            for (let r = tile.row; r < tile.row + tile.rowSpan; r++)
              for (let c = tile.column; c < tile.column + tile.columnSpan; c++)
                cells[r * columns + c]!++
          })
          expect(
            cells.every((n) => n === 1),
            label,
          ).toBe(true)
        }
    },
    60_000,
  )

  it.each([1, 2, 3, 4, 5, 6])(
    'keeps exact array order with maxShift zero (%i columns)',
    (columns) => {
      for (const count of counts)
        for (const seed of seeds) {
          const photos = makePhotos(count, seed)
          expect(
            computeBentoLayout({ photos, columns, maxShift: 0 }).tiles.map((t) => t.index),
          ).toEqual(photos.map((_, i) => i))
        }
    },
    60_000,
  )

  it.each([3, 4, 5, 6])(
    'uses a custom featured photo and evaluates it only once (%i columns)',
    (columns) => {
      const photos = makePhotos(20, 7)
      const calls: number[] = []
      const { tiles } = computeBentoLayout({
        photos,
        columns,
        featured: (photo, index) => {
          calls.push(index)
          return photo.id === photos[2]!.id
        },
      })
      const featured = tiles.find((t) => t.index === 2)!
      expect(featured.columnSpan * featured.rowSpan).toBeGreaterThanOrEqual(4)
      expect(calls).toEqual(photos.map((_, i) => i))
    },
  )
})

describe('mosaic', () => {
  it.each(Array.from({ length: 12 }, (_, i) => i + 1))(
    'fills one frame without overlap and shows the first max photos (%i photos)',
    (count) => {
      for (let max = 1; max <= 9; max++)
        for (const seed of seeds) {
          const photos = makePhotos(count, seed)
          for (const input of [photos, photos.slice().reverse()]) {
            const options = { photos: input, max, aspectRatio: 16 / 9 }
            const result = computeMosaicLayout(options)
            const label = `count=${count}, max=${max}, seed=${seed}`
            expect(result, label).toEqual(computeMosaicLayout(options))
            expect(result.tiles.length, label).toBe(Math.min(max, count))
            expect(result.hidden, label).toBe(Math.max(0, count - max))
            expect(result.tiles.map((t) => input[t.index]!.id).sort(), label).toEqual(
              input
                .slice(0, max)
                .map((p) => p.id)
                .sort(),
            )
            expect(
              result.tiles.reduce((sum, t) => sum + t.width * t.height, 0),
              label,
            ).toBeCloseTo(1, 9)
            result.tiles.forEach((tile, i) => {
              expect(tile.x, label).toBeGreaterThanOrEqual(0)
              expect(tile.y, label).toBeGreaterThanOrEqual(0)
              expect(tile.width, label).toBeGreaterThan(0)
              expect(tile.height, label).toBeGreaterThan(0)
              expect(tile.x + tile.width, label).toBeLessThanOrEqual(1 + 1e-12)
              expect(tile.y + tile.height, label).toBeLessThanOrEqual(1 + 1e-12)
              const previous = result.tiles[i - 1]
              if (previous)
                expect(
                  tile.y > previous.y || (tile.y === previous.y && tile.x >= previous.x),
                  label,
                ).toBe(true)
              for (const other of result.tiles.slice(i + 1)) {
                const overlapW =
                  Math.min(tile.x + tile.width, other.x + other.width) - Math.max(tile.x, other.x)
                const overlapH =
                  Math.min(tile.y + tile.height, other.y + other.height) - Math.max(tile.y, other.y)
                expect(overlapW <= 1e-12 || overlapH <= 1e-12, label).toBe(true)
              }
            })
          }
        }
    },
    60_000,
  )
})

describe('layout input guards', () => {
  it('returns empty layouts and an exact single-photo mosaic', () => {
    expect(computeBentoLayout({ photos: [], columns: 4 })).toEqual({ tiles: [], rows: 0 })
    expect(computeMosaicLayout({ photos: [] })).toEqual({ tiles: [], hidden: 0 })
    expect(computeMosaicLayout({ photos: makePhotos(1, 1) })).toEqual({
      tiles: [{ index: 0, x: 0, y: 0, width: 1, height: 1 }],
      hidden: 0,
    })
  })
  it.each([0, -1, NaN, Infinity])(
    'rejects invalid photo dimensions even outside the shown subset (%s)',
    (width) => {
      const photos = [...makePhotos(1, 1), { ...makePhotos(1, 2)[0]!, width }]
      expect(() => computeBentoLayout({ photos, columns: 4 })).toThrow('invalid dimensions')
      expect(() => computeMosaicLayout({ photos, max: 1 })).toThrow('invalid dimensions')
    },
  )
  it.each([0, -1, NaN, Infinity])('defaults invalid aspect ratios (%s)', (aspectRatio) => {
    const photos = makePhotos(10, 8)
    expect(computeBentoLayout({ photos, columns: 4, aspectRatio })).toEqual(
      computeBentoLayout({ photos, columns: 4 }),
    )
    expect(computeMosaicLayout({ photos, aspectRatio })).toEqual(computeMosaicLayout({ photos }))
  })
  it.each([
    { columns: 0, normalized: 1, maxShift: -1, shift: 0, max: 0, shown: 1 },
    { columns: 3.9, normalized: 3, maxShift: 2.9, shift: 2, max: 3.9, shown: 3 },
    { columns: NaN, normalized: 3, maxShift: NaN, shift: 4, max: Infinity, shown: 5 },
  ])(
    'normalizes counts and move limits ($columns, $maxShift, $max)',
    ({ columns, normalized, maxShift, shift, max, shown }) => {
      const photos = makePhotos(10, 8)
      expect(computeBentoLayout({ photos, columns, maxShift })).toEqual(
        computeBentoLayout({ photos, columns: normalized, maxShift: shift }),
      )
      expect(computeMosaicLayout({ photos, max })).toEqual(
        computeMosaicLayout({ photos, max: shown }),
      )
    },
  )
})

describe('accordion', () => {
  it.each([
    { photo: 3 / 2, frame: 4 / 3, count: 1, grow: 1 },
    { photo: 21 / 9, frame: 4 / 3, count: 5, grow: (4 * 0.62) / 0.38 },
    { photo: 1 / 10, frame: 4 / 3, count: 5, grow: 1 },
    { photo: 1, frame: 2, count: 5, grow: 4 },
    { photo: NaN, frame: 2, count: 5, grow: 1 },
    { photo: 1, frame: Infinity, count: 5, grow: 1 },
    { photo: 1, frame: 2, count: Infinity, grow: 1 },
    { photo: 1, frame: 0, count: 5, grow: 1 },
  ])('computes bounded grow ($photo / $frame, $count slices)', ({ photo, frame, count, grow }) => {
    expect(computeAccordionGrow(photo, frame, count)).toBeCloseTo(grow, 12)
  })
})
