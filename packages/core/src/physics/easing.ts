/** Cubic ease-out curve with a fast start and gentle finish. */
export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3
}

/** Symmetric cubic ease-in-out curve for UI transitions. */
export function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2
}
