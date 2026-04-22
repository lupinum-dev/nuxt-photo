import type { PhotoItem } from '../types'
import { devWarn } from '../env'

/** Guard against photos with invalid dimensions that would produce NaN layout values. */
export function validatePhotoDimensions(photos: PhotoItem[]): PhotoItem[] {
  return photos.map((p) => {
    if (p.width > 0 && p.height > 0) return p
    devWarn(
      `Photo "${p.id}" has invalid dimensions (${p.width}x${p.height}), using 1:1 fallback`,
    )
    return { ...p, width: 1, height: 1 }
  })
}
