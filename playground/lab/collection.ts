import type { PhotoItem } from '@lupinum/nuxt-photo/app'

export function labCount(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(5000, Math.floor(parsed)) : fallback
}
export function repeatLabPhotos(
  source: readonly PhotoItem[],
  count: number,
  offset = 0,
): PhotoItem[] {
  if (!source.length) return []
  return Array.from({ length: count }, (_, index) => {
    const photo = source[(index + offset) % source.length]!
    return { ...photo, id: `${photo.id}-${index + offset}` }
  })
}
