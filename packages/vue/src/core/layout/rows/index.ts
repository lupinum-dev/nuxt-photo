import type { LayoutGroup, RowsLayoutOptions } from '../../types'
import { validatePhotoDimensions } from '../types'
import { findRowBreaks } from './knuthPlass'
import { pathToGroups } from './pathToGroups'
import { DEFAULT_PADDING, DEFAULT_SPACING, DEFAULT_TARGET_ROW_HEIGHT } from '../constants'

/** Compute a justified rows layout using the global row-break solver. */
export function computeRowsLayout<TMeta extends object>(
  options: RowsLayoutOptions<TMeta>,
): LayoutGroup<TMeta>[] {
  const {
    containerWidth,
    spacing = DEFAULT_SPACING,
    padding = DEFAULT_PADDING,
    targetRowHeight = DEFAULT_TARGET_ROW_HEIGHT,
  } = options

  const photos = validatePhotoDimensions(options.photos)

  if (photos.length === 0) return []

  const path = findRowBreaks(photos, containerWidth, targetRowHeight, spacing, padding)
  if (path === undefined) return []

  return pathToGroups(path, photos, containerWidth, spacing, padding)
}
