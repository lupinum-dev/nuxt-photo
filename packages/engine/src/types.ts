import type {
  GestureMode,
  PanState,
  PhotoItem,
  TransitionMode,
  ZoomState,
} from '@nuxt-photo/core'

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

export type LightboxViewportState = Pick<
  LightboxEngineState,
  'zoomState' | 'panState' | 'isZoomedIn' | 'zoomAllowed'
>

export type LightboxPresentationState = Pick<
  LightboxEngineState,
  | 'gesturePhase'
  | 'animating'
  | 'ghostVisible'
  | 'ghostSrc'
  | 'hiddenThumbIndex'
  | 'overlayOpacity'
  | 'mediaOpacity'
  | 'chromeOpacity'
  | 'uiVisible'
  | 'closeDragY'
>

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
  syncViewportState: (viewportState: LightboxViewportState) => void
  syncPresentationState: (presentationState: LightboxPresentationState) => void
}
