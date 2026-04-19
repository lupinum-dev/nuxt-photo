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
  return group.entries.reduce((sum, entry) => sum + entry.height, 0) + spacing * Math.max(0, group.entries.length - 1)
}

function masonryGreedyDelta(
  widths: Array<{ width: number; height: number }>,
  columns: number,
  spacing: number,
) {
  const heights = new Array(columns).fill(0)

  for (const photo of widths) {
    let shortest = 0
    for (let index = 1; index < heights.length; index++) {
      if (heights[index]! < heights[shortest]!) shortest = index
    }
    heights[shortest] += photo.height + spacing
  }

  return Math.max(...heights) - Math.min(...heights)
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
      const totalWidth = row.entries.reduce((sum, entry) => sum + entry.width, 0) + spacing * (row.entries.length - 1)
      expect(totalWidth).toBeCloseTo(containerWidth, 4)
      expect(row.entries.every(entry => entry.width > 0 && entry.height > 0)).toBe(true)
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
      expect(column.entries.every(entry => entry.width > 0 && entry.height > 0)).toBe(true)
      expect(column.entries.map(entry => entry.index)).toEqual([...column.entries.map(entry => entry.index)].sort((a, b) => a - b))
    }

    const heights = columns.map(column => totalGroupHeight(column, spacing))
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(60)
  })

  it('keeps masonry columns ordered and does not worsen the greedy baseline', () => {
    const photos = createPhotoSet()
    const containerWidth = 1000
    const columnsCount = 3
    const spacing = 8
    const columnWidth = (containerWidth - spacing * (columnsCount - 1)) / columnsCount
    const greedyDelta = masonryGreedyDelta(
      photos.map(photo => ({
        width: columnWidth,
        height: columnWidth / (photo.width / photo.height),
      })),
      columnsCount,
      spacing,
    )

    const masonry = computeMasonryLayout({
      photos,
      containerWidth,
      spacing,
      columns: columnsCount,
    })

    for (const column of masonry) {
      expect(column.entries.every(entry => entry.width > 0 && entry.height > 0)).toBe(true)
      expect(column.entries.map(entry => entry.index)).toEqual([...column.entries.map(entry => entry.index)].sort((a, b) => a - b))
    }

    const heights = masonry.map(column => totalGroupHeight(column, spacing))
    const finalDelta = Math.max(...heights) - Math.min(...heights)

    expect(finalDelta).toBeLessThanOrEqual(greedyDelta)
  })
})
