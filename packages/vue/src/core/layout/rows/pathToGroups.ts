import type { LayoutGroup, PhotoItem } from '../../types'
import { getCommonHeight, ratio } from './helpers'

/** Convert row-break indices into concrete layout groups with sized entries. */
export function pathToGroups(
  path: number[],
  photos: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
): LayoutGroup[] {
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
