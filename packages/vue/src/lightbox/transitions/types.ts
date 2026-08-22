import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { AreaMetrics, PhotoItem, RectLike, TransitionModeConfig } from '../../core/index'
import type { MotionVisualState } from './visual-state'

export type CapturedOpen = {
  index: number
  rect: DOMRect | null
  src: string
}

export type MotionCallbacks = {
  prepareActiveSlide: (reset: boolean) => Promise<void>
  resetGestureState: () => void
  cancelTapTimer: () => void
  getThumbSrc: (photo: PhotoItem) => string
  setImageLoadFailed: (failed: boolean, error?: unknown) => void
  syncGeometry: () => void
  setPanzoomImmediate: (scale: number, pan: { x: number; y: number }) => void
  isZoomedIn: ComputedRef<boolean>
}

type SharedTransitionContext = {
  activeIndex: Ref<number>
  currentPhoto: ComputedRef<PhotoItem | null>
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null
  transitionConfig: MaybeRefOrGetter<TransitionModeConfig>
  reducedMotion: MaybeRefOrGetter<boolean>
  animating: Ref<boolean>
  hiddenThumbIndex: Ref<number | null>
  activeImagePending: Ref<boolean>
  visual: MotionVisualState
  resetClosedVisualState: () => void
}

export type OpenTransitionContext = SharedTransitionContext & {
  uiVisible: Ref<boolean>
  stageMounted: Ref<boolean>
  getCapturedOpen: () => CapturedOpen | null
  clearCapturedOpen: () => void
}

export type CloseTransitionContext = SharedTransitionContext & {
  areaMetrics: Ref<AreaMetrics | null>
  closeDragY: Ref<number>
}
