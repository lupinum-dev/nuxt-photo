import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  unref,
  toValue,
  watch,
  type MaybeRef,
  type MaybeRefOrGetter,
} from 'vue'
import {
  createNativeImageAdapter,
  DEFAULT_TRANSITION_CONFIG,
  type AreaMetrics,
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
  type TransitionMode,
} from '../core/index'
import { usePanzoom } from './panzoom'
import { useCarousel } from './carousel'
import { useLightboxMotion } from './transitions/runtime'
import { useLightboxInputHandlers } from './input/pointer'
import {
  createGeometrySync,
  createKeydownBinding,
  useLightboxWindowLifecycle,
  watchPhotoCollection,
} from './watchers'
import { ImageAdapterKey, LightboxDefaultsKey } from '../provide/keys'
import type { LightboxLifecycleStatus } from '../provide/keys'
import { devWarn } from '../core/env'
import { isAbortError } from './transitions/animation'
import { useAsyncErrorReporter } from '../internal/asyncErrors'
import { acquireLightboxOwnership, releaseLightboxOwnership } from '../internal/lightboxOwnership'

export function getMountedSlideIndices(active: number, count: number) {
  if (count <= 0) return new Set<number>()
  return new Set([(active - 1 + count) % count, active % count, (active + 1) % count])
}

/**
 * Internal Vue lightbox state.
 *
 * Public customisation should go through `provideLightbox`; this function
 * wires the Vue-side composables together: reactive photo state, DOM refs,
 * Embla paging, pan/zoom, gestures, and DOM-owned transitions.
 * Lifecycle intent is reconciled by one abortable runner. Status is the sole
 * writable representation of actual lifecycle state; DOM mount is derived.
 */
