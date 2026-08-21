import { round } from '../utils/math'

export const DEFAULT_COLUMNS = 3
export const DEFAULT_PADDING = 0
export const DEFAULT_SPACING = 8
export const DEFAULT_TARGET_ROW_HEIGHT = 300

export function computeGaps(spacing: number, padding: number, itemCount: number): number {
  return spacing * Math.max(0, itemCount - 1) + 2 * padding * itemCount
}

export function computeWidthDivisor(
  containerWidth: number,
  gaps: number,
  itemWidth: number,
): number {
  return round((containerWidth - gaps) / itemWidth, 5)
}
