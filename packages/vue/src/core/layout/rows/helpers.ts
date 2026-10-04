import type { ResolvedPhotoItem as PhotoItem } from '../../types'
import { round } from '../../utils/math'

/** Return the aspect ratio for a photo item. */
export function ratio<TMeta extends object>(item: PhotoItem<TMeta>) {
  return item.width / item.height
}

/** Estimate how many next-row candidates the row solver should inspect. */
export function findIdealNodeSearch<TMeta extends object>(
  items: readonly PhotoItem<TMeta>[],
  targetRowHeight: number,
  containerWidth: number,
) {
  const minRatio = items.reduce((acc, item) => Math.min(acc, ratio(item)), Number.MAX_VALUE)
  return round(containerWidth / targetRowHeight / minRatio) + 2
}

/** Compute the shared height that makes a row fill the available width exactly. */
export function getCommonHeight<TMeta extends object>(
  row: readonly PhotoItem<TMeta>[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const rowWidth = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAspectRatio = row.reduce((acc, item) => acc + ratio(item), 0)
  return rowWidth / totalAspectRatio
}
