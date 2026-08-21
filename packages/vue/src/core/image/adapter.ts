import type { ImageAdapter, ImageSource, PhotoItem, ResponsivePhotoSizes } from '../types'
import { computeGaps, computeWidthDivisor } from '../layout/constants'

/**
 * Default native image adapter — uses photo src/thumbSrc directly.
 * Returns the same singleton instance on every call.
 */
const _nativeAdapter: ImageAdapter = (photo: PhotoItem, context): ImageSource => {
  if (context === 'thumb' && photo.thumbSrc) {
    return {
      src: photo.thumbSrc,
      placeholder: photo.placeholder,
      width: photo.width,
      height: photo.height,
    }
  }

  return {
    src: photo.src,
    srcset: photo.srcset,
    placeholder: photo.placeholder,
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

/** Reject tokens that would break out of the surrounding CSS expression. */
function assertSafeSizeToken(token: string, field: string): void {
  if (token.length === 0 || /["';{}]/.test(token)) {
    throw new TypeError(`[nuxt-photo] sizes.${field} is not a valid CSS size value: "${token}"`)
  }
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
  responsiveSizes?: ResponsivePhotoSizes,
): string | undefined {
  if (!responsiveSizes) return undefined

  assertSafeSizeToken(responsiveSizes.size, 'size')
  for (const override of responsiveSizes.sizes ?? []) {
    assertSafeSizeToken(override.viewport, 'viewport')
    assertSafeSizeToken(override.size, 'size')
  }

  const gaps = computeGaps(spacing, padding, itemsInRow)
  const divisor = computeWidthDivisor(containerWidth, gaps, photoWidth)
  const defaultSize = `calc((${responsiveSizes.size} - ${gaps}px) / ${divisor})`

  if (!responsiveSizes.sizes?.length) return defaultSize

  const parts = responsiveSizes.sizes.map(({ viewport, size }) => `${viewport} ${size}`)
  parts.push(defaultSize)
  return parts.join(', ')
}
