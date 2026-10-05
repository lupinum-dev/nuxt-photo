import type { ResponsivePhotoSizes } from '../types'
import { round } from '../utils/math'

/**
 * Compute an `<img sizes>` string for a photo rendered within a justified-rows layout.
 *
 * The default size uses the photo's fraction of the container:
 * `calc((containerSize - gaps) / divisor)` where `divisor = containerWidth / photoWidth`.
 *
 * Viewport-specific overrides (e.g. `(max-width: 600px) 100vw`) are prepended in order
 * so the browser matches the first one that applies.
 *
 * Returns `undefined` when `responsiveSizes` is not provided so callers can fall back to
 * the layout fallback.
 */
export function computePhotoSizes(
  photoWidth: number,
  containerWidth: number,
  itemsInRow: number,
  spacing: number,
  padding: number,
  responsiveSizes?: string | ResponsivePhotoSizes,
): string | undefined {
  if (!responsiveSizes) return undefined
  if (typeof responsiveSizes === 'string') return responsiveSizes

  const gaps = spacing * (itemsInRow - 1) + 2 * padding * itemsInRow
  const divisor = round((containerWidth - gaps) / photoWidth, 5)
  const defaultSize = `calc((${responsiveSizes.size} - ${gaps}px) / ${divisor})`

  if (!responsiveSizes.sizes?.length) return defaultSize

  const parts = responsiveSizes.sizes.map(({ viewport, size }) => `${viewport} ${size}`)
  parts.push(defaultSize)
  return parts.join(', ')
}
