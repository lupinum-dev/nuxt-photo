import type { ComputedRef, Ref } from 'vue'
import type {
  AreaMetrics,
  ResolvedPhotoItem as PhotoItem,
  RectLike,
  TransitionModeConfig,
} from '../../core/index'
import type { MotionVisualState } from './visual-state'

export type CapturedOpen = {
  id: string
  rect: DOMRect | null
  src: string
}

export type SharedMotionCallbacks = {
  resetGestureState: () => void
  cancelTapTimer: () => void
  getThumbSrc: (photo: PhotoItem) => string
  setImageLoadFailed: (failed: boolean, error?: unknown) => void
  syncGeometry: () => void
}

export type OpenMotionCallbacks = SharedMotionCallbacks & {
  prepareActiveSlide: (reset: boolean) => Promise<void>
  /** Resolves once the ambient glow of the active photo is painted. */
  glowReady: () => Promise<unknown>
}

export type CloseMotionCallbacks = SharedMotionCallbacks & {
  setPanzoomImmediate: (scale: number, pan: { x: number; y: number }) => void
  isZoomedIn: ComputedRef<boolean>
}

export type SharedTransitionContext = {
  activeIndex: Readonly<Ref<number>>
  currentPhoto: ComputedRef<PhotoItem | null>
  areaMetrics: Ref<AreaMetrics | null>
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null
  getTransitionConfig: () => TransitionModeConfig
  isReducedMotion: () => boolean
  hiddenThumbnailId: Ref<string | null>
  /** The page element that shows this photo, resolved when the motion needs it. */
  thumbnail: (id: string) => HTMLElement | null
  visual: MotionVisualState
  getCapturedOpen: () => CapturedOpen | null
}

export type OpenTransitionContext = SharedTransitionContext & {
  stageMounted: Ref<boolean>
}

export type CloseTransitionContext = SharedTransitionContext & {
  closeDragY: { readonly value: number }
  /** A close drag's vertical speed at release, in px/ms; the flight home continues it. */
  closeVelocityY: { readonly value: number }
}
