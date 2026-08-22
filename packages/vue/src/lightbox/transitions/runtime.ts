import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  DEFAULT_TRANSITION_CONFIG,
  type AreaMetrics,
  type PhotoItem,
  type RectLike,
  type TransitionModeConfig,
} from '../../core/index'
import { runCloseTransition } from './close'
import { runOpenTransition } from './open'
import type { CapturedOpen, MotionCallbacks, MotionTransitionContext } from './types'
import { createMotionVisualState, imageSource, opacityOf, transformOf } from './visual-state'

const REDUCED_MOTION_DURATION_MS = 160
const DRAG_SETTLE_MS = 180
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** Coordinate transition ownership, cancellation, gestures, and the public motion contract. */
export function useLightboxMotion(
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<PhotoItem | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null,
  getTransitionConfig: () => TransitionModeConfig = () => DEFAULT_TRANSITION_CONFIG,
  isReducedMotion: () => boolean = () => false,
) {
  const animating = ref(false)
  const hiddenThumbIndex = ref<number | null>(null)
  const uiVisible = ref(true)
  const closeDragY = ref(0)
  const stageMounted = ref(false)
  const activeImagePending = ref(false)
  const transitionInProgress = computed(() => animating.value || activeImagePending.value)
  const visual = createMotionVisualState()
  let capturedOpen: CapturedOpen | null = null
  let dragFrame = 0

  function cancel() {
    if (dragFrame) cancelAnimationFrame(dragFrame)
    dragFrame = 0
    visual.persistRunningAnimations()
  }

  function resetClosedVisualState() {
    cancel()
    const current = visual.elements()
    if (current.overlay) current.overlay.style.opacity = '0'
    if (current.viewport) {
      current.viewport.style.opacity = '0'
      current.viewport.style.transform = 'none'
    }
    if (current.transitionFrame) {
      current.transitionFrame.style.display = 'none'
      current.transitionFrame.style.opacity = '0'
      current.transitionFrame.style.transform = 'none'
    }
    visual.setChromeOpacity(0)
    hiddenThumbIndex.value = null
    closeDragY.value = 0
    stageMounted.value = false
    activeImagePending.value = false
    animating.value = false
  }

  const transitionContext: MotionTransitionContext = {
    activeIndex,
    currentPhoto,
    areaMetrics,
    getAbsoluteFrameRect,
    getTransitionConfig,
    isReducedMotion,
    animating,
    hiddenThumbIndex,
    uiVisible,
    closeDragY,
    stageMounted,
    activeImagePending,
    visual,
    getCapturedOpen: () => capturedOpen,
    clearCapturedOpen: () => {
      capturedOpen = null
    },
    resetClosedVisualState,
  }

  function captureOpen(index: number, fallbackSrc: string) {
    const thumb = visual.thumbRefs.get(index) ?? null
    capturedOpen = {
      index,
      rect: thumb?.getBoundingClientRect() ?? null,
      src: imageSource(thumb, fallbackSrc),
    }
  }

  function applyDrag(value: number) {
    closeDragY.value = value
    if (dragFrame) return
    dragFrame = requestAnimationFrame(() => {
      dragFrame = 0
      const height = areaMetrics.value?.height || 1
      const progress = Math.min(1, Math.abs(closeDragY.value) / height)
      const scale = 1 - progress * 0.05
      const current = visual.elements()
      if (current.viewport) {
        current.viewport.style.transform = `translate3d(0, ${closeDragY.value}px, 0) scale(${scale})`
      }
      if (current.overlay) current.overlay.style.opacity = String(1 - progress)
      visual.setChromeOpacity(uiVisible.value ? 1 - progress : 0)
    })
  }

  async function settleDrag(signal?: AbortSignal) {
    const controller = signal ? null : new AbortController()
    const activeSignal = signal ?? controller!.signal
    const current = visual.elements()
    await Promise.all([
      visual.animate(
        current.viewport,
        [{ transform: transformOf(current.viewport) }, { transform: 'none' }],
        { duration: DRAG_SETTLE_MS, easing: EASING },
        ['transform'],
        activeSignal,
      ),
      visual.animate(
        current.overlay,
        [{ opacity: opacityOf(current.overlay, 1) }, { opacity: 1 }],
        { duration: DRAG_SETTLE_MS, easing: EASING },
        ['opacity'],
        activeSignal,
      ),
      ...[...visual.controls, ...visual.captions].map((element) =>
        visual.animate(
          element,
          [
            { opacity: Number(getComputedStyle(element).opacity) },
            { opacity: uiVisible.value ? 1 : 0 },
          ],
          { duration: DRAG_SETTLE_MS, easing: EASING },
          ['opacity'],
          activeSignal,
        ),
      ),
    ])
    closeDragY.value = 0
  }

  async function handleCloseGesture(
    deltaY: number,
    velocityY: number,
    closeFn: () => Promise<void>,
  ) {
    const threshold = Math.min(180, (areaMetrics.value?.height ?? 600) * 0.2)
    if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
      await closeFn()
      return
    }
    animating.value = true
    try {
      await settleDrag()
    } finally {
      animating.value = false
    }
  }

  function setChromeVisible(show: boolean) {
    if (animating.value) return
    const target = show ? 1 : 0
    const controller = new AbortController()
    for (const element of [...visual.controls, ...visual.captions]) {
      void visual.animate(
        element,
        [{ opacity: Number(getComputedStyle(element).opacity) }, { opacity: target }],
        { duration: REDUCED_MOTION_DURATION_MS, easing: EASING },
        ['opacity'],
        controller.signal,
      )
    }
  }

  watch(uiVisible, setChromeVisible)

  return {
    animating,
    hiddenThumbIndex,
    uiVisible,
    closeDragY,
    stageMounted,
    activeImagePending,
    transitionInProgress,
    captureOpen,
    open: (index: number, callbacks: MotionCallbacks, signal: AbortSignal) =>
      runOpenTransition(transitionContext, index, callbacks, signal),
    close: (callbacks: MotionCallbacks, signal: AbortSignal) =>
      runCloseTransition(transitionContext, callbacks, signal),
    cancel,
    resetClosedVisualState,
    setCloseDragY: applyDrag,
    settleDrag,
    handleCloseGesture,
    handleBackdropClick: (closeFn: () => Promise<void>) => closeFn(),
    setThumbRef: visual.setThumbRef,
    setSlideFrameRef: visual.setSlideFrameRef,
    setSlideImageRef: visual.setSlideImageRef,
    setOverlayRef: visual.setOverlayRef,
    setViewportRef: visual.setViewportRef,
    setControlsRef: visual.setControlsRef,
    setCaptionRef: visual.setCaptionRef,
    setTransitionFrameRef: visual.setTransitionFrameRef,
    setTransitionImageRef: visual.setTransitionImageRef,
    setTransitionShadowRef: visual.setTransitionShadowRef,
  }
}
