import type { PhotoItem } from '../../types'

/** Return the aspect ratio for a photo item. */
export function ratio(item: PhotoItem) {
  return item.width / item.height
}

/** Sum of aspect ratios for the half-open range photos[start..end). */
export function ratioSumRange(items: PhotoItem[], start: number, end: number): number {
  let sum = 0
  for (let k = start; k < end; k++) {
    sum += items[k]!.width / items[k]!.height
  }
  return sum
}

/**
 * Shared height that makes a row of `count` photos with total aspect ratio
 * `sumRatios` fill the available width exactly.
 */
export function commonHeightForCount(
  sumRatios: number,
  count: number,
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const rowWidth = containerWidth - (count - 1) * spacing - 2 * padding * count
  return rowWidth / sumRatios
}

/** Compute the shared height that makes a row fill the available width exactly. */
export function getCommonHeight(
  row: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  return commonHeightForCount(ratioSumRange(row, 0, row.length), row.length, containerWidth, spacing, padding)
}

/** Score a candidate row break for the Knuth-Plass row layout solver. */
export function cost(
  items: PhotoItem[],
  start: number,
  end: number,
  width: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number | undefined {
  const count = end - start
  const sumRatios = ratioSumRange(items, start, end)
  const commonHeight = commonHeightForCount(sumRatios, count, width, spacing, padding)
  if (commonHeight <= 0) return undefined
  return (commonHeight - targetRowHeight) ** 2 * count
}
