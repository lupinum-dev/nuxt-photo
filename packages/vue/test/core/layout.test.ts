import { describe, expect, it, vi } from 'vite-plus/test'
import {
  computeBreakpointStyles,
  computeColumnsLayout,
  computeMasonryLayout,
  computeRowsLayout,
  responsive,
  type PhotoItem,
} from '../../src/core/index'
import { createPhotoSet } from '@test-fixtures/photos'

function totalGroupHeight(group: { entries: Array<{ height: number }> }, spacing: number) {
  return (
    group.entries.reduce((sum, entry) => sum + entry.height, 0) +
    spacing * Math.max(0, group.entries.length - 1)
  )
}

function rowsBadness(groups: ReturnType<typeof computeRowsLayout>, targetRowHeight: number) {
  return groups.reduce(
    (sum, group) => sum + (group.entries[0]!.height - targetRowHeight) ** 2 * group.entries.length,
    0,
  )
}

function greedyRows(
  photos: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
) {
  const groups: ReturnType<typeof computeRowsLayout> = []
  let start = 0

  while (start < photos.length) {
    let end = start + 1
    let bestEnd = end
    let bestDelta = Infinity

    while (end <= photos.length) {
      const row = photos.slice(start, end)
      const ratioSum = row.reduce((sum, photo) => sum + photo.width / photo.height, 0)
      const height = (containerWidth - spacing * (row.length - 1)) / ratioSum
      const delta = Math.abs(height - targetRowHeight)
      if (delta <= bestDelta) {
        bestDelta = delta
        bestEnd = end
        end++
        continue
      }
      break
    }

    const row = photos.slice(start, bestEnd)
    const ratioSum = row.reduce((sum, photo) => sum + photo.width / photo.height, 0)
    const height = (containerWidth - spacing * (row.length - 1)) / ratioSum
    groups.push({
      type: 'row',
      index: groups.length,
      entries: row.map((photo, offset) => ({
        index: start + offset,
        photo,
        width: height * (photo.width / photo.height),
        height,
        positionIndex: offset,
        itemsCount: row.length,
      })),
    })
    start = bestEnd
  }

  return groups
}

function parseItemWidths(css: string) {
  const widths = new Map<number, { gaps: number; divisor: number }>()
  const pattern = /\.np-item-(\d+)\{[^}]*width:calc\(\(100% - ([\d.]+)px\) \/ ([\d.]+)\)/g
  for (const match of css.matchAll(pattern)) {
    widths.set(Number(match[1]), {
      gaps: Number(match[2]),
      divisor: Number(match[3]),
    })
  }
  return widths
}

