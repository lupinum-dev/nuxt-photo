import type { PhotoItem } from '../../types'
import { getCommonHeight, ratio } from './helpers'

/**
 * Greedy Look-Behind — O(N) linear scan.
 * Accumulates photos into a row; when the row height drops below target,
 * compares with/without the last photo and snaps whichever is closer.
 */
export function findRowBreaks(
  photos: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number[] | undefined {
  const N = photos.length
  if (N === 0) return undefined

  const path: number[] = [0]
  let rowStart = 0

  for (let i = 0; i < N; i++) {
    const rowPhotosWithout = photos.slice(rowStart, i)
    const rowPhotosWith = photos.slice(rowStart, i + 1)

    // Only consider breaking if we have at least 2 photos in the candidate row
    if (rowPhotosWith.length < 2) continue

    const heightWith = getCommonHeight(rowPhotosWith, containerWidth, spacing, padding)

    // Row height is still above target — keep adding
    if (heightWith >= targetRowHeight) continue

    const heightWithout = getCommonHeight(rowPhotosWithout, containerWidth, spacing, padding)
    const deviationWith = Math.abs(heightWith - targetRowHeight)
    const deviationWithout = Math.abs(heightWithout - targetRowHeight)

    if (deviationWithout <= deviationWith) {
      // Break BEFORE this photo
      path.push(i)
      rowStart = i
    } else {
      // Break AFTER this photo
      path.push(i + 1)
      rowStart = i + 1
    }
  }

  // Close the last row
  if (path[path.length - 1] !== N) {
    path.push(N)
  }

  return path
}
