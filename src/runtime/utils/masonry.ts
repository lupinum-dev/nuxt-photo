import type {
  ColumnsLayoutOptions,
  LayoutEntry,
  PhotoItem,
} from '../types'
import { ratio } from './ratio'

export type MasonryLayoutModel<T extends PhotoItem = PhotoItem>
  = | LayoutEntry<T>[][]
    | undefined

export function computeMasonryLayout<T extends PhotoItem>({
  items,
  layoutOptions,
}: {
  items: T[]
  layoutOptions: ColumnsLayoutOptions
}): MasonryLayoutModel<T> {
  const columnWidth
    = (layoutOptions.containerWidth
      - layoutOptions.spacing * (layoutOptions.columns - 1)
      - 2 * layoutOptions.padding * layoutOptions.columns)
    / layoutOptions.columns

  if (columnWidth <= 0) {
    return layoutOptions.columns > 1
      ? computeMasonryLayout({
          items,
          layoutOptions: {
            ...layoutOptions,
            columns: layoutOptions.columns - 1,
          },
        })
      : undefined
  }

  const columnHeights = Array.from({ length: layoutOptions.columns }, () => 0)

  type PartialEntry = { item: T, layout: Omit<LayoutEntry<T>['layout'], 'itemsCount' | 'positionIndex'> & { index: number } }

  return items
    .reduce<PartialEntry[][]>(
      (columnsModel, item, index) => {
        const columnIndex = columnHeights.reduce(
          (shortestIndex, height, currentIndex) =>
            height < (columnHeights[shortestIndex] ?? 0) - 1 ? currentIndex : shortestIndex,
          0,
        )

        columnHeights[columnIndex]
          = (columnHeights[columnIndex] ?? 0)
            + columnWidth / ratio(item)
            + layoutOptions.spacing
            + 2 * layoutOptions.padding

        columnsModel[columnIndex]!.push({
          item,
          layout: {
            width: columnWidth,
            height: columnWidth / ratio(item),
            index,
          },
        })

        return columnsModel
      },
      Array.from({ length: layoutOptions.columns }, () => []),
    )
    .map(column =>
      column.map((entry, positionIndex) => ({
        ...entry,
        layout: {
          ...entry.layout,
          positionIndex,
          itemsCount: column.length,
        },
      })),
    )
}
