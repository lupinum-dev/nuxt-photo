import type { LayoutEntry, LayoutGroup, LayoutItem, PhotoItem, RowsLayoutOptions } from '../types'
import { findShortestPath, type GraphFunction } from './dijkstra'
import { round } from './round'

function ratio(item: PhotoItem) {
  return item.width / item.height
}

function findIdealNodeSearch(
  items: PhotoItem[],
  targetRowHeight: number,
  containerWidth: number,
) {
  const minRatio = items.reduce(
    (acc, item) => Math.min(acc, ratio(item)),
    Number.MAX_VALUE,
  )
  return round(containerWidth / targetRowHeight / minRatio) + 2
}

function getCommonHeight(
  row: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const rowWidth = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAspectRatio = row.reduce((acc, item) => acc + ratio(item), 0)
  return rowWidth / totalAspectRatio
}

function cost(
  items: PhotoItem[],
  start: number,
  end: number,
  width: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
) {
  const row = items.slice(start, end)
  const commonHeight = getCommonHeight(row, width, spacing, padding)
  if (commonHeight <= 0) return undefined
  return (commonHeight - targetRowHeight) ** 2 * row.length
}

function makeGetRowNeighbors(
  items: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
  limitNodeSearch: number,
): GraphFunction<number> {
  return (node: number) => {
    const results = new Map<number, number>()
    results.set(node, 0)

    for (let index = node + 1; index < items.length + 1; index += 1) {
      if (index - node > limitNodeSearch) break

      const currentCost = cost(
        items, node, index,
        containerWidth, targetRowHeight,
        spacing, padding,
      )
      if (currentCost === undefined) break
      results.set(index, currentCost)
    }

    return results
  }
}

/**
 * Grouped rows layout — returns LayoutGroup[] for flexbox rendering.
 * Uses Dijkstra's shortest path for optimal row breaks.
 */
export function computeRowsGroupedLayout(options: RowsLayoutOptions): LayoutGroup[] {
  const { photos, containerWidth, spacing = 8, padding = 0, targetRowHeight = 300 } = options
  if (photos.length === 0) return []

  const limitNodeSearch = findIdealNodeSearch(photos, targetRowHeight, containerWidth)

  const path = findShortestPath(
    makeGetRowNeighbors(photos, containerWidth, targetRowHeight, spacing, padding, limitNodeSearch),
    0,
    photos.length,
  )

  if (path === undefined) return []

  const groups: LayoutGroup[] = []

  for (let rowIndex = 1; rowIndex < path.length; rowIndex += 1) {
    const rowItems = photos
      .map((photo, index) => ({ photo, index }))
      .slice(path[rowIndex - 1], path[rowIndex])

    const height = getCommonHeight(
      rowItems.map(({ photo }) => photo),
      containerWidth,
      spacing,
      padding,
    )

    groups.push({
      type: 'row',
      index: rowIndex - 1,
      entries: rowItems.map(({ photo, index }, positionIndex) => ({
        index,
        photo,
        width: height * ratio(photo),
        height,
        positionIndex,
        itemsCount: rowItems.length,
      })),
    })
  }

  return groups
}

// ─── Legacy flat layout (kept for backward compat) ───

export function computeRowsLayout(options: RowsLayoutOptions): { items: LayoutItem[]; containerHeight: number } {
  const { photos, containerWidth, spacing = 8, padding = 0, targetRowHeight = 300 } = options
  if (photos.length === 0) return { items: [], containerHeight: 0 }

  const availableWidth = containerWidth - padding * 2
  const items: LayoutItem[] = []
  let currentTop = padding

  const rows = buildRows(photos, availableWidth, targetRowHeight, spacing)

  for (const row of rows) {
    const rowItems = layoutRow(row.photos, row.startIndex, availableWidth, spacing, padding, currentTop)
    items.push(...rowItems)
    if (rowItems.length > 0) {
      currentTop += rowItems[0]!.height + spacing
    }
  }

  const containerHeight = currentTop - spacing + padding
  return { items, containerHeight }
}

type Row = { photos: PhotoItem[]; startIndex: number }

function buildRows(
  photos: PhotoItem[],
  availableWidth: number,
  targetRowHeight: number,
  spacing: number,
): Row[] {
  const rows: Row[] = []
  let rowStart = 0

  while (rowStart < photos.length) {
    let rowEnd = rowStart
    let totalAspect = 0

    while (rowEnd < photos.length) {
      const photo = photos[rowEnd]!
      const aspect = photo.width / photo.height
      const newTotalAspect = totalAspect + aspect
      const gapWidth = (rowEnd - rowStart) * spacing
      const rowHeight = (availableWidth - gapWidth) / newTotalAspect

      if (rowHeight < targetRowHeight && rowEnd > rowStart) {
        const heightWithout = (availableWidth - (rowEnd - rowStart - 1) * spacing) / totalAspect
        const heightWith = rowHeight
        if (Math.abs(heightWith - targetRowHeight) < Math.abs(heightWithout - targetRowHeight)) {
          totalAspect = newTotalAspect
          rowEnd++
        }
        break
      }

      totalAspect = newTotalAspect
      rowEnd++
    }

    rows.push({ photos: photos.slice(rowStart, rowEnd), startIndex: rowStart })
    rowStart = rowEnd
  }

  return rows
}

function layoutRow(
  photos: PhotoItem[],
  startIndex: number,
  availableWidth: number,
  spacing: number,
  padding: number,
  top: number,
): LayoutItem[] {
  if (photos.length === 0) return []

  const totalAspect = photos.reduce((sum, p) => sum + p.width / p.height, 0)
  const gapWidth = (photos.length - 1) * spacing
  const rowHeight = (availableWidth - gapWidth) / totalAspect

  const items: LayoutItem[] = []
  let currentLeft = padding

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    const aspect = photo.width / photo.height
    const width = rowHeight * aspect

    items.push({
      index: startIndex + i,
      photo,
      left: currentLeft,
      top,
      width,
      height: rowHeight,
    })
    currentLeft += width + spacing
  }

  return items
}

export function createRowsLayoutAdapter(options?: { targetRowHeight?: number }): {
  name: string
  compute: (input: RowsLayoutOptions) => { items: LayoutItem[]; containerHeight: number }
} {
  return {
    name: 'rows',
    compute(input) {
      return computeRowsLayout({
        ...input,
        targetRowHeight: input.targetRowHeight ?? options?.targetRowHeight ?? 300,
      })
    },
  }
}
