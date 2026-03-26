import type { LayoutGroup, RowsLayoutOptions } from '../../types'
import { findRowBreaks } from './knuthPlass'
import { pathToGroups } from './pathToGroups'

export function computeRowsLayout(options: RowsLayoutOptions): LayoutGroup[] {
  const {
    photos,
    containerWidth,
    spacing = 8,
    padding = 0,
    targetRowHeight = 300,
  } = options

  if (photos.length === 0) return []

  const path = findRowBreaks(photos, containerWidth, targetRowHeight, spacing, padding)
  if (path === undefined) return []

  return pathToGroups(path, photos, containerWidth, spacing, padding)
}
