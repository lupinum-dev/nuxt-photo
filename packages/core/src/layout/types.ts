import type { PhotoItem } from '../types'

/** Guard against photos with invalid dimensions that would produce NaN layout values. */
export function validatePhotoDimensions(photos: PhotoItem[]): PhotoItem[] {
  for (const photo of photos) {
    if (photo.width > 0 && photo.height > 0) continue

    throw new Error(
      `Photo "${photo.id}" has invalid dimensions (${photo.width}x${photo.height})`,
    )
  }

  return photos
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
