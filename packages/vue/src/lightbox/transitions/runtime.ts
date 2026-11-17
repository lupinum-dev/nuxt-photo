import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  planSettle,
  type AreaMetrics,
  type LightboxNavigationMode,
  type ResolvedPhotoItem as PhotoItem,
  type RectLike,
  type TransitionModeConfig,
} from '../../core/index'
import { createStartGate, isAbortError } from './animation'
import { runCloseTransition } from './close'
import { createNavigationMotion } from './navigation'
import { EASE_OUT, REDUCED_MOTION_DURATION_MS } from './flight'
import { runOpenTransition } from './open'
import type { CapturedOpen, CloseMotionCallbacks, OpenMotionCallbacks } from './types'
import {
  chromeOf,
  createMotionVisualState,
  imageSource,
  opacityOf,
  paint,
  transformOf,
  type MotionElements,
} from './visual-state'

/** The close drag settles back in this time with reduced motion; otherwise the spring decides. */
const DRAG_SETTLE_MS = 180

/** Coordinate transition ownership, cancellation, gestures, and the public motion contract. */
export function useLightboxMotion(
  activeIndex: Readonly<Ref<number>>,
  currentPhoto: ComputedRef<PhotoItem | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: (photo: PhotoItem) => RectLike | null,
  getTransitionConfig: () => TransitionModeConfig,
  isReducedMotion: () => boolean,
  getNavigationMode: () => LightboxNavigationMode,
  thumbnail: (id: string) => HTMLElement | null,
  /** The lightbox root; the motion finds its parts under it. */
  root: () => HTMLElement | null,
) {
  const animating = ref(false)
  const hiddenThumbnailId = ref<string | null>(null)
  const uiVisible = ref(true)
  // Written on every pointer move of a close drag: a plain value, so no render follows.
  const closeDragY = { value: 0 }
  const closeVelocityY = { value: 0 }
  const stageMounted = ref(false)
  const activeImagePending = ref(false)
  const transitionInProgress = computed(() => animating.value || activeImagePending.value)
  const visual = createMotionVisualState(root)
  const navigation = createNavigationMotion(visual, activeIndex, getNavigationMode, isReducedMotion)
  let capturedOpen: CapturedOpen | null = null
  /** The parts a close drag moves, read on its first frame and held until it ends. */
  let dragged: MotionElements | null = null
  /** When a close drag last moved the stage: its settle starts from there. */
  let movedAt = 0
  let chromeController: AbortController | null = null
  let dragSettleController: AbortController | null = null

  function cancel() {
    dragged = null
    chromeController?.abort()
    chromeController = null
    dragSettleController?.abort()
    dragSettleController = null
    visual.persistRunningAnimations()
  }

  function resetClosedVisualState() {
    cancel()
    navigation.reset()
    const current = visual.elements()
    paint(current.overlay, { opacity: '0' })
    paint(current.viewport, { opacity: '0', transform: 'none' })
    paint(current.transitionFrame, { display: 'none', opacity: '0', transform: 'none' })
    visual.setChromeOpacity(0)
    visual.showSlidePhotos()
    hiddenThumbnailId.value = null
    closeDragY.value = 0
    closeVelocityY.value = 0
    stageMounted.value = false
    activeImagePending.value = false
    animating.value = false
  }

  const transitionContext = {
    activeIndex,
    currentPhoto,
    areaMetrics,
    getAbsoluteFrameRect,
    getTransitionConfig,
    isReducedMotion,
    hiddenThumbnailId,
    thumbnail,
    visual,
    getCapturedOpen: () => capturedOpen,
    stageMounted,
    closeDragY,
    closeVelocityY,
  }

  function captureOpen(id: string, fallbackSrc: string) {
    const thumb = thumbnail(id)
    capturedOpen = {
      id,
      rect: thumb?.getBoundingClientRect() ?? null,
      src: imageSource(thumb, fallbackSrc),
    }
  }

  /** The stage transform for a close drag of `y` px: it moves and shrinks a little. */
  function dragTransform(y: number) {
    const height = areaMetrics.value?.height || 1
    const scale = 1 - Math.min(1, Math.abs(y) / height) * 0.05
    return `translate3d(0, ${y}px, 0) scale(${scale})`
  }

  /**
   * Draw a close drag in the move handler itself, like the swipe track: a frame callback would
   * show each move one frame later and leave the photo trailing the finger.
   */
  function applyDrag(value: number) {
    movedAt = performance.now()
    closeDragY.value = value
    const height = areaMetrics.value?.height || 1
    const progress = Math.min(1, Math.abs(value) / height)
    const current = (dragged ??= visual.elements())
    if (current.viewport) current.viewport.style.transform = dragTransform(value)
    if (current.overlay) current.overlay.style.opacity = String(1 - progress)
    visual.setChromeOpacity(uiVisible.value ? 1 - progress : 0, chromeOf(current))
  }

  /** Forget the drag offset without painting: the open and close motions own the stage. */
  function resetCloseDrag() {
    dragged = null
    closeDragY.value = 0
  }

  /**
   * Settle a close drag back. The stage follows the settle spring from the release `velocity`
   * (px/ms); the backdrop and the controls fade back in step with it.
   */
  async function settleDrag(velocity = 0) {
    dragSettleController?.abort()
    const controller = new AbortController()
    const { signal } = controller
    dragSettleController = controller
    dragged = null
    const current = visual.elements()
    const from = closeDragY.value
    const spring = isReducedMotion() ? null : planSettle(from, velocity)
    // Each part goes from its pose now to its resting value, by the share of the drag left.
    const shares = spring
      ? spring.positions.map((position) => (from ? position / from : 0))
      : [1, 0]
    const timing: KeyframeAnimationOptions = spring
      ? { duration: spring.duration, easing: 'linear' }
      : { duration: DRAG_SETTLE_MS, easing: EASE_OUT }
    const between = (start: number, end: number) =>
      shares.map((share) => ({ opacity: end + (start - end) * share }))
    const gate = createStartGate()
    const started = spring ? gate.hold : undefined
    try {
      const done = Promise.all([
        visual.animate(
          current.viewport,
          spring
            ? spring.positions.map((position, index, all) => ({
                transform: index === all.length - 1 ? 'none' : dragTransform(position),
              }))
            : [{ transform: transformOf(current.viewport) }, { transform: 'none' }],
          timing,
          ['transform'],
          signal,
          started,
        ),
        visual.animate(
          current.overlay,
          between(opacityOf(current.overlay, 1), 1),
          timing,
          ['opacity'],
          signal,
          started,
        ),
        ...chromeOf(current).map((element) =>
          visual.animate(
            element,
            between(Number(getComputedStyle(element).opacity), uiVisible.value ? 1 : 0),
            timing,
            ['opacity'],
            signal,
            started,
          ),
        ),
      ])
      if (spring) gate.startNextFrame(movedAt)
      await done
      closeDragY.value = 0
    } finally {
      if (dragSettleController === controller) dragSettleController = null
    }
  }

  async function handleCloseGesture(
    deltaY: number,
    velocityY: number,
    closeFn: () => Promise<void>,
  ) {
    const threshold = Math.min(180, (areaMetrics.value?.height ?? 600) * 0.2)
    if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
      closeVelocityY.value = velocityY
      await closeFn()
      return
    }
    animating.value = true
    try {
      await settleDrag(velocityY)
    } finally {
      animating.value = false
    }
  }

  function setChromeVisible(show: boolean) {
    if (animating.value) return
    const target = show ? 1 : 0
    chromeController?.abort()
    const controller = new AbortController()
    chromeController = controller
    void Promise.all(
      chromeOf(visual.elements()).map((element) =>
        visual.animate(
          element,
          [{ opacity: Number(getComputedStyle(element).opacity) }, { opacity: target }],
          { duration: REDUCED_MOTION_DURATION_MS, easing: EASE_OUT },
          ['opacity'],
          controller.signal,
        ),
      ),
    )
      .then(() => {
        if (chromeController === controller) visual.setChromeOpacity(target)
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          console.error('[nuxt-photo] chrome visibility animation failed', error)
        }
      })
      .finally(() => {
        if (chromeController === controller) chromeController = null
      })
  }

  async function open(index: number, callbacks: OpenMotionCallbacks, signal: AbortSignal) {
    callbacks.resetGestureState()
    callbacks.cancelTapTimer()
    // A drag frame still waiting to paint would reveal the backdrop and controls
    // at full opacity after the open has hidden them.
    resetCloseDrag()
    animating.value = true
    activeImagePending.value = true
    uiVisible.value = true
    callbacks.setImageLoadFailed(false)
    try {
      const opened = await runOpenTransition(transitionContext, index, callbacks, signal)
      if (!opened) resetClosedVisualState()
      else {
        visual.setChromeOpacity(1)
        capturedOpen = null
      }
      return opened
    } finally {
      activeImagePending.value = false
      animating.value = false
    }
  }

  async function close(callbacks: CloseMotionCallbacks, signal: AbortSignal) {
    callbacks.cancelTapTimer()
    callbacks.resetGestureState()
    animating.value = true
    activeImagePending.value = false
    try {
      await runCloseTransition(transitionContext, callbacks, signal)
      resetClosedVisualState()
    } finally {
      animating.value = false
    }
  }

  /** A part that joined the controls while they rest: it takes their visibility at once. */
  function adoptChrome(element: HTMLElement) {
    visual.setChromeOpacity(uiVisible.value ? 1 : 0, [element])
  }

  watch(uiVisible, setChromeVisible)

  return {
    animating,
    hiddenThumbnailId,
    uiVisible,
    stageMounted,
    activeImagePending,
    transitionInProgress,
    captureOpen,
    open,
    close,
    cancel,
    resetClosedVisualState,
    adoptChrome,
    setCloseDragY: applyDrag,
    leavingSlides: navigation.leavingSlides,
    playNavigation: navigation.play,
    dragNavigation: navigation.drag,
    releaseNavigation: navigation.release,
    resetCloseDrag,
    settleDrag,
    handleCloseGesture,
  }
}
