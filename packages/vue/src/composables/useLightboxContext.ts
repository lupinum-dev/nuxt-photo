import {
  computed,
  getCurrentInstance,
  inject,
  ref,
  toValue,
  type MaybeRef,
} from 'vue'
import {
  createDebug,
  createNativeImageAdapter,
  createTransitionMode,
  loadImage,
  photoId,
  type AreaMetrics,
  type ImageAdapter,
  type LoadImageResult,
  type LightboxTransitionOption,
  type PhotoItem,
} from '@nuxt-photo/core'
import { usePanzoom } from './usePanzoom'
import { useCarousel } from './useCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'
import {
  createGeometrySync,
  createKeydownBinding,
  createPreloadAround,
  useLightboxWindowLifecycle,
  watchActiveIndexRuntime,
  watchPhotoCollection,
} from './lightboxWatchers'
import { ImageAdapterKey, LightboxDefaultsKey } from '../provide/keys'

/**
 * Internal coordinator for Vue lightbox state.
 *
 * Public customisation should go through `useLightboxProvider`; this function
 * wires the Vue-side composables together: reactive photo state, DOM refs,
 * Embla paging, pan/zoom, gestures, and ghost transitions.
 *
 * ## `skipActiveIndexWatch` (the one subtle bit)
 *
 * During `open()` we call both `carousel.goTo(index, true)` and
 * `ghost.open(index, …)`. Both would trigger the `watchActiveIndexRuntime`
 * side effects (panzoom reset, preload, zoom refresh) — but at the wrong time,
 * racing the ghost transition's own ordering. We set the flag to `true`
 * around the open sequence so the watcher becomes a no-op; the ghost
 * transition callbacks (`transitionCallbacks`) call the same side effects in
 * the correct order. Cleared to `false` once `ghost.open` resolves.
 *
 * Public API is exported at the bottom (`return { … }`) — everything above
 * the `return` is wiring.
 */
export function useLightboxContext(
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  transitionOption?: LightboxTransitionOption,
  minZoom?: number,
  imageAdapter?: ImageAdapter,
) {
  if (import.meta.env.DEV && !getCurrentInstance()) {
    console.warn(
      '[nuxt-photo] useLightboxContext must be called inside a component setup()',
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
  const transitionConfig = createTransitionMode()

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

  if (typeof window !== 'undefined') {
    window.__NUXT_PHOTO_DEBUG__ = debug.flags
  }

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)
  const activeImageLoadFailed = ref(false)
  let isZoomedIn = () => false
  let isInteractionLocked = () => false
  let imageLoadToken = 0

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
  // Suppresses `watchActiveIndexRuntime` side effects while `open()` runs —
  // the ghost transition callbacks handle the same work in the right order.
  const skipActiveIndexWatch = ref(false)
  let pendingOpen: Promise<boolean> | null = null

  async function settlePendingOpen() {
    if (!pendingOpen) return

    try {
      await pendingOpen
    } catch {
      // Let close/open recovery continue even when the previous transition threw.
    }
  }

  async function open(photoOrIndex: PhotoItem | number = 0) {
    await settlePendingOpen()

    const currentPhotos = photos.value
    if (currentPhotos.length === 0) return

    const index =
      typeof photoOrIndex === 'number'
        ? photoOrIndex
        : currentPhotos.findIndex(
            (photo) => photoId(photo) === photoId(photoOrIndex as PhotoItem),
          )

    const targetIndex = index >= 0 ? index : 0

    skipActiveIndexWatch.value = true
    try {
      ghost.setCloseDragY(0)
      carousel.goTo(targetIndex, true)
      keydown.attach()

      pendingOpen = ghost.open(targetIndex, transitionCallbacks)
      const opened = await pendingOpen
      if (!opened) {
        keydown.detach()
        return
      }

      preloadAround(targetIndex)
    } finally {
      pendingOpen = null
      skipActiveIndexWatch.value = false
    }
  }

  async function close() {
    await settlePendingOpen()

    if (!ghost.lightboxMounted.value) return

    await ghost.close(closeCallbacks)
    ghost.setCloseDragY(0)
    keydown.detach()
  }

  function next() {
    if (ghost.transitionInProgress.value) return
    carousel.goToNext()
  }

  function prev() {
    if (ghost.transitionInProgress.value) return
    carousel.goToPrev()
  }

  const gestures = useGestures(
    {
      lightboxMounted: ghost.lightboxMounted,
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
      setCloseDragY: ghost.setCloseDragY,
      transitionInProgress: ghost.transitionInProgress,

      panzoomMotion: panzoom.panzoomMotion,
      setPanzoomImmediate: panzoom.setPanzoomImmediate,
      startPanzoomSpring: panzoom.startPanzoomSpring,
      clampPan: panzoom.clampPan,
      clampPanWithResistance: panzoom.clampPanWithResistance,
      applyWheelZoom: panzoom.applyWheelZoom,
      toggleZoom: panzoom.toggleZoom,
      getPanBounds: panzoom.getPanBounds,

      goToNext: carousel.goToNext,
      goToPrev: carousel.goToPrev,
      goTo: carousel.goTo,
      selectedSnap: carousel.selectedSnap,

      handleCloseGesture: ghost.handleCloseGesture,
      close,
    },
    debug,
  )
  const keydown = createKeydownBinding(gestures.onKeydown)

  async function loadActiveSlideImage(
    photo: PhotoItem,
  ): Promise<LoadImageResult> {
    const token = ++imageLoadToken
    activeImageLoadFailed.value = false

    const result = await loadImage(
      resolvedImageAdapter.value(photo, 'slide').src,
    )
    if (token !== imageLoadToken) return result

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
    syncGeometry,
    refreshZoomState: panzoom.refreshZoomState,
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
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    isZoomedIn: panzoom.isZoomedIn,
  }

  watchPhotoCollection(photos, {
    activeIndex: carousel.activeIndex,
    lightboxMounted: ghost.lightboxMounted,
    goTo: carousel.goTo,
    close,
  })
  watchActiveIndexRuntime(carousel.activeIndex, {
    lightboxMounted: ghost.lightboxMounted,
    skipActiveIndexWatch,
    setActiveSlideIndex: panzoom.setActiveSlideIndex,
    refreshZoomState: panzoom.refreshZoomState,
    syncGeometry,
    preloadAround,
    debug,
  })
  useLightboxWindowLifecycle({
    lightboxMounted: ghost.lightboxMounted,
    cancelTapTimer: gestures.cancelTapTimer,
    detachKeydown: keydown.detach,
    syncGeometry,
    refreshZoomState: panzoom.refreshZoomState,
    debug,
  })

  return {
    photos,
    count: computed(() => photos.value.length),
    activeIndex: carousel.activeIndex,
    activePhoto: carousel.currentPhoto,
    isOpen: computed(() => ghost.lightboxMounted.value),

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
