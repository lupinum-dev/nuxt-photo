import type { ColumnsLayoutOptions, LayoutEntry, LayoutGroup, PhotoItem } from '../types'
import { normalizeColumnCount, normalizeLayoutNumber, validatePhotoDimensions } from './types'

function ratio(item: PhotoItem) {
  return item.width / item.height
}

function findColumnBreaks(
  items: PhotoItem[],
  columns: number,
  targetColumnWidth: number,
  spacing: number,
  padding: number,
): number[] {
  const count = items.length
  const targetColumnHeight =
    (items.reduce((acc, item) => acc + targetColumnWidth / ratio(item), 0) +
      spacing * Math.max(0, count - columns) +
      2 * padding * count) /
    columns

  const baseHeights = new Float64Array(count + 1)
  for (let index = 0; index < count; index++) {
    baseHeights[index + 1] =
      baseHeights[index]! + targetColumnWidth / ratio(items[index]!) + 2 * padding
  }

  const costs: number[][] = Array.from({ length: columns + 1 }, () =>
    Array.from({ length: count + 1 }, () => Infinity),
  )
  const previous: number[][] = Array.from({ length: columns + 1 }, () =>
    Array.from({ length: count + 1 }, () => -1),
  )
  costs[0]![0] = 0

  for (let column = 1; column <= columns; column++) {
    for (let end = column; end <= count; end++) {
      for (let start = column - 1; start < end; start++) {
        const height =
          baseHeights[end]! - baseHeights[start]! + spacing * Math.max(0, end - start - 1)
        const nextCost = costs[column - 1]![start]! + (targetColumnHeight - height) ** 2
        if (nextCost < costs[column]![end]!) {
          costs[column]![end] = nextCost
          previous[column]![end] = start
        }
      }
    }
  }

  const path = [count]
  let end = count
  for (let column = columns; column > 0; column--) {
    const start = previous[column]![end]!
    if (start < 0) return [0, count]
    path.push(start)
    end = start
  }
  return path.reverse()
}

function partitionColumns(
  items: PhotoItem[],
  columns: number,
  spacing: number,
  padding: number,
  targetColumnWidth: number,
): {
  columnsGaps: number[]
  columnsRatios: number[]
  columnGroups: { photo: PhotoItem; index: number }[][]
} {
  const columnsGaps: number[] = []
  const columnsRatios: number[] = []

  if (items.length <= columns) {
    for (let col = 0; col < items.length; col++) {
      columnsGaps[col] = 2 * padding
      columnsRatios[col] = ratio(items[col]!)
    }

    const path = Array.from({ length: items.length + 1 }, (_, i) => i)
    const columnGroups = buildColumnGroups(path, items)
    return { columnsGaps, columnsRatios, columnGroups }
  }

  const path = findColumnBreaks(items, columns, targetColumnWidth, spacing, padding)

  for (let col = 0; col < path.length - 1; col++) {
    const columnItems = items.slice(path[col], path[col + 1])
    columnsGaps[col] = spacing * (columnItems.length - 1) + 2 * padding * columnItems.length
    columnsRatios[col] = 1 / columnItems.reduce((acc, item) => acc + 1 / ratio(item), 0)
  }

  const columnGroups = buildColumnGroups(path, items)
  return { columnsGaps, columnsRatios, columnGroups }
}

function buildColumnGroups(path: number[], items: PhotoItem[]) {
  const groups: { photo: PhotoItem; index: number }[][] = []
  for (let col = 0; col < path.length - 1; col++) {
    groups.push(
      items.slice(path[col], path[col + 1]).map((photo, i) => ({
        photo,
        index: path[col]! + i,
      })),
    )
  }
  return groups
}

/**
 * Columns layout — partitions photos into balanced sequential columns.
 * Returns LayoutGroup[]
 * with columnsGaps and columnsRatios metadata for CSS calc() widths.
 */
export function computeColumnsLayout(options: ColumnsLayoutOptions): LayoutGroup[] {
  const containerWidth = normalizeLayoutNumber(options.containerWidth, 0)
  const spacing = normalizeLayoutNumber(options.spacing, 8)
  const padding = normalizeLayoutNumber(options.padding, 0)
  const photos = validatePhotoDimensions(options.photos)
  if (photos.length === 0 || containerWidth <= 0) return []
  const columns = Math.min(normalizeColumnCount(options.columns), photos.length)

  const targetColumnWidth =
    (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns

  const result = partitionColumns(photos, columns, spacing, padding, targetColumnWidth)

  const totalRatio = result.columnsRatios.reduce((acc, r) => acc + r, 0)

  const groups: LayoutGroup[] = []
  for (let col = 0; col < result.columnGroups.length; col++) {
    const columnItems = result.columnGroups[col]!
    if (columnItems.length === 0) continue

    const totalAdjustedGaps = result.columnsRatios.reduce(
      (acc, colRatio, ratioIndex) =>
        acc + ((result.columnsGaps[col] ?? 0) - (result.columnsGaps[ratioIndex] ?? 0)) * colRatio,
      0,
    )

    const columnWidth =
      ((containerWidth -
        (result.columnGroups.length - 1) * spacing -
        2 * result.columnGroups.length * padding -
        totalAdjustedGaps) *
        (result.columnsRatios[col] ?? 0)) /
      totalRatio

    const entries: LayoutEntry[] = columnItems.map(({ photo, index }, positionIndex) => ({
      index,
      photo,
      width: columnWidth,
      height: columnWidth / ratio(photo),
      positionIndex,
      itemsCount: columnItems.length,
    }))

    if (entries.some((e) => e.width <= 0 || e.height <= 0)) {
      if (columns > 1) {
        return computeColumnsLayout({
          ...options,
          containerWidth,
          spacing,
          padding,
          columns: columns - 1,
        })
      }
      return []
    }

    groups.push({
      type: 'column',
      index: col,
      entries,
      columnsGaps: result.columnsGaps,
      columnsRatios: result.columnsRatios,
    })
  }

  return groups
}
