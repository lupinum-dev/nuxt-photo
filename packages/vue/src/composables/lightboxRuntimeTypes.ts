import type { PanState } from '@nuxt-photo/core'

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

export type CarouselStyle = 'classic' | 'parallax' | 'fade'

export type CarouselConfig = {
  style: CarouselStyle
  parallax: { amount: number; scale: number; opacity: number }
  fade: { minOpacity: number }
}

export const DEFAULT_CAROUSEL_CONFIG: CarouselConfig = {
  style: 'classic',
  parallax: { amount: 0.3, scale: 0.92, opacity: 0.5 },
  fade: { minOpacity: 0 },
}

export type PanzoomImmediateSetter = (
  scale: number,
  pan: PanState,
  syncRefs?: boolean,
) => void
