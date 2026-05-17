import { describe, expect, it } from 'vitest'
import {
  computeColumnsLayout,
  computeMasonryLayout,
  computeRowsLayout,
} from '@nuxt-photo/core'
import { createPhotoSet } from '@test-fixtures/photos'

function totalGroupHeight(
  group: { entries: Array<{ height: number }> },
  spacing: number,
) {
  return (
    group.entries.reduce((sum, entry) => sum + entry.height, 0) +
    spacing * Math.max(0, group.entries.length - 1)
  )
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
      expect(
        row.entries.every((entry) => entry.width > 0 && entry.height > 0),
      ).toBe(true)
    }
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
      expect(
        column.entries.every((entry) => entry.width > 0 && entry.height > 0),
      ).toBe(true)
      expect(column.entries.map((entry) => entry.index)).toEqual(
        [...column.entries.map((entry) => entry.index)].sort((a, b) => a - b),
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
    expect(
      columns.map((column) => column.entries.map((entry) => entry.index)),
    ).toEqual([[0], [1]])
  })

  it('rejects invalid photo dimensions instead of inventing fallback geometry', () => {
    const invalidPhotos = [
      { ...createPhotoSet()[0]!, id: 'invalid-width', width: 0 },
    ]

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
      expect(
        column.entries.every((entry) => entry.width > 0 && entry.height > 0),
      ).toBe(true)
      expect(column.entries.map((entry) => entry.index)).toEqual(
        [...column.entries.map((entry) => entry.index)].sort((a, b) => a - b),
      )
    }

    expect(
      masonry.map((column) => column.entries.map((entry) => entry.index)),
    ).toEqual([
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
