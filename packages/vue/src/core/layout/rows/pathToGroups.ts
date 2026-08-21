import type { LayoutGroup, PhotoItem } from '../../types'
import { commonHeight, ratio, ratioPrefixSums, ratioSum } from './helpers'

/** Convert row-break indices into concrete layout groups with sized entries. */
export function pathToGroups(
  path: number[],
  photos: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
): LayoutGroup[] {
  const groups: LayoutGroup[] = []
  const ratios = ratioPrefixSums(photos)

  for (let rowIndex = 1; rowIndex < path.length; rowIndex += 1) {
    const from = path[rowIndex - 1]!
    const to = path[rowIndex]!
    const count = to - from
    const height = commonHeight(ratioSum(ratios, from, to), count, containerWidth, spacing, padding)

    const entries: LayoutGroup['entries'] = []
    for (let positionIndex = 0; positionIndex < count; positionIndex++) {
      const index = from + positionIndex
      const photo = photos[index]!
      entries.push({
        index,
        photo,
        width: height * ratio(photo),
        height,
        positionIndex,
        itemsCount: count,
      })
    }

    groups.push({
      type: 'row',
      index: rowIndex - 1,
      entries,
    })
  }

  return groups
}
