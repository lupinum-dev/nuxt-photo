import type { LayoutGroup, RowsLayoutOptions } from '../../types'
import { validatePhotoDimensions } from '../types'
import { findRowBreaks } from './knuthPlass'
import { pathToGroups } from './pathToGroups'

/** Compute a justified rows layout using the global row-break solver. */
export function computeRowsLayout(options: RowsLayoutOptions): LayoutGroup[] {
  const {
    containerWidth,
    spacing = 8,
    padding = 0,
    targetRowHeight = 300,
  } = options

  const photos = validatePhotoDimensions(options.photos)

  if (photos.length === 0) return []

  const path = findRowBreaks(
    photos,
    containerWidth,
    targetRowHeight,
    spacing,
    padding,
  )
  if (path === undefined) return []

  return pathToGroups(path, photos, containerWidth, spacing, padding)
}
