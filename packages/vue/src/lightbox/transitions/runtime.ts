import { computed, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import type {
  AreaMetrics,
  PhotoItem,
  TransitionModeConfig,
} from '../../core/index'
import { createGhostState, setThumbRef } from './state'
import { openTransition } from './open'
import { createCloseTransition } from './close'
import type { DebugLogger } from '../../core/debug/logger'

/** Coordinate ghost-image open/close transitions and expose their reactive state. */
export function useGhostTransition(
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<PhotoItem | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: (
    photo: PhotoItem,
  ) => { left: number; top: number; width: number; height: number } | null,
  debug?: DebugLogger,
  transitionConfig?: TransitionModeConfig,
) {
  const s = createGhostState(
    activeIndex,
    currentPhoto,
    areaMetrics,
    getAbsoluteFrameRect,
    debug,
    transitionConfig,
  )
  const { close, animateCloseDragTo, handleCloseGesture, handleBackdropClick } =
    createCloseTransition(s)

  const transitionInProgress = computed(
    () => s.animating.value || s.ghostVisible.value,
  )

  const chromeStyle = computed<CSSProperties>(() => ({
    opacity: String(s.uiVisible.value ? s.chromeOpacity.value : 0),
    pointerEvents:
      s.uiVisible.value && s.chromeOpacity.value > 0.05 ? 'auto' : 'none',
  }))

  const backdropStyle = computed<CSSProperties>(() => ({
    opacity: String(s.overlayOpacity.value * (1 - s.closeDragRatio.value)),
    ...(s.disableBackdropTransition.value ? { transition: 'none' } : {}),
  }))

  const lightboxUiStyle = computed<CSSProperties>(() => ({
    transform: `translate3d(0, ${s.closeDragY.value}px, 0) scale(${1 - s.closeDragRatio.value * 0.05})`,
  }))

  return {
    animating: s.animating,
    ghostVisible: s.ghostVisible,
    ghostSrc: s.ghostSrc,
    ghostStyle: s.ghostStyle,
    hiddenThumbIndex: s.hiddenThumbIndex,
    overlayOpacity: s.overlayOpacity,
    mediaOpacity: s.mediaOpacity,
    chromeOpacity: s.chromeOpacity,
    uiVisible: s.uiVisible,
    closeDragY: s.closeDragY,
    transitionInProgress,
    chromeStyle,
    closeDragRatio: s.closeDragRatio,
    backdropStyle,
    lightboxUiStyle,

    setThumbRef: (index: number) => setThumbRef(s, index),
    setCloseDragY: (val: number) => {
      s.closeDragY.value = val
    },
    open: (
      index: number,
      callbacks: Parameters<typeof openTransition>[2],
      signal: AbortSignal,
    ) => openTransition(s, index, callbacks, signal),
    resetClosedVisualState: () => {
      s.ghostVisible.value = false
      s.ghostSrc.value = ''
      s.hiddenThumbIndex.value = null
      s.overlayOpacity.value = 0
      s.mediaOpacity.value = 0
      s.chromeOpacity.value = 0
      s.animating.value = false
      s.closeDragY.value = 0
      s.disableBackdropTransition.value = false
    },
    close: (callbacks: Parameters<typeof close>[0], signal: AbortSignal) =>
      close(callbacks, signal),
    animateCloseDragTo,
    handleCloseGesture,
    handleBackdropClick,
  }
}
