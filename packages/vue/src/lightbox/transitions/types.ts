import type { ComputedRef, CSSProperties, Ref } from 'vue'
import type {
  AreaMetrics,
  LoadImageResult,
  PanState,
  PhotoItem,
  RectLike,
  TransitionModeConfig,
} from '../../core/index'
import type { DebugLogger } from '../../core/debug/logger'

export const openDurationMs = 420
export const closeDurationMs = 380
export const fadeDurationMs = 200

export type TransitionCallbacks = {
  prepareActiveSlide: (reset: boolean) => Promise<void>
  resetGestureState: () => void
  cancelTapTimer: () => void
  getThumbSrc: (photo: PhotoItem) => string
  getSlideSrc: (photo: PhotoItem) => string
  loadSlideImage: (
    photo: PhotoItem,
    signal: AbortSignal,
  ) => Promise<LoadImageResult>
}

export type CloseCallbacks = TransitionCallbacks & {
  syncGeometry: () => void
  setPanzoomImmediate: (scale: number, pan: PanState) => void
  isZoomedIn: ComputedRef<boolean>
}

/** Shared reactive state passed between ghost transition submodules. */
export interface GhostState {
  // Core state
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  ghostSrc: Ref<string>
  ghostStyle: Ref<CSSProperties>
  hiddenThumbIndex: Ref<number | null>

  // Opacity layers
  overlayOpacity: Ref<number>
  mediaOpacity: Ref<number>
  chromeOpacity: Ref<number>
  uiVisible: Ref<boolean>

  // Drag-to-close
  closeDragY: Ref<number>
  disableBackdropTransition: Ref<boolean>

  // Computed
  closeDragRatio: ComputedRef<number>

  // Thumb DOM references
  thumbRefs: Map<number, HTMLElement>

  // External dependencies
  activeIndex: Ref<number>
  currentPhoto: ComputedRef<PhotoItem | null>
  areaMetrics: Ref<AreaMetrics | null>
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null
  debug?: DebugLogger
  transitionConfig?: TransitionModeConfig
}
