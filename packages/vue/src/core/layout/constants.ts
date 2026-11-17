import type { AlbumLayout } from '../types'

export const DEFAULT_COLUMNS = 3
export const DEFAULT_BENTO_COLUMNS = 4
export const DEFAULT_PADDING = 0
export const DEFAULT_SPACING = 8
export const DEFAULT_TARGET_ROW_HEIGHT = 300
/** Container widths a CSS layout is planned at, below the smallest breakpoint or `responsive()` key. */
export const DEFAULT_BREAKPOINTS: readonly number[] = [
  320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560,
]

/**
 * Every layout type, and whether its tiles crop photos (`cover`) or show them
 * whole at their own aspect ratio (`contain`).
 */
const LAYOUT_PHOTO_FIT = {
  rows: 'contain',
  columns: 'contain',
  masonry: 'contain',
  grid: 'cover',
  bento: 'cover',
  mosaic: 'cover',
  accordion: 'cover',
} as const satisfies Record<AlbumLayout['type'], 'cover' | 'contain'>

/** Whether a layout name is known; the list of types is the keys above. */
export function isLayoutType(value: string): value is AlbumLayout['type'] {
  return Object.hasOwn(LAYOUT_PHOTO_FIT, value)
}

/** Whether the layout crops each photo to fill its tile. */
export function layoutCropsPhotos(type: AlbumLayout['type']): boolean {
  return LAYOUT_PHOTO_FIT[type] === 'cover'
}

export function computeGaps(spacing: number, padding: number, itemCount: number): number {
  return spacing * Math.max(0, itemCount - 1) + 2 * padding * itemCount
}
