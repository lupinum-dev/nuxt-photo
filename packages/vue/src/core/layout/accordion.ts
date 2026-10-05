/** flex-grow for the open slice so its width is close to the photo's own ratio. */
export function computeAccordionGrow(
  photoAspectRatio: number,
  frameAspectRatio: number,
  count: number,
): number {
  if (![photoAspectRatio, frameAspectRatio, count].every(Number.isFinite) || count <= 1) return 1
  const ratio = photoAspectRatio / frameAspectRatio
  if (!Number.isFinite(ratio)) return 1
  const f = Math.min(0.62, Math.max(1 / count, ratio))
  return ((count - 1) * f) / (1 - f)
}
