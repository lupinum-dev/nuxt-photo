import type { ImageAdapter, ImageSource, PhotoItem } from '../types'
import { round } from '../utils/math'

/**
 * Default native image adapter — uses photo src/thumbSrc directly.
 * Returns the same singleton instance on every call.
 */
const _nativeAdapter: ImageAdapter = (photo: PhotoItem, context): ImageSource => {
  if (context === 'thumb' && photo.thumbSrc) {
    return {
      src: photo.thumbSrc,
      width: photo.width,
      height: photo.height,
    }
  }

  return {
    src: photo.src,
    srcset: photo.srcset,
    width: photo.width,
    height: photo.height,
  }
}

export function createNativeImageAdapter(): ImageAdapter {
  return _nativeAdapter
}

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
 * adapter-computed sizes without extra checks.
 */
export function computePhotoSizes(
  photoWidth: number,
  containerWidth: number,
  itemsInRow: number,
  spacing: number,
  padding: number,
  responsiveSizes?: {
    /** CSS size of the album container, e.g. `'100vw'` or `'calc(100vw - 240px)'`. */
    size: string
    /** Optional viewport-specific overrides, listed from smallest to largest breakpoint. */
    sizes?: Array<{ viewport: string; size: string }>
  },
): string | undefined {
  if (!responsiveSizes) return undefined

  const gaps = spacing * (itemsInRow - 1) + 2 * padding * itemsInRow
  const divisor = round((containerWidth - gaps) / photoWidth, 5)
  const defaultSize = `calc((${responsiveSizes.size} - ${gaps}px) / ${divisor})`

  if (!responsiveSizes.sizes?.length) return defaultSize

  const parts = responsiveSizes.sizes.map(({ viewport, size }) => `${viewport} ${size}`)
  parts.push(defaultSize)
  return parts.join(', ')
}
