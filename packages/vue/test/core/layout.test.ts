import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test'
import {
  computeColumnsLayout,
  computeMasonryLayout,
  computeRowsLayout,
  computeRowsPlan,
  responsive,
  type ResolvedPhotoItem as PhotoItem,
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

describe('layout algorithms', () => {
  it('preserves consumer metadata through every layout solver', () => {
    const photos: PhotoItem<{ credit: string }>[] = [
      { ...createPhotoSet()[0]!, meta: { credit: 'Lupinum' } },
    ]
    const options = { photos, containerWidth: 800 }
    const layouts = [
      computeRowsLayout(options),
      computeColumnsLayout(options),
      computeMasonryLayout(options),
    ]

    for (const layout of layouts) {
      expectTypeOf(layout[0]!.entries[0]!.photo.meta?.credit).toEqualTypeOf<string | undefined>()
      expect(layout[0]!.entries[0]!.photo.meta?.credit).toBe('Lupinum')
    }
  })

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

describe('rows plan', () => {
  const squares = (count: number): PhotoItem[] =>
    Array.from({ length: count }, (_, index) => ({
      id: `s${index}`,
      src: `/s${index}.jpg`,
      width: 100,
      height: 100,
    }))
  /** Start of each container query span and the items whose line break it shows. */
  const spans = (plan: ReturnType<typeof computeRowsPlan>) =>
    plan.css.split('\n').map((rule, index) => ({
      start: plan.widths[index]!.start,
      breaks: [...rule.matchAll(/\.np-br-(\d+)/g)].map((match) => Number(match[1])),
    }))

  it.each([
    {
      name: 'one break per row end at each planned width',
      photos: 4,
      breakpoints: [100, 200, 400],
      expected: [
        { start: 0, breaks: [0, 1, 2] },
        { start: 200, breaks: [1] },
        { start: 400, breaks: [] },
      ],
    },
    {
      name: 'neighbouring widths with equal rows merge',
      photos: 4,
      breakpoints: [200, 250],
      expected: [{ start: 0, breaks: [1] }],
    },
    {
      name: 'a single photo never needs a break',
      photos: 1,
      breakpoints: [100, 400],
      expected: [{ start: 0, breaks: [] }],
    },
  ])('$name', ({ photos, breakpoints, expected }) => {
    const plan = computeRowsPlan({
      photos: squares(photos),
      containerName: 'album',
      breakpoints,
      spacing: 0,
      targetRowHeight: 100,
    })
    expect(spans(plan)).toEqual(expected)
  })

  it('plans the default ladder when there are no breakpoints', () => {
    const plan = computeRowsPlan({ photos: squares(4), containerName: 'album' })
    expect(spans(plan)).toEqual([
      { start: 0, breaks: [0, 1, 2] },
      { start: 480, breaks: [1] },
      { start: 1024, breaks: [] },
    ])
    expect(plan.css).toContain('@container album (width < 480px)')
  })

  it('evaluates function options at every planned width', () => {
    const plan = computeRowsPlan({
      photos: squares(4),
      containerName: 'album',
      breakpoints: [200, 400],
      spacing: (width) => (width < 300 ? 0 : 10),
      padding: responsive({ 0: 0, 400: 2 }),
      targetRowHeight: 100,
    })
    expect(plan.css.split('\n')).toEqual([
      '@container album (width < 400px){.np-album__frame{--np-gap:0px;--np-padding:0px}.np-br-1{display:block}}',
      '@container album (width >= 400px){.np-album__frame{--np-gap:10px;--np-padding:2px}}',
    ])
    // Four photos in one row: 3 gaps of 10px and 8 paddings of 2px.
    expect(plan.widths[1]).toEqual({
      start: 400,
      shares: [0.25, 0.25, 0.25, 0.25],
      gaps: [46, 46, 46, 46],
    })
  })

  it('gives each item the width share of its row', () => {
    const photos: PhotoItem[] = [
      { id: 'wide', src: '/w.jpg', width: 200, height: 100 },
      { id: 'square', src: '/s.jpg', width: 100, height: 100 },
    ]
    const plan = computeRowsPlan({
      photos,
      containerName: 'album',
      breakpoints: [300],
      spacing: 10,
      targetRowHeight: 100,
    })
    expect(plan.widths).toEqual([{ start: 0, shares: [2 / 3, 1 / 3], gaps: [10, 10] }])
    // The narrowest photo grows by 1 so a row is never left partly empty.
    expect(plan.items.map((item) => item.style['flex-grow'])).toEqual(['2', '1'])
    expect(plan.items.map((item) => item.breakClass)).toEqual(['np-br-0', undefined])
  })

  it('keeps rows already shown when photos are appended', () => {
    const first = computeRowsPlan({
      photos: squares(3),
      containerName: 'album',
      breakpoints: [400],
      spacing: 0,
      targetRowHeight: 100,
    })
    expect(spans(first)).toEqual([{ start: 0, breaks: [] }])
    const options = {
      photos: squares(4),
      containerName: 'album',
      breakpoints: [400],
      spacing: 0,
      targetRowHeight: 100,
    }
    // Alone, four squares make one row; after an append, the first three keep theirs.
    expect(spans(computeRowsPlan(options))).toEqual([{ start: 0, breaks: [] }])
    expect(spans(computeRowsPlan(options, first.memo))).toEqual([{ start: 0, breaks: [2] }])
    // A changed photo is not an append: rows are solved again.
    const replaced = { ...options, photos: [squares(1)[0]!, ...squares(4).slice(1).reverse()] }
    expect(spans(computeRowsPlan(replaced, first.memo))).toEqual([{ start: 0, breaks: [] }])
  })

  it('uses exact range boundaries for fractional breakpoints', () => {
    const css = computeRowsPlan({
      photos: createPhotoSet().slice(0, 4),
      containerName: 'fractional-test',
      breakpoints: [400.5, 800.25],
      spacing: 10,
      padding: 2,
      targetRowHeight: 220,
    }).css

    expect(css).toContain('width < 800.25px')
    expect(css).toContain('width >= 800.25px')
    expect(css).not.toContain('max-width')
    expect(css).not.toContain('min-width')
  })

  it('warns when every planned width produces an empty layout', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const plan = computeRowsPlan({
      photos: createPhotoSet().slice(0, 3),
      containerName: 'empty-test',
      breakpoints: [320],
      spacing: 8,
      padding: 500,
      targetRowHeight: 220,
    })

    expect(plan.css).toBe('')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('rows layout is empty at every planned width'),
    )
    warn.mockRestore()
  })
})
