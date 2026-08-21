import type { LayoutGroup, PhotoItem } from '../../types'
import { commonHeightForCount, ratio, ratioSumRange } from './helpers'

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
    const from = path[rowIndex - 1]!
    const to = path[rowIndex]!
    const count = to - from

    // Index-based pass: no intermediate copies of the photo list per row.
    const sumRatios = ratioSumRange(photos, from, to)
    const height = commonHeightForCount(sumRatios, count, containerWidth, spacing, padding)

    const entries = new Array(count)
    for (let positionIndex = 0; positionIndex < count; positionIndex += 1) {
      const index = from + positionIndex
      const photo = photos[index]!
      entries[positionIndex] = {
        index,
        photo,
        width: height * ratio(photo),
        height,
        positionIndex,
        itemsCount: count,
      }
    }

    groups.push({
      type: 'row',
      index: rowIndex - 1,
      entries,
    })
  }

  return groups
}
