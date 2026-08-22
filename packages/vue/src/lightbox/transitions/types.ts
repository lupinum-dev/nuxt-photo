import type { ComputedRef, Ref } from 'vue'
import type { AreaMetrics, PhotoItem, RectLike, TransitionModeConfig } from '../../core/index'
import type { MotionVisualState } from './visual-state'

export type CapturedOpen = {
  index: number
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
}

export type CloseMotionCallbacks = SharedMotionCallbacks & {
  setPanzoomImmediate: (scale: number, pan: { x: number; y: number }) => void
  isZoomedIn: ComputedRef<boolean>
}

export type SharedTransitionContext = {
  activeIndex: Ref<number>
  currentPhoto: ComputedRef<PhotoItem | null>
  areaMetrics: Ref<AreaMetrics | null>
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null
  getTransitionConfig: () => TransitionModeConfig
  isReducedMotion: () => boolean
  hiddenThumbIndex: Ref<number | null>
  visual: MotionVisualState
  getCapturedOpen: () => CapturedOpen | null
}

export type OpenTransitionContext = SharedTransitionContext & {
  stageMounted: Ref<boolean>
}

export type CloseTransitionContext = SharedTransitionContext & {
  closeDragY: Ref<number>
}
