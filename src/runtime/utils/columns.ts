import type {
  ColumnsLayoutOptions,
  LayoutEntry,
  PhotoItem,
} from '../types'
import { ratio } from './ratio'
import { findShortestPathLengthN } from './shortestPath'

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
}) {
  return (node: number): Array<{ neighbor: number, weight: number }> => {
    const results: Array<{ neighbor: number, weight: number }> = []
    const cutOffHeight = targetColumnHeight * 1.5
    const firstItem = items[node]
    if (!firstItem) {
      return results
    }

    let height = targetColumnWidth / ratio(firstItem) + 2 * padding

    for (let index = node + 1; index < items.length + 1; index += 1) {
      results.push({
        neighbor: index,
        weight: (targetColumnHeight - height) ** 2,
      })

      if (height > cutOffHeight || index === items.length) {
        break
      }

      const nextItem = items[index]
      if (!nextItem) {
        break
      }

      height += targetColumnWidth / ratio(nextItem) + spacing + 2 * padding
    }

    return results
  }
}

function buildColumnsModel<T extends PhotoItem>({
  path,
  items,
  containerWidth,
  columnsGaps,
  columnsRatios,
  spacing,
  padding,
}: {
  path: number[]
  items: T[]
  containerWidth: number
  columnsGaps: number[]
  columnsRatios: number[]
  spacing: number
  padding: number
}) {
  const columnsModel: LayoutEntry<T>[][] = []
  const totalRatio = columnsRatios.reduce(
    (accumulator, columnRatio) => accumulator + columnRatio,
    0,
  )

  for (let columnIndex = 0; columnIndex < path.length - 1; columnIndex += 1) {
    const columnItems = items
      .map((item, index) => ({ item, index }))
      .slice(path[columnIndex], path[columnIndex + 1])

    const totalAdjustedGaps = columnsRatios.reduce(
      (accumulator, columnRatio, ratioIndex) =>
        accumulator + ((columnsGaps[columnIndex] ?? 0) - (columnsGaps[ratioIndex] ?? 0)) * columnRatio,
      0,
    )

    const columnWidth
      = ((containerWidth
        - (path.length - 2) * spacing
        - 2 * (path.length - 1) * padding
        - totalAdjustedGaps)
      * (columnsRatios[columnIndex] ?? 0))
    / totalRatio

    columnsModel.push(
      columnItems.map(({ item, index }, positionIndex) => ({
        item,
        layout: {
          width: columnWidth,
          height: columnWidth / ratio(item),
          index,
          positionIndex,
          itemsCount: columnItems.length,
        },
      })),
    )
  }

  return columnsModel
}

function computeColumnsModel<T extends PhotoItem>({
  items,
  layoutOptions,
  targetColumnWidth,
}: {
  items: T[]
  layoutOptions: ColumnsLayoutOptions
  targetColumnWidth: number
}) {
  const { columns, spacing, padding, containerWidth } = layoutOptions
  const columnsGaps: number[] = []
  const columnsRatios: number[] = []

  if (items.length <= columns) {
    const averageRatio
      = items.length > 0
        ? items.reduce((accumulator, item) => accumulator + ratio(item), 0)
        / items.length
        : 1

    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      columnsGaps[columnIndex] = 2 * padding
      columnsRatios[columnIndex]
        = columnIndex < items.length && items[columnIndex] ? ratio(items[columnIndex]!) : averageRatio
    }

    return {
      columnsGaps,
      columnsRatios,
      columnsModel: buildColumnsModel({
        path: Array.from({ length: columns + 1 }, (_, index) =>
          Math.min(index, items.length),
        ),
        items,
        columnsGaps,
        columnsRatios,
        containerWidth,
        spacing,
        padding,
      }),
    }
  }

  const targetColumnHeight
    = (items.reduce(
      (accumulator, item) => accumulator + targetColumnWidth / ratio(item),
      0,
    )
    + spacing * (items.length - columns)
    + 2 * padding * items.length)
  / columns

  const path = findShortestPathLengthN(
    makeGetColumnNeighbors({
      items,
      targetColumnWidth,
      targetColumnHeight,
      spacing,
      padding,
    }),
    columns,
    0,
    items.length,
  )

  for (let columnIndex = 0; columnIndex < path.length - 1; columnIndex += 1) {
    const columnItems = items.slice(path[columnIndex], path[columnIndex + 1])
    columnsGaps[columnIndex]
      = spacing * (columnItems.length - 1) + 2 * padding * columnItems.length
    columnsRatios[columnIndex]
      = 1 / columnItems.reduce((accumulator, item) => accumulator + 1 / ratio(item), 0)
  }

  return {
    columnsGaps,
    columnsRatios,
    columnsModel: buildColumnsModel({
      path,
      items,
      columnsGaps,
      columnsRatios,
      containerWidth,
      spacing,
      padding,
    }),
  }
}

export type ColumnsLayoutModel<T extends PhotoItem = PhotoItem>
  = | {
    columnsGaps: number[]
    columnsRatios: number[]
    columnsModel: LayoutEntry<T>[][]
  }
  | undefined

export function computeColumnsLayout<T extends PhotoItem>({
  items,
  layoutOptions,
}: {
  items: T[]
  layoutOptions: ColumnsLayoutOptions
}): ColumnsLayoutModel<T> {
  const targetColumnWidth
    = (layoutOptions.containerWidth
      - layoutOptions.spacing * (layoutOptions.columns - 1)
      - 2 * layoutOptions.padding * layoutOptions.columns)
    / layoutOptions.columns

  const result = computeColumnsModel({
    items,
    layoutOptions,
    targetColumnWidth,
  })

  if (
    result.columnsModel.some(column =>
      column.some(
        ({ layout }) => layout.width <= 0 || layout.height <= 0,
      ),
    )
  ) {
    return layoutOptions.columns > 1
      ? computeColumnsLayout({
          items,
          layoutOptions: {
            ...layoutOptions,
            columns: layoutOptions.columns - 1,
          },
        })
      : undefined
  }

  return result
}
