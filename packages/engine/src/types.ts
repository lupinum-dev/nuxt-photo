import type {
  GestureMode,
  PanState,
  PhotoItem,
  TransitionMode,
  ZoomState,
} from '@nuxt-photo/core'

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

export type LightboxTransitionOption =
  | TransitionMode
  | {
      mode: TransitionMode
      autoThreshold?: number
    }

export type LightboxEngineStatus = 'closed' | 'opening' | 'open' | 'closing'

export type LightboxEngineState = {
  status: LightboxEngineStatus
  photos: PhotoItem[]
  activeIndex: number
  activePhoto: PhotoItem | null
  count: number
  zoomState: ZoomState
  panState: PanState
  isZoomedIn: boolean
  zoomAllowed: boolean
  gesturePhase: GestureMode
  animating: boolean
  ghostVisible: boolean
  ghostSrc: string
  hiddenThumbIndex: number | null
  overlayOpacity: number
  mediaOpacity: number
  chromeOpacity: number
  uiVisible: boolean
  closeDragY: number
}

export type LightboxEngineListener = (
  state: Readonly<LightboxEngineState>,
) => void

export type LightboxEngine = {
  getState: () => Readonly<LightboxEngineState>
  subscribe: (listener: LightboxEngineListener) => () => void
  setPhotos: (photos: PhotoItem[]) => void
  setActiveIndex: (index: number) => void
  open: (index?: number) => void
  markOpened: () => void
  close: () => void
  markClosed: () => void
  next: () => void
  prev: () => void
  setZoomState: (zoomState: ZoomState) => void
  setPanState: (panState: PanState) => void
  setZoomFlags: (flags: { isZoomedIn?: boolean; zoomAllowed?: boolean }) => void
  setGesturePhase: (gesturePhase: GestureMode) => void
  setUiVisible: (uiVisible: boolean) => void
  setAnimating: (animating: boolean) => void
  setGhostState: (
    state: Partial<
      Pick<
        LightboxEngineState,
        | 'ghostVisible'
        | 'ghostSrc'
        | 'hiddenThumbIndex'
        | 'overlayOpacity'
        | 'mediaOpacity'
        | 'chromeOpacity'
        | 'closeDragY'
      >
    >,
  ) => void
}
