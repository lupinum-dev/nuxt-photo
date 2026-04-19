import type { PhotoItem } from '@nuxt-photo/core'

export function makePhoto(overrides: Partial<PhotoItem> = {}): PhotoItem {
  const id = overrides.id ?? `photo-${Math.random().toString(36).slice(2, 8)}`

  return {
    id,
    src: `/photos/${id}.jpg`,
    thumbSrc: `/photos/${id}.jpg`,
    width: 1600,
    height: 1000,
    alt: `Fixture ${id}`,
    caption: `Caption ${id}`,
    description: `Description ${id}`,
    ...overrides,
  }
}

export function createPhotoSet(): PhotoItem[] {
  return [
    makePhoto({ id: 'desert', width: 1600, height: 1000, alt: 'Desert' }),
    makePhoto({ id: 'ocean', width: 1200, height: 1500, alt: 'Ocean' }),
    makePhoto({ id: 'canyon', width: 1600, height: 1067, alt: 'Canyon' }),
    makePhoto({ id: 'forest', width: 1500, height: 1000, alt: 'Forest' }),
    makePhoto({ id: 'alpine', width: 1400, height: 1750, alt: 'Alpine' }),
    makePhoto({ id: 'coast', width: 1600, height: 1100, alt: 'Coast' }),
    makePhoto({ id: 'lavender', width: 1800, height: 1200, alt: 'Lavender' }),
    makePhoto({ id: 'waterfall', width: 1300, height: 1700, alt: 'Waterfall' }),
    makePhoto({ id: 'city', width: 1600, height: 900, alt: 'City' }),
    makePhoto({ id: 'amber', width: 1400, height: 1400, alt: 'Amber' }),
    makePhoto({ id: 'winter', width: 1700, height: 1100, alt: 'Winter' }),
    makePhoto({ id: 'redwoods', width: 1500, height: 1900, alt: 'Redwoods' }),
  ]
}

export function createPlainPhotoSet(): PhotoItem[] {
  return [
    makePhoto({ id: 'one', width: 1600, height: 900 }),
    makePhoto({ id: 'two', width: 1200, height: 1600 }),
    makePhoto({ id: 'three', width: 1500, height: 1000 }),
    makePhoto({ id: 'four', width: 1400, height: 1400 }),
    makePhoto({ id: 'five', width: 1300, height: 1700 }),
    makePhoto({ id: 'six', width: 1800, height: 1200 }),
    makePhoto({ id: 'seven', width: 1600, height: 1000 }),
    makePhoto({ id: 'eight', width: 1100, height: 1500 }),
  ]
}
