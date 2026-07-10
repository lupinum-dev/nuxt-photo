import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRef,
} from 'vue'
import {
  createNativeImageAdapter,
  DEFAULT_TRANSITION_CONFIG,
  loadImage,
  type AreaMetrics,
  type ImageAdapter,
  type LoadImageResult,
  type LightboxTransitionOption,
  type PhotoItem,
} from '../core/index'
import { usePanzoom } from './panzoom'
import { useCarousel } from './carousel'
import { useGhostTransition } from './transitions/runtime'
import { useLightboxInputHandlers } from './input/pointer'
import {
  createGeometrySync,
  createKeydownBinding,
  createPreloadAround,
  useLightboxWindowLifecycle,
  watchPhotoCollection,
} from './watchers'
import { ImageAdapterKey, LightboxDefaultsKey } from '../provide/keys'
import type { LightboxLifecycleStatus } from '../provide/keys'
import { createDebug } from '../core/debug/logger'
import { abortable, isAbortError } from './transitions/animation'
import { useAsyncErrorReporter } from '../internal/asyncErrors'
import {
  acquireLightboxOwnership,
  releaseLightboxOwnership,
} from '../internal/lightboxOwnership'

/**
 * Internal Vue lightbox state.
 *
 * Public customisation should go through `useLightboxProvider`; this function
 * wires the Vue-side composables together: reactive photo state, DOM refs,
 * Embla paging, pan/zoom, gestures, and ghost transitions.
 * Lifecycle intent is reconciled by one abortable runner. Status is the sole
 * writable representation of actual lifecycle state; DOM mount is derived.
 */