export function useLightboxRuntimeState(
  photosInput: MaybeRefOrGetter<PhotoItem | readonly PhotoItem[]>,
  transitionOption?: MaybeRefOrGetter<LightboxTransitionOption | undefined>,
  minZoom?: number,
  imageAdapter?: MaybeRef<ImageAdapter | undefined>,
) {
  if (import.meta.env.DEV && !getCurrentInstance()) {
    console.warn('[nuxt-photo] useLightboxRuntimeState must be called inside a component setup()')
  }

  const photos = computed(() => {
    const value = toValue(photosInput)
    return Array.isArray(value) ? value : [value]
  })

  const globalDefaults = inject(LightboxDefaultsKey, undefined)
  const injectedImageAdapter = inject(ImageAdapterKey, null)
  const resolvedMinZoom = minZoom ?? globalDefaults?.minZoom
  const resolvedImageAdapter = computed(
    () => unref(imageAdapter) ?? injectedImageAdapter ?? createNativeImageAdapter(),
  )

  const reportAsyncError = useAsyncErrorReporter()
  const ownershipId = Symbol('nuxt-photo:lightbox-owner')
  const transitionConfig = { ...DEFAULT_TRANSITION_CONFIG }
  let requestedTransitionMode: TransitionMode = DEFAULT_TRANSITION_CONFIG.mode

  const reducedMotionQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
  const prefersReducedMotion = ref(!!reducedMotionQuery?.matches)

  function refreshTransitionConfig() {
    const option = toValue(transitionOption)
    requestedTransitionMode =
      typeof option === 'string' ? option : (option?.mode ?? DEFAULT_TRANSITION_CONFIG.mode)
    transitionConfig.autoThreshold =
      typeof option === 'object'
        ? (option.autoThreshold ?? DEFAULT_TRANSITION_CONFIG.autoThreshold)
        : DEFAULT_TRANSITION_CONFIG.autoThreshold
    transitionConfig.mode =
      prefersReducedMotion.value && requestedTransitionMode !== 'none'
        ? 'fade'
        : requestedTransitionMode
  }

  watch(
    () => {
      const option = toValue(transitionOption)
      return typeof option === 'object' ? [option.mode, option.autoThreshold] : option
    },
    refreshTransitionConfig,
    { immediate: true },
  )

  const onReducedMotionChange = (event: MediaQueryListEvent) => {
    prefersReducedMotion.value = event.matches
    refreshTransitionConfig()
  }
  reducedMotionQuery?.addEventListener('change', onReducedMotionChange)
  onBeforeUnmount(() => reducedMotionQuery?.removeEventListener('change', onReducedMotionChange))

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
  )

  const panzoom = usePanzoom(carousel.currentPhoto, areaMetrics, resolvedMinZoom)

  const motion = useLightboxMotion(
    carousel.activeIndex,
    carousel.currentPhoto,
    areaMetrics,
    carousel.getAbsoluteFrameRect,
    transitionConfig,
    prefersReducedMotion,
  )
  isZoomedIn = () => panzoom.isZoomedIn.value
  isInteractionLocked = () => motion.animating.value

  const syncGeometry = createGeometrySync(mediaAreaRef, areaMetrics)

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
  }

  async function reconcile() {
    while (true) {
      const target = desired

      try {
        if (target.kind === 'closed') {
          if (lifecycleStatus.value === 'closed') return

          lifecycleStatus.value = 'closing'
          await startRun((signal) => motion.close(closeCallbacks, signal))
          motion.setCloseDragY(0)
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
          motion.setCloseDragY(0)
          carousel.goTo(target.index, true)
          keydown.attach()

          const opened = await startRun((signal) =>
            motion.open(target.index, transitionCallbacks, signal),
          )
          if (!opened) {
            motion.resetClosedVisualState()
            keydown.detach()
            lifecycleStatus.value = 'closed'
          } else {
            lifecycleStatus.value = 'open'
          }
        }
      } catch (error) {
        if (isAbortError(error)) continue
        motion.resetClosedVisualState()
        keydown.detach()
        lifecycleStatus.value = 'closed'
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
      throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
    }

    const photo = currentPhotos[index]!
    motion.captureOpen(index, resolvedImageAdapter.value(photo, 'thumb').src)
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
    if (lifecycleStatus.value !== 'open' || motion.transitionInProgress.value) return
    carousel.goToNext()
  }

  function prev() {
    if (lifecycleStatus.value !== 'open' || motion.transitionInProgress.value) return
    carousel.goToPrev()
  }

  const gestures = useLightboxInputHandlers({
    state: {
      isOpen,
      animating: motion.animating,
      isZoomedIn: panzoom.isZoomedIn,
      zoomAllowed: panzoom.zoomAllowed,
      mediaAreaRef,
      currentPhoto: carousel.currentPhoto,
      areaMetrics,
      uiVisible: motion.uiVisible,
      panState: panzoom.panState,
      zoomState: panzoom.zoomState,
      transitionInProgress: motion.transitionInProgress,
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
      goToFirst: () => carousel.goTo(0),
      goToLast: () => carousel.goTo(Math.max(0, photos.value.length - 1)),
    },
    lifecycle: {
      setCloseDragY: motion.setCloseDragY,
      handleCloseGesture: motion.handleCloseGesture,
      close,
      reportAsyncError,
    },
  })
  const keydown = createKeydownBinding(gestures.onKeydown)

  const transitionCallbacks = {
    prepareActiveSlide,
    resetGestureState: () => gestures.resetGestureState(),
    cancelTapTimer: () => gestures.cancelTapTimer(),
    getThumbSrc: (photo: PhotoItem) => resolvedImageAdapter.value(photo, 'thumb').src,
    setImageLoadFailed: (failed: boolean, error?: unknown) => {
      activeImageLoadFailed.value = failed
      if (failed) devWarn('Active slide image failed to decode', error)
    },
    syncGeometry,
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    isZoomedIn: panzoom.isZoomedIn,
  }

  const closeCallbacks = transitionCallbacks

  watchPhotoCollection(photos, {
    activeIndex: carousel.activeIndex,
    isMounted: isOpen,
    goTo: carousel.goTo,
    close,
    reportAsyncError,
  })
  watch(carousel.activeIndex, () => {
    if (lifecycleStatus.value !== 'open') return
    reportAsyncError('prepare-active-slide', prepareActiveSlide(true))
  })
  useLightboxWindowLifecycle({
    isMounted: isOpen,
    cancelTapTimer: gestures.cancelTapTimer,
    detachKeydown: keydown.detach,
    syncGeometry,
    refreshZoomState: panzoom.refreshZoomState,
  })

  onBeforeUnmount(() => {
    desired = { kind: 'closed' }
    activeRun?.controller.abort()
    gestures.disposeGestureState()
    motion.resetClosedVisualState()
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
    imageAdapter: resolvedImageAdapter,

    zoomState: panzoom.zoomState,
    panState: panzoom.panState,
    isZoomedIn: panzoom.isZoomedIn,
    zoomAllowed: panzoom.zoomAllowed,

    animating: motion.animating,
    hiddenThumbIndex: motion.hiddenThumbIndex,
    activeImageLoadFailed,
    uiVisible: motion.uiVisible,
    closeDragY: motion.closeDragY,
    stageMounted: motion.stageMounted,
    activeImagePending: motion.activeImagePending,
    transitionInProgress: motion.transitionInProgress,

    gesturePhase: gestures.gesturePhase,

    mediaAreaRef,
    emblaRef: carousel.emblaRef,

    setThumbRef: motion.setThumbRef,
    setSlideZoomRef: panzoom.setSlideZoomRef,
    setSlideFrameRef: motion.setSlideFrameRef,
    setSlideImageRef: motion.setSlideImageRef,
    setOverlayRef: motion.setOverlayRef,
    setViewportRef: motion.setViewportRef,
    setControlsRef: motion.setControlsRef,
    setCaptionRef: motion.setCaptionRef,
    setTransitionFrameRef: motion.setTransitionFrameRef,
    setTransitionImageRef: motion.setTransitionImageRef,
    setTransitionShadowRef: motion.setTransitionShadowRef,

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
    handleBackdropClick: () => motion.handleBackdropClick(close),
    getSlideFrameStyle: carousel.getSlideFrameStyle,
    isSlideMediaMounted: (index: number) => {
      const count = photos.value.length
      return getMountedSlideIndices(carousel.activeIndex.value, count).has(index)
    },
  }
}
