/** The photo at `index`, or a RangeError that names the index. */
export function photoAt<T>(photos: readonly T[], index: number): T {
  if (!Number.isInteger(index) || index < 0 || index >= photos.length) {
    throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
  }
  return photos[index]!
}

/** The position of the photo with `id`, or a RangeError that names the id. */
export function photoIndexOf(photos: readonly { readonly id: string }[], id: string): number {
  const index = photos.findIndex((photo) => photo.id === id)
  if (index < 0) throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
  return index
}

/** A photo's identity: its `id`, or its `src` when it has none, the rule validation applies. */
export function photoId(photo: { readonly id?: string; readonly src: string }): string {
  return photo.id ?? photo.src
}
