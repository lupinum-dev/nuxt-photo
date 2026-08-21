import { round } from '../utils/math'

// ─── Album layout defaults ───
// Single source of truth for every default consumed by the layout engines,
// the container-query CSS generator, and the PhotoAlbum component.

/** Default spacing between items in px. */
export const DEFAULT_SPACING = 8
/** Default padding around each item in px. */
export const DEFAULT_PADDING = 0
/** Default target row height in px for the rows layout. */
export const DEFAULT_TARGET_ROW_HEIGHT = 300
/** Default column count for the columns and masonry layouts. */
export const DEFAULT_COLUMNS = 3

/**
 * Total horizontal space consumed by gaps between and around `count` items.
 *
 * Items are content-box with symmetric padding, so a row of `count` items
 * reserves `(count − 1)` inner spacings plus `2·count` padding edges. This
 * formula is load-bearing across the JS/CSS boundary: the container-query
 * stylesheet, inline item styles, and `<img sizes>` computation must all
 * produce byte-identical gap arithmetic.
 */
export function computeGaps(spacing: number, padding: number, count: number): number {
  return spacing * (count - 1) + 2 * padding * count
}

/**
 * Divisor for percentage-based item widths.
 *
 * Item width renders as `calc((100% − gaps) / divisor)`, where `divisor`
 * answers "how many times does this item fit into the free width". Rounding
 * to 5 decimals keeps generated CSS compact while flexbox absorbs subpixel
 * residue. Callers must pass the same `gaps` value they render into the CSS
 * expression or the two will disagree.
 */
export function computeWidthDivisor(
  containerWidth: number,
  gaps: number,
  itemWidth: number,
): number {
  return round((containerWidth - gaps) / itemWidth, 5)
}
