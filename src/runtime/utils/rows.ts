import type {
  LayoutEntry,
  PhotoItem,
  RowConstraints,
  RowsLayoutOptions,
} from '../types'
import { findShortestPath } from './dijkstra'
import { ratio } from './ratio'
import { round } from './round'

function findIdealNodeSearch({
  items,
  targetRowHeight,
  containerWidth,
}: {
  items: PhotoItem[]
  targetRowHeight: number
  containerWidth: number
}) {
  const minRatio = items.reduce(
    (accumulator, item) => Math.min(accumulator, ratio(item)),
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
  const rowWidth
    = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAspectRatio = row.reduce(
    (accumulator, item) => accumulator + ratio(item),
    0,
  )

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

  if (commonHeight <= 0) {
    return undefined
  }

  return (commonHeight - targetRowHeight) ** 2 * row.length
}

function makeGetRowNeighbors<T extends PhotoItem>({
  items,
  layoutOptions,
  targetRowHeight,
  limitNodeSearch,
  rowConstraints,
}: {
  items: T[]
  layoutOptions: RowsLayoutOptions
  targetRowHeight: number
  limitNodeSearch: number
  rowConstraints?: RowConstraints
}) {
  return (node: number) => {
    const results = new Map<number, number>()
    const startOffset = rowConstraints?.minPhotos ?? 1
    const endOffset = Math.min(
      limitNodeSearch,
      rowConstraints?.maxPhotos ?? Number.POSITIVE_INFINITY,
    )

    results.set(node, 0)

    for (let index = node + startOffset; index < items.length + 1; index += 1) {
      if (index - node > endOffset) {
        break
      }

      const currentCost = cost(
        items,
        node,
        index,
        layoutOptions.containerWidth,
        targetRowHeight,
        layoutOptions.spacing,
        layoutOptions.padding,
      )

      if (currentCost === undefined) {
        break
      }

      results.set(index, currentCost)
    }

    return results
  }
}

export type RowsLayoutModel<T extends PhotoItem = PhotoItem>
  = | LayoutEntry<T>[][]
    | undefined

export function computeRowsLayout<T extends PhotoItem>({
  items,
  layoutOptions,
}: {
  items: T[]
  layoutOptions: RowsLayoutOptions
}): RowsLayoutModel<T> {
  const limitNodeSearch = findIdealNodeSearch({
    items,
    containerWidth: layoutOptions.containerWidth,
    targetRowHeight: layoutOptions.targetRowHeight,
  })

  const path = findShortestPath(
    makeGetRowNeighbors({
      items,
      layoutOptions,
      targetRowHeight: layoutOptions.targetRowHeight,
      limitNodeSearch,
      rowConstraints: layoutOptions.rowConstraints,
    }),
    0,
    items.length,
  )

  if (path === undefined) {
    return undefined
  }

  const rows: LayoutEntry<T>[][] = []

  for (let rowIndex = 1; rowIndex < path.length; rowIndex += 1) {
    const rowItems = items
      .map((item, index) => ({ item, index }))
      .slice(path[rowIndex - 1], path[rowIndex])
    const height = getCommonHeight(
      rowItems.map(({ item }) => item),
      layoutOptions.containerWidth,
      layoutOptions.spacing,
      layoutOptions.padding,
    )

    rows.push(
      rowItems.map(({ item, index }, positionIndex) => ({
        item,
        layout: {
          height,
          width: height * ratio(item),
          index,
          positionIndex,
          itemsCount: rowItems.length,
        },
      })),
    )
  }

  return rows
}
