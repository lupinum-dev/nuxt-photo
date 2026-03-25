import type { LayoutGroup, PhotoItem, RowsLayoutOptions } from '../types'
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
 * Rows layout — distributes photos into justified rows using Dijkstra's
 * shortest path for optimal row breaks. Returns LayoutGroup[] for
 * flexbox rendering with CSS calc() widths.
 */
export function computeRowsLayout(options: RowsLayoutOptions): LayoutGroup[] {
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
