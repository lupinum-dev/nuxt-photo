import type { PhotoItem } from '../../types'

/** Return the aspect ratio for a photo item. */
export function ratio(item: PhotoItem) {
  return item.width / item.height
}

/** Build prefix sums so every candidate row can be scored in O(1). */
export function ratioPrefixSums(items: PhotoItem[]): Float64Array {
  const prefix = new Float64Array(items.length + 1)
  for (let index = 0; index < items.length; index++) {
    prefix[index + 1] = prefix[index]! + ratio(items[index]!)
  }
  return prefix
}

/** Sum aspect ratios in the half-open range [start, end). */
export function ratioSum(prefix: Float64Array, start: number, end: number): number {
  return prefix[end]! - prefix[start]!
}

/** Compute a shared row height from its summed ratio and item count. */
export function commonHeight(
  totalRatio: number,
  count: number,
  containerWidth: number,
  spacing: number,
  padding: number,
): number {
  const rowWidth = containerWidth - (count - 1) * spacing - 2 * padding * count
  return rowWidth / totalRatio
}

/** Compute the shared height that makes a row fill the available width exactly. */
export function getCommonHeight(
  row: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const totalAspectRatio = row.reduce((acc, item) => acc + ratio(item), 0)
  return commonHeight(totalAspectRatio, row.length, containerWidth, spacing, padding)
}

/** Score a candidate row break for the Knuth-Plass row layout solver. */
export function cost(
  prefix: Float64Array,
  start: number,
  end: number,
  width: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number | undefined {
  const count = end - start
  const height = commonHeight(ratioSum(prefix, start, end), count, width, spacing, padding)
  if (height <= 0) return undefined
  return (height - targetRowHeight) ** 2 * count
}
