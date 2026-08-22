import type { ImageAdapter, ImageSource, PhotoItem, ResponsivePhotoSizes } from '../types'
import { round } from '../utils/math'

/**
 * Default native image adapter — uses photo src/thumbSrc directly.
 * Returns the same singleton instance on every call.
 */
const _nativeAdapter: ImageAdapter = (photo: PhotoItem, context): ImageSource => {
  if (context === 'thumb' && photo.thumbSrc) {
    return {
      src: photo.thumbSrc,
      placeholderSrc: photo.placeholderSrc,
      width: photo.width,
      height: photo.height,
    }
  }

  return {
    src: photo.src,
    placeholderSrc: photo.placeholderSrc,
    srcset: photo.srcset,
    width: photo.width,
    height: photo.height,
  }
}

/** Return the built-in adapter that uses `src`, `thumbSrc`, and `srcset` directly. */
export function createNativeImageAdapter<
  TMeta extends object = Readonly<Record<string, unknown>>,
>(): ImageAdapter<TMeta> {
  return _nativeAdapter as ImageAdapter<TMeta>
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