describe('layout algorithms', () => {
  it('justifies rows to the container width and returns no invalid entries', () => {
    const containerWidth = 1000
    const spacing = 8
    const rows = computeRowsLayout({
      photos: createPhotoSet(),
      containerWidth,
      spacing,
      targetRowHeight: 280,
    })

    expect(computeRowsLayout({ photos: [], containerWidth })).toEqual([])
    expect(rows.length).toBeGreaterThan(0)

    for (const row of rows) {
      const totalWidth =
        row.entries.reduce((sum, entry) => sum + entry.width, 0) +
        spacing * (row.entries.length - 1)
      expect(totalWidth).toBeCloseTo(containerWidth, 4)
      expect(row.entries.every((entry) => entry.width > 0 && entry.height > 0)).toBe(true)
    }
  })

  it('returns no rows when padding makes positive row geometry impossible', () => {
    expect(
      computeRowsLayout({
        photos: createPhotoSet().slice(0, 3),
        containerWidth: 40,
        padding: 80,
      }),
    ).toEqual([])
  })

  it('keeps bounded row DP at least as good as greedy on awkward ratios', () => {
    const photos: PhotoItem[] = [
      { id: 'wide-1', src: '/1.jpg', width: 1800, height: 700 },
      { id: 'tall-1', src: '/2.jpg', width: 650, height: 1300 },
      { id: 'wide-2', src: '/3.jpg', width: 1700, height: 760 },
      { id: 'square', src: '/4.jpg', width: 1000, height: 1000 },
      { id: 'tall-2', src: '/5.jpg', width: 700, height: 1400 },
      { id: 'wide-3', src: '/6.jpg', width: 1900, height: 800 },
      { id: 'mid', src: '/7.jpg', width: 1200, height: 900 },
    ]
    const containerWidth = 960
    const spacing = 10
    const targetRowHeight = 260

    const bounded = computeRowsLayout({
      photos,
      containerWidth,
      spacing,
      targetRowHeight,
    })
    const greedy = greedyRows(photos, containerWidth, targetRowHeight, spacing)

    expect(rowsBadness(bounded, targetRowHeight)).toBeLessThanOrEqual(
      rowsBadness(greedy, targetRowHeight),
    )
  })

  it('emits container-query widths that match row layout math inside a stable span', () => {
    const photos: PhotoItem[] = [
      { id: 'a', src: '/a.jpg', width: 1000, height: 1000 },
      { id: 'b', src: '/b.jpg', width: 1000, height: 1000 },
      { id: 'c', src: '/c.jpg', width: 1000, height: 1000 },
    ]
    const css = computeBreakpointStyles({
      photos,
      breakpoints: [600, 700],
      spacing: 10,
      padding: 2,
      targetRowHeight: 220,
      containerName: 'test',
    })
    const widths = parseItemWidths(css)

    for (const sampleWidth of [650, 760]) {
      const layout = computeRowsLayout({
        photos,
        containerWidth: sampleWidth,
        spacing: 10,
        padding: 2,
        targetRowHeight: 220,
      })
      for (const entry of layout.flatMap((group) => group.entries)) {
        const rule = widths.get(entry.index)!
        const cssWidth = (sampleWidth - rule.gaps) / rule.divisor
        expect(cssWidth).toBeCloseTo(entry.width, 3)
      }
    }
  })

  it('does not collapse container-query spans across responsive parameter changes', () => {
    const photos = createPhotoSet().slice(0, 4)
    const css = computeBreakpointStyles({
      photos,
      breakpoints: [400, 800],
      spacing: responsive({ 0: 4, 800: 20 }),
      padding: responsive({ 0: 0, 800: 8 }),
      targetRowHeight: 220,
      containerName: 'responsive-test',
    })

    expect(css).toContain('max-width: 799px')
    expect(css).toContain('min-width: 800px')
    expect(css).toContain('52px')
    expect(css).toContain('padding:8px')
  })

  it('keeps generated container-query widths equal to solver math across randomized sets', () => {
    // Deterministic LCG so failures reproduce.
    let seed = 0x2f6e2b1
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }

    for (let setIndex = 0; setIndex < 12; setIndex++) {
      const count = 3 + Math.floor(random() * 10)
      const photos: PhotoItem[] = Array.from({ length: count }, (_, index) => ({
        id: `rand-${setIndex}-${index}`,
        src: `/r${index}.jpg`,
        width: Math.round(300 + random() * 2400),
        height: Math.round(200 + random() * 2000),
      }))
      const spacing = Math.floor(random() * 16)
      const padding = Math.floor(random() * 8)
      const targetRowHeight = 180 + Math.floor(random() * 220)
      const containerWidth = 320 + Math.floor(random() * 1200)

      // One breakpoint samples the CSS exactly at containerWidth, so every
      // emitted rule must reproduce the solver's geometry at that width.
      const css = computeBreakpointStyles({
        photos,
        breakpoints: [containerWidth],
        spacing,
        padding,
        targetRowHeight,
        containerName: 'parity-test',
      })
      const widths = parseItemWidths(css)
      expect(widths.size).toBe(count)

      const layout = computeRowsLayout({
        photos,
        containerWidth,
        spacing,
        padding,
        targetRowHeight,
      })
      for (const group of layout) {
        for (const entry of group.entries) {
          const rule = widths.get(entry.index)!
          const cssWidth = (containerWidth - rule.gaps) / rule.divisor
          // The emitted divisor is rounded to 5 decimals, so parity is
          // asserted relatively rather than absolutely.
          expect(Math.abs(cssWidth - entry.width) / entry.width).toBeLessThan(1e-4)
        }
      }
    }
  })

  it('lays out pathological aspect ratios without degenerate rows', () => {
    // One extreme tall-skinnie plus one extreme panorama in a normal mix —
    // the historical O(N²) window-bound trigger.
    const photos: PhotoItem[] = [
      ...createPhotoSet(),
      { id: 'skinnie', src: '/s.jpg', width: 60, height: 2000 },
      { id: 'pano', src: '/p.jpg', width: 4000, height: 500 },
    ]
    const rows = computeRowsLayout({
      photos,
      containerWidth: 1000,
      spacing: 8,
      targetRowHeight: 260,
    })

    expect(rows.length).toBeGreaterThan(1)
    for (const row of rows) {
      for (const entry of row.entries) {
        expect(entry.width).toBeGreaterThan(0)
        expect(entry.height).toBeGreaterThan(0)
        // No row may be stretched past a sane multiple of the target height.
        expect(entry.height).toBeLessThan(260 * 12)
      }
    }
    const totalWidth = rows.reduce(
      (sum, row) =>
        sum +
        row.entries.reduce((acc, entry) => acc + entry.width, 0) +
        8 * (row.entries.length - 1),
      0,
    )
    expect(totalWidth).toBeCloseTo(1000 * rows.length, 0)
  })

  it('covers fractional breakpoints without leaving uncovered windows', () => {
    const photos = createPhotoSet().slice(0, 4)
    const css = computeBreakpointStyles({
      photos,
      breakpoints: [400.5, 800.25],
      spacing: 10,
      padding: 2,
      targetRowHeight: 220,
      containerName: 'fractional-test',
    })

    // Integer breakpoints keep the clean n-1 form; fractional ones subtract
    // inside calc so no width between spans is left unmatched.
    expect(css).toContain('max-width: calc(800.25px - 0.01px)')
    expect(css).toContain('min-width: 800.25px')
    expect(css).not.toContain('799px')
    expect(css).not.toContain('799.25px')
  })

  it('warns when every breakpoint produces an empty layout', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const photos = createPhotoSet().slice(0, 3)
    const css = computeBreakpointStyles({
      photos,
      breakpoints: [320],
      spacing: 8,
      padding: 500,
      targetRowHeight: 220,
      containerName: 'empty-test',
    })

    expect(css).toBe('')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('every breakpoint produced an empty rows layout'),
    )
    warn.mockRestore()
  })

  it('balances columns while keeping per-column order and valid dimensions', () => {
    const spacing = 8
    const columns = computeColumnsLayout({
      photos: createPhotoSet(),
      containerWidth: 1000,
      spacing,
      columns: 3,
    })

    expect(columns).toHaveLength(3)

    for (const column of columns) {
      expect(column.entries.every((entry) => entry.width > 0 && entry.height > 0)).toBe(true)
      expect(column.entries.map((entry) => entry.index)).toEqual(
        column.entries.map((entry) => entry.index).sort((a, b) => a - b),
      )
    }

    const heights = columns.map((column) => totalGroupHeight(column, spacing))
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(60)
  })

  it('normalizes unsafe column layout inputs to safe output', () => {
    const photos = createPhotoSet().slice(0, 4)

    const fractional = computeColumnsLayout({
      photos,
      containerWidth: 800,
      columns: 2.8,
    })
    expect(fractional).toHaveLength(2)

    expect(
      computeColumnsLayout({
        photos,
        containerWidth: Number.NaN,
        columns: 3,
      }),
    ).toEqual([])

    expect(
      computeColumnsLayout({
        photos,
        containerWidth: 20,
        columns: Number.NaN,
        padding: 100,
      }),
    ).toEqual([])
  })

  it('uses only non-empty columns when fewer photos than requested columns exist', () => {
    const columns = computeColumnsLayout({
      photos: createPhotoSet().slice(0, 2),
      containerWidth: 800,
      columns: 4,
    })

    expect(columns).toHaveLength(2)
    expect(columns.map((column) => column.entries.map((entry) => entry.index))).toEqual([[0], [1]])
  })

  it('rejects invalid photo dimensions instead of inventing fallback geometry', () => {
    const invalidDimensions = [0, -1, Number.NaN, Infinity]

    for (const dimension of invalidDimensions) {
      const invalidWidth = [
        {
          ...createPhotoSet()[0]!,
          id: `invalid-width-${dimension}`,
          width: dimension,
        },
      ]
      const invalidHeight = [
        {
          ...createPhotoSet()[0]!,
          id: `invalid-height-${dimension}`,
          height: dimension,
        },
      ]

      for (const invalidPhotos of [invalidWidth, invalidHeight]) {
        expect(() =>
          computeRowsLayout({
            photos: invalidPhotos,
            containerWidth: 1000,
          }),
        ).toThrow('invalid dimensions')

        expect(() =>
          computeColumnsLayout({
            photos: invalidPhotos,
            containerWidth: 1000,
          }),
        ).toThrow('invalid dimensions')

        expect(() =>
          computeMasonryLayout({
            photos: invalidPhotos,
            containerWidth: 1000,
          }),
        ).toThrow('invalid dimensions')
      }
    }
  })

  it('keeps masonry assignment stable and ordered', () => {
    const photos = createPhotoSet()
    const containerWidth = 1000
    const columnsCount = 3
    const spacing = 8

    const masonry = computeMasonryLayout({
      photos,
      containerWidth,
      spacing,
      columns: columnsCount,
    })

    for (const column of masonry) {
      expect(column.entries.every((entry) => entry.width > 0 && entry.height > 0)).toBe(true)
      expect(column.entries.map((entry) => entry.index)).toEqual(
        column.entries.map((entry) => entry.index).sort((a, b) => a - b),
      )
    }

    expect(masonry.map((column) => column.entries.map((entry) => entry.index))).toEqual([
      [0, 3, 6, 9, 11],
      [1, 5, 8, 10],
      [2, 4, 7],
    ])
  })

  it('normalizes unsafe masonry layout inputs to safe output', () => {
    const photos = createPhotoSet().slice(0, 4)

    const fractional = computeMasonryLayout({
      photos,
      containerWidth: 800,
      columns: 2.8,
    })
    expect(fractional).toHaveLength(2)

    expect(
      computeMasonryLayout({
        photos,
        containerWidth: Number.NaN,
        columns: 3,
      }),
    ).toEqual([])

    expect(
      computeMasonryLayout({
        photos,
        containerWidth: 20,
        columns: Number.NaN,
        padding: 100,
      }),
    ).toEqual([])
  })
})
