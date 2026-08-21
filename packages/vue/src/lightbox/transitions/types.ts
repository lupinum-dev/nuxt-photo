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

export type MotionTransitionContext = {
  activeIndex: Ref<number>
  currentPhoto: ComputedRef<PhotoItem | null>
  areaMetrics: Ref<AreaMetrics | null>
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null
  transitionConfig?: TransitionModeConfig
  reducedMotion: MaybeRefOrGetter<boolean>
  animating: Ref<boolean>
  hiddenThumbIndex: Ref<number | null>
  uiVisible: Ref<boolean>
  closeDragY: Ref<number>
  stageMounted: Ref<boolean>
  activeImagePending: Ref<boolean>
  visual: MotionVisualState
  getCapturedOpen: () => CapturedOpen | null
  clearCapturedOpen: () => void
  resetClosedVisualState: () => void
}
