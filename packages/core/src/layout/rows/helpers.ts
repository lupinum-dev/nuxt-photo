import type { PhotoItem } from '../../types'
import { round } from '../../utils/math'

export function ratio(item: PhotoItem) {
  return item.width / item.height
}

export function findIdealNodeSearch(
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

export function getCommonHeight(
  row: PhotoItem[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const rowWidth = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAspectRatio = row.reduce((acc, item) => acc + ratio(item), 0)
  return rowWidth / totalAspectRatio
}

export function cost(
  items: PhotoItem[],
  start: number,
  end: number,
  width: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number | undefined {
  const row = items.slice(start, end)
  const commonHeight = getCommonHeight(row, width, spacing, padding)
  if (commonHeight <= 0) return undefined
  return (commonHeight - targetRowHeight) ** 2 * row.length
}