export function useLightboxRuntimeState(
  photosInput: MaybeRef<PhotoItem | readonly PhotoItem[]>,
  transitionOption?: LightboxTransitionOption,
  minZoom?: number,
  imageAdapter?: ImageAdapter,
) {
  if (import.meta.env.DEV && !getCurrentInstance()) {
    console.warn(
      '[nuxt-photo] useLightboxRuntimeState must be called inside a component setup()',
    )
  }

  const photos = computed(() => {
    const value = toValue(photosInput)
    return Array.isArray(value) ? value : [value]
  })

  const globalDefaults = inject(LightboxDefaultsKey, undefined)
  const injectedImageAdapter = inject(ImageAdapterKey, null)
  const resolvedMinZoom = minZoom ?? globalDefaults?.minZoom
  const resolvedImageAdapter = computed(
    () => imageAdapter ?? injectedImageAdapter ?? createNativeImageAdapter(),
  )

  const debug = createDebug()
  const reportAsyncError = useAsyncErrorReporter()
  const ownershipId = Symbol('nuxt-photo:lightbox-owner')
  const transitionConfig = { ...DEFAULT_TRANSITION_CONFIG }

  // Apply user-provided transition option
  if (transitionOption) {
    if (typeof transitionOption === 'string') {
      transitionConfig.mode = transitionOption
    } else {
      transitionConfig.mode = transitionOption.mode
      transitionConfig.autoThreshold =
        transitionOption.autoThreshold ?? transitionConfig.autoThreshold
    }
  }

  // Respect prefers-reduced-motion (overrides 'auto' and 'flip', but not explicit 'none')
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    transitionConfig.mode !== 'none'
  ) {
    transitionConfig.mode = 'fade'
  }

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)
  const lifecycleStatus = ref<LightboxLifecycleStatus>('closed')
  const activeImageLoadFailed = ref(false)
  let isZoomedIn = () => false
  let isInteractionLocked = () => false

  const carousel = useCarousel(
    photos,
    areaMetrics,
    () => isZoomedIn(),
    () => isInteractionLocked(),
    debug,
  )

  const panzoom = usePanzoom(
    carousel.currentPhoto,
    areaMetrics,
    debug,
    resolvedMinZoom,
  )

  const ghost = useGhostTransition(
    carousel.activeIndex,
    carousel.currentPhoto,
    areaMetrics,
    carousel.getAbsoluteFrameRect,
    debug,
    transitionConfig,
  )
  isZoomedIn = () => panzoom.isZoomedIn.value
  isInteractionLocked = () => ghost.animating.value

  const syncGeometry = createGeometrySync(mediaAreaRef, areaMetrics, debug)
  const preloadAround = createPreloadAround(photos, resolvedImageAdapter)

  type LightboxIntent =
    | { readonly kind: 'closed' }
    | { readonly kind: 'open'; readonly index: number }
  type ActiveRun = {
    readonly controller: AbortController
    readonly done: Promise<unknown>
  }

  const isOpen = computed(() => lifecycleStatus.value !== 'closed')
  let desired: LightboxIntent = { kind: 'closed' }
  let activeRun: ActiveRun | null = null
  let reconcilePromise: Promise<void> | null = null

  function startRun<T>(operation: (signal: AbortSignal) => Promise<T>) {
    const controller = new AbortController()
    const done = operation(controller.signal)
    const run: ActiveRun = { controller, done }
    activeRun = run
    return done.finally(() => {
      if (activeRun === run) activeRun = null
    })
  }

  async function prepareActiveSlide(reset: boolean) {
    panzoom.setActiveSlideIndex(carousel.activeIndex.value)
    await nextTick()
    syncGeometry()
    panzoom.refreshZoomState(reset)
    preloadAround(carousel.activeIndex.value)
  }

  async function reconcile() {
    while (true) {
      const target = desired

      try {
        if (target.kind === 'closed') {
          if (lifecycleStatus.value === 'closed') return

          lifecycleStatus.value = 'closing'
          await startRun((signal) => ghost.close(closeCallbacks, signal))
          ghost.setCloseDragY(0)
          keydown.detach()
          lifecycleStatus.value = 'closed'
        } else if (lifecycleStatus.value === 'open') {
          if (carousel.activeIndex.value !== target.index) {
            carousel.goTo(target.index, true)
            activeImageLoadFailed.value = false
            await prepareActiveSlide(true)
          }
        } else {
          lifecycleStatus.value = 'opening'
          ghost.setCloseDragY(0)
          carousel.goTo(target.index, true)
          keydown.attach()

          const opened = await startRun((signal) =>
            ghost.open(target.index, transitionCallbacks, signal),
          )
          if (!opened) {
            ghost.resetClosedVisualState()
            keydown.detach()
            lifecycleStatus.value = 'closed'
          } else {
            lifecycleStatus.value = 'open'
          }
        }
      } catch (error) {
        ghost.resetClosedVisualState()
        keydown.detach()
        lifecycleStatus.value = 'closed'
        if (isAbortError(error)) continue
        desired = { kind: 'closed' }
        throw error
      }

      const realized =
        desired === target &&
        ((target.kind === 'closed' && lifecycleStatus.value === 'closed') ||
          (target.kind === 'open' &&
            lifecycleStatus.value === 'open' &&
            carousel.activeIndex.value === target.index))
      if (realized) return
    }
  }

  function ensureReconciled() {
    if (!reconcilePromise) {
      reconcilePromise = reconcile().finally(() => {
        reconcilePromise = null
      })
    }
    return reconcilePromise
  }

  async function open(index = 0) {
    const currentPhotos = photos.value
    if (index < 0 || index >= currentPhotos.length) {
      throw new RangeError(
        `[nuxt-photo] No photo found at index ${String(index)}`,
      )
    }

    const target: LightboxIntent = { kind: 'open', index }
    desired = target
    activeRun?.controller.abort()
    await acquireLightboxOwnership({ id: ownershipId, close })
    try {
      if (desired !== target) {
        await ensureReconciled()
        return
      }
      await ensureReconciled()
    } finally {
      if (lifecycleStatus.value === 'closed') {
        releaseLightboxOwnership(ownershipId)
      }
    }
  }

  async function close() {
    desired = { kind: 'closed' }
    activeRun?.controller.abort()
    try {
      await ensureReconciled()
    } finally {
      if (lifecycleStatus.value === 'closed') {
        releaseLightboxOwnership(ownershipId)
      }
    }
  }

  function next() {
    if (lifecycleStatus.value !== 'open' || ghost.transitionInProgress.value)
      return
    carousel.goToNext()
  }

  function prev() {
    if (lifecycleStatus.value !== 'open' || ghost.transitionInProgress.value)
      return
    carousel.goToPrev()
  }

  const gestures = useLightboxInputHandlers(
    {
      state: {
        isOpen,
        animating: ghost.animating,
        ghostVisible: ghost.ghostVisible,
        isZoomedIn: panzoom.isZoomedIn,
        zoomAllowed: panzoom.zoomAllowed,
        mediaAreaRef,
        currentPhoto: carousel.currentPhoto,
        areaMetrics,
        uiVisible: ghost.uiVisible,
        panState: panzoom.panState,
        zoomState: panzoom.zoomState,
        transitionInProgress: ghost.transitionInProgress,
      },
      panzoom: {
        getCurrentScale: panzoom.getCurrentScale,
        getCurrentPan: panzoom.getCurrentPan,
        setCurrentPanImmediate: panzoom.setCurrentPanImmediate,
        settleCurrentTransform: panzoom.settleCurrentTransform,
        setPanzoomImmediate: panzoom.setPanzoomImmediate,
        startPanzoomSpring: panzoom.startPanzoomSpring,
        clampPan: panzoom.clampPan,
        clampPanWithResistance: panzoom.clampPanWithResistance,
        applyWheelZoom: panzoom.applyWheelZoom,
        toggleZoom: panzoom.toggleZoom,
        getPanBounds: panzoom.getPanBounds,
      },
      navigation: {
        goToNext: carousel.goToNext,
        goToPrev: carousel.goToPrev,
        goTo: carousel.goTo,
        selectedSnap: carousel.selectedSnap,
      },
      lifecycle: {
        setCloseDragY: ghost.setCloseDragY,
        handleCloseGesture: ghost.handleCloseGesture,
        close,
        reportAsyncError,
      },
    },
    debug,
  )
  const keydown = createKeydownBinding(gestures.onKeydown)

  async function loadActiveSlideImage(
    photo: PhotoItem,
    signal: AbortSignal,
  ): Promise<LoadImageResult> {
    activeImageLoadFailed.value = false

    const result = await abortable(
      loadImage(resolvedImageAdapter.value(photo, 'slide').src),
      signal,
    )

    activeImageLoadFailed.value = !result.ok
    if (!result.ok) {
      debug.warn(
        'images',
        `slide image failed to load for "${photo.id}"`,
        result.error,
      )
    }

    return result
  }

  const transitionCallbacks = {
    prepareActiveSlide,
    resetGestureState: () => gestures.resetGestureState(),
    cancelTapTimer: () => gestures.cancelTapTimer(),
    getThumbSrc: (photo: PhotoItem) =>
      resolvedImageAdapter.value(photo, 'thumb').src,
    getSlideSrc: (photo: PhotoItem) =>
      resolvedImageAdapter.value(photo, 'slide').src,
    loadSlideImage: loadActiveSlideImage,
  }

  const closeCallbacks = {
    ...transitionCallbacks,
    syncGeometry,
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    isZoomedIn: panzoom.isZoomedIn,
  }

  watchPhotoCollection(photos, {
    activeIndex: carousel.activeIndex,
    isMounted: isOpen,
    goTo: carousel.goTo,
    close,
    reportAsyncError,
  })
  watch(carousel.activeIndex, (index) => {
    if (lifecycleStatus.value !== 'open') return
    debug.log('slides', `activeIndex changed → ${index}`)
    reportAsyncError('prepare-active-slide', prepareActiveSlide(true))
  })
  useLightboxWindowLifecycle({
    isMounted: isOpen,
    cancelTapTimer: gestures.cancelTapTimer,
    detachKeydown: keydown.detach,
    syncGeometry,
    refreshZoomState: panzoom.refreshZoomState,
    debug,
  })

  onBeforeUnmount(() => {
    desired = { kind: 'closed' }
    activeRun?.controller.abort()
    gestures.disposeGestureState()
    ghost.resetClosedVisualState()
    keydown.detach()
    lifecycleStatus.value = 'closed'
    releaseLightboxOwnership(ownershipId)
  })

  return {
    photos,
    count: computed(() => photos.value.length),
    lifecycleStatus,
    activeIndex: carousel.activeIndex,
    activePhoto: carousel.currentPhoto,
    isOpen,

    zoomState: panzoom.zoomState,
    panState: panzoom.panState,
    isZoomedIn: panzoom.isZoomedIn,
    zoomAllowed: panzoom.zoomAllowed,

    animating: ghost.animating,
    ghostVisible: ghost.ghostVisible,
    ghostSrc: ghost.ghostSrc,
    ghostStyle: ghost.ghostStyle,
    hiddenThumbIndex: ghost.hiddenThumbIndex,
    overlayOpacity: ghost.overlayOpacity,
    mediaOpacity: ghost.mediaOpacity,
    activeImageLoadFailed,
    chromeOpacity: ghost.chromeOpacity,
    uiVisible: ghost.uiVisible,
    closeDragY: ghost.closeDragY,
    transitionInProgress: ghost.transitionInProgress,
    chromeStyle: ghost.chromeStyle,
    closeDragRatio: ghost.closeDragRatio,
    backdropStyle: ghost.backdropStyle,
    lightboxUiStyle: ghost.lightboxUiStyle,

    gesturePhase: gestures.gesturePhase,

    mediaAreaRef,
    emblaRef: carousel.emblaRef,

    setThumbRef: ghost.setThumbRef,
    setSlideZoomRef: panzoom.setSlideZoomRef,

    onMediaPointerDown: gestures.onMediaPointerDown,
    onMediaPointerMove: gestures.onMediaPointerMove,
    onMediaPointerUp: gestures.onMediaPointerUp,
    onMediaPointerCancel: gestures.onMediaPointerCancel,
    onWheel: gestures.onWheel,

    open,
    close,
    next,
    prev,
    toggleZoom: panzoom.toggleZoom,
    handleBackdropClick: () => ghost.handleBackdropClick(close),
    getSlideFrameStyle: carousel.getSlideFrameStyle,
  }
}
