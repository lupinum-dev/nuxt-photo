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

export type SlideView = {
  photo: Photo
  index: number
  offset: -1 | 0 | 1
  isActive: boolean
}

export type RectLike = {
  left: number
  top: number
  width: number
  height: number
}

export type AreaMetrics = RectLike

export type PointerSession = {
  id: number
  pointerType: string
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastTime: number
  velocityX: number
  velocityY: number
  moved: boolean
  startPan: PanState
}

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
  spring: { tension: number; friction: number }
  thresholds: { distance: number; velocity: number }
  parallax: { amount: number; scale: number; opacity: number }
  fade: { minOpacity: number }
}
