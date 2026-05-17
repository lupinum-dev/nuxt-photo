export type PanzoomMotion = {
  /**
   * Mutable spring state shared across pan/zoom gesture handlers for perf.
   * This stays outside Vue refs so pointer move and RAF updates avoid per-frame allocations.
   */
  x: number
  y: number
  scale: number
  targetX: number
  targetY: number
  targetScale: number
  velocityX: number
  velocityY: number
  velocityScale: number
  tension: number
  friction: number
  rafId: number
}
