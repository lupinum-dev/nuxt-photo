import type { LayoutEntry, LayoutGroup, MasonryLayoutOptions } from '../types'
import {
  normalizeColumnCount,
  normalizeLayoutNumber,
  validatePhotoDimensions,
} from './types'

/**
 * Masonry layout — places photos into equal-width columns using greedy
 * shortest-column assignment. Chronological order is preserved within each
 * column and item assignment is deterministic.
 * Returns LayoutGroup[] for flexbox rendering.
 */
export function computeMasonryLayout(
  options: MasonryLayoutOptions,
): LayoutGroup[] {
  const containerWidth = normalizeLayoutNumber(options.containerWidth, 0)
  const spacing = normalizeLayoutNumber(options.spacing, 8)
  const padding = normalizeLayoutNumber(options.padding, 0)
  const columns = normalizeColumnCount(options.columns)
  const photos = validatePhotoDimensions(options.photos)
  if (photos.length === 0 || containerWidth <= 0) return []

  const columnWidth =
    (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns
  if (!Number.isFinite(columnWidth) || columnWidth <= 0) {
    if (columns > 1) {
      return computeMasonryLayout({
        ...options,
        containerWidth,
        spacing,
        padding,
        columns: columns - 1,
      })
    }
    return []
  }
  const photoHeights = photos.map((p) => columnWidth / (p.width / p.height))

  const colItems: number[][] = Array.from({ length: columns }, () => [])
  const colHeights: number[] = new Array(columns).fill(0)

  for (let i = 0; i < photos.length; i++) {
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }
    colItems[shortest]!.push(i)
    colHeights[shortest]! += photoHeights[i]! + spacing
  }

  const groups: LayoutGroup[] = []
  for (let c = 0; c < columns; c++) {
    const entries: LayoutEntry[] = colItems[c]!.map((idx, positionIndex) => ({
      index: idx,
      photo: photos[idx]!,
      width: columnWidth,
      height: photoHeights[idx]!,
      positionIndex,
      itemsCount: colItems[c]!.length,
    }))
    groups.push({ type: 'column', index: c, entries })
  }

  return groups
}
