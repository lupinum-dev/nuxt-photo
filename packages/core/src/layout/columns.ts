import type { ColumnsLayoutOptions, LayoutEntry, LayoutGroup, LayoutItem, PhotoItem } from '../types'
import { findShortestPathLengthN, type GraphFunction } from './shortestPath'

function ratio(item: PhotoItem) {
  return item.width / item.height
}

function makeGetColumnNeighbors({
  items,
  spacing,
  padding,
  targetColumnWidth,
  targetColumnHeight,
}: {
  items: PhotoItem[]
  spacing: number
  padding: number
  targetColumnWidth: number
  targetColumnHeight: number
}): GraphFunction<number> {
  return (node: number) => {
    const results: Array<{ neighbor: number; weight: number }> = []
    const cutOffHeight = targetColumnHeight * 1.5
    const firstItem = items[node]
    if (!firstItem) return results

    let height = targetColumnWidth / ratio(firstItem) + 2 * padding

    for (let index = node + 1; index < items.length + 1; index += 1) {
      results.push({
        neighbor: index,
        weight: (targetColumnHeight - height) ** 2,
      })

      if (height > cutOffHeight || index === items.length) break

      const nextItem = items[index]
      if (!nextItem) break

      height += targetColumnWidth / ratio(nextItem) + spacing + 2 * padding
    }

    return results
  }
}

function computeColumnsModel(
  items: PhotoItem[],
  columns: number,
  containerWidth: number,
  spacing: number,
  padding: number,
  targetColumnWidth: number,
): { columnsGaps: number[]; columnsRatios: number[]; columnGroups: { photo: PhotoItem; index: number }[][] } | undefined {
  const columnsGaps: number[] = []
  const columnsRatios: number[] = []

  if (items.length <= columns) {
    const averageRatio = items.length > 0
      ? items.reduce((acc, item) => acc + ratio(item), 0) / items.length
      : 1

    for (let col = 0; col < columns; col++) {
      columnsGaps[col] = 2 * padding
      columnsRatios[col] = col < items.length && items[col] ? ratio(items[col]!) : averageRatio
    }

    const path = Array.from({ length: columns + 1 }, (_, i) => Math.min(i, items.length))
    const columnGroups = buildColumnGroups(path, items)
    return { columnsGaps, columnsRatios, columnGroups }
  }

  const targetColumnHeight = (
    items.reduce((acc, item) => acc + targetColumnWidth / ratio(item), 0)
    + spacing * (items.length - columns)
    + 2 * padding * items.length
  ) / columns

  const path = findShortestPathLengthN(
    makeGetColumnNeighbors({ items, targetColumnWidth, targetColumnHeight, spacing, padding }),
    columns,
    0,
    items.length,
  )

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
 * Grouped columns layout — returns LayoutGroup[] for flexbox rendering.
 * Uses shortest-path algorithm for optimal photo distribution across columns.
 * Returns columnsGaps and columnsRatios metadata for CSS calc() widths.
 */
export function computeColumnsGroupedLayout(options: ColumnsLayoutOptions): LayoutGroup[] {
  const { photos, containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  if (photos.length === 0 || columns < 1) return []

  const targetColumnWidth = (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns

  const result = computeColumnsModel(photos, columns, containerWidth, spacing, padding, targetColumnWidth)
  if (!result) return []

  // Check for invalid dimensions — fall back to fewer columns
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

    const columnWidth = (
      (containerWidth - (result.columnGroups.length - 1) * spacing - 2 * result.columnGroups.length * padding - totalAdjustedGaps)
      * (result.columnsRatios[col] ?? 0)
    ) / totalRatio

    const entries: LayoutEntry[] = columnItems.map(({ photo, index }, positionIndex) => ({
      index,
      photo,
      width: columnWidth,
      height: columnWidth / ratio(photo),
      positionIndex,
      itemsCount: columnItems.length,
    }))

    // Check for invalid entries
    if (entries.some(e => e.width <= 0 || e.height <= 0)) {
      if (columns > 1) {
        return computeColumnsGroupedLayout({ ...options, columns: columns - 1 })
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

// ─── Legacy flat layout (kept for backward compat) ───

export function computeColumnsLayout(options: ColumnsLayoutOptions): { items: LayoutItem[]; containerHeight: number } {
  const { photos, containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  if (photos.length === 0 || columns < 1) return { items: [], containerHeight: 0 }

  const groups = computeColumnsGroupedLayout(options)
  if (groups.length === 0) return { items: [], containerHeight: 0 }

  const items: LayoutItem[] = []
  let currentLeft = padding
  let maxHeight = 0

  for (const group of groups) {
    let currentTop = padding

    for (const entry of group.entries) {
      items.push({
        index: entry.index,
        photo: entry.photo,
        left: currentLeft,
        top: currentTop,
        width: entry.width,
        height: entry.height,
      })
      currentTop += entry.height + spacing
    }

    if (currentTop > maxHeight) maxHeight = currentTop
    currentLeft += (group.entries[0]?.width ?? 0) + spacing
  }

  return { items, containerHeight: Math.max(0, maxHeight - spacing + padding) }
}

export function createColumnsLayoutAdapter(options?: { columns?: number }): {
  name: string
  compute: (input: ColumnsLayoutOptions) => { items: LayoutItem[]; containerHeight: number }
} {
  return {
    name: 'columns',
    compute(input) {
      return computeColumnsLayout({
        ...input,
        columns: input.columns ?? options?.columns ?? 3,
      })
    },
  }
}
