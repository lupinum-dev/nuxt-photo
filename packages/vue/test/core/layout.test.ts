import { describe, expect, it } from 'vite-plus/test'
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

function referenceRowBreaks(
  photos: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
) {
  const costs = Array.from({ length: photos.length + 1 }, () => Infinity)
  const previous = Array.from({ length: photos.length + 1 }, () => 0)
  costs[0] = 0

  for (let end = 1; end <= photos.length; end++) {
    for (let start = 0; start < end; start++) {
      const count = end - start
      const ratios = photos
        .slice(start, end)
        .reduce((sum, photo) => sum + photo.width / photo.height, 0)
      const width = containerWidth - spacing * (count - 1) - 2 * padding * count
      const height = width / ratios
      if (height <= 0) continue
      const candidate = costs[start]! + (height - targetRowHeight) ** 2 * count
      if (candidate < costs[end]!) {
        costs[end] = candidate
        previous[end] = start
      }
    }
  }

  const path: number[] = []
  for (let cursor = photos.length; cursor > 0; cursor = previous[cursor]!) path.push(cursor)
  path.push(0)
  return path.reverse()
}

function layoutBreaks(groups: ReturnType<typeof computeRowsLayout>) {
  return [0, ...groups.map((group) => group.entries.at(-1)!.index + 1)]
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

  it('keeps exact row DP at least as good as greedy on awkward ratios', () => {
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

    expect(
      rowsBadness(bounded, targetRowHeight) - rowsBadness(greedy, targetRowHeight),
    ).toBeLessThan(1e-8)
  })

  it('keeps a panorama and tall portrait together when that is globally optimal', () => {
    const photos: PhotoItem[] = [
      { id: 'panorama', src: '/panorama.jpg', width: 2000, height: 100 },
      { id: 'portrait', src: '/portrait.jpg', width: 10, height: 100 },
    ]
    const rows = computeRowsLayout({
      photos,
      containerWidth: 1000,
      targetRowHeight: 300,
      spacing: 8,
    })

    expect(layoutBreaks(rows)).toEqual([0, 2])
  })

  it('matches an exhaustive reference across randomized small photo sets', () => {
    let seed = 0x51f15e
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    for (let sample = 0; sample < 40; sample++) {
      const photos: PhotoItem[] = Array.from(
        { length: 2 + Math.floor(random() * 9) },
        (_, index) => ({
          id: `${sample}-${index}`,
          src: `/${sample}-${index}.jpg`,
          width: 40 + Math.round(random() * 3960),
          height: 40 + Math.round(random() * 3960),
        }),
      )
      const containerWidth = 300 + Math.round(random() * 1300)
      const targetRowHeight = 120 + Math.round(random() * 380)
      const spacing = Math.round(random() * 20)
      const padding = Math.round(random() * 10)

      const actual = computeRowsLayout({
        photos,
        containerWidth,
        targetRowHeight,
        spacing,
        padding,
      })
      expect(layoutBreaks(actual)).toEqual(
        referenceRowBreaks(photos, containerWidth, targetRowHeight, spacing, padding),
      )
    }
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

    expect(css).toContain('width < 800px')
    expect(css).toContain('width >= 800px')
    expect(css).toContain('52px')
    expect(css).toContain('padding:8px')
  })

  it('uses exact range boundaries for fractional container breakpoints', () => {
    const css = computeBreakpointStyles({
      photos: createPhotoSet().slice(0, 4),
      breakpoints: [400.5, 800.25],
      spacing: responsive({ 0: 4, 800.25: 20 }),
      targetRowHeight: 220,
      containerName: 'fractional-test',
    })

    expect(css).toContain('width < 800.25px')
    expect(css).toContain('width >= 800.25px')
    expect(css).not.toContain('max-width')
    expect(css).not.toContain('min-width')
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
