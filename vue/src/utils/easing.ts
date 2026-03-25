export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3
}

export function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2
}
