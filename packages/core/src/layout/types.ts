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

export function normalizeColumnCount(columns: number | undefined): number {
  if (!Number.isFinite(columns) || columns == null) return 3
  return Math.max(1, Math.floor(columns))
}

export function normalizeLayoutNumber(
  value: number | undefined,
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, value!)
}
