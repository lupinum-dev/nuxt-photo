import type { CSSProperties } from 'vue'

export type Photo = {
  id: number
  title: string
  subtitle: string
  width: number
  height: number
  thumb: string
  full: string
}

export type GestureMode = 'idle' | 'slide' | 'pan' | 'close'

export type ZoomState = {
  fit: number
  secondary: number
  max: number
  current: number
}

export type PanState = {
  x: number
  y: number
}

export type RectLike = {
  left: number
  top: number
  width: number
  height: number
}

export type AreaMetrics = RectLike

export type PanzoomMotion = {
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

export type GhostStyleValue = CSSProperties

export type CarouselStyle = 'classic' | 'parallax' | 'fade'

export type CarouselConfig = {
  style: CarouselStyle
  parallax: { amount: number; scale: number; opacity: number }
  fade: { minOpacity: number }
}
