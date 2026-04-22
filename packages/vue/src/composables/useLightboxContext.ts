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
  createTransitionMode,
  photoId,
  type AreaMetrics,
  type PhotoItem,
} from '@nuxt-photo/core'
import {
  createLightboxEngine,
  type LightboxTransitionOption,
} from '@nuxt-photo/engine'
import { usePanzoom } from './usePanzoom'
import { useCarousel } from './useCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'
import { useLightboxEngineState } from './useLightboxEngineState'
import {
  createGeometrySync,
  createKeydownBinding,
  createPreloadAround,
  syncEngineActiveIndex,
  syncEnginePhotos,
  syncEnginePresentationState,
  syncEngineViewportState,
  useLightboxWindowLifecycle,
  watchActiveIndexRuntime,
  watchPhotoCollection,
} from './lightboxContextRuntime'
import { DEFAULT_CAROUSEL_CONFIG } from './lightboxRuntimeTypes'
import { LightboxDefaultsKey } from '../provide/keys'

/**
 * Internal orchestration layer for the Vue lightbox runtime.
 *
 * Public customisation should go through `useLightboxProvider`; this function
 * wires together the engine (pure state) and the Vue-side composables
 * (reactive bindings, DOM refs, animations). The returned object is the
 * surface consumed by `<Lightbox>`, `<LightboxRoot>`, and recipes.
 *
 * ## Setup order (top to bottom of this function)
 *
 *   1. Normalise `photosInput` into a computed array ref.
 *   2. Build the engine + a reactive snapshot of its state.
 *   3. Resolve the transition config: user option > `prefers-reduced-motion`
 *      downgrade > default. `'none'` is respected even under reduced motion.
 *   4. Create geometry refs (`mediaAreaRef`, `areaMetrics`).
 *   5. Create domain composables, in dependency order:
 *        carousel   — Embla-backed paging, depends on photos + areaMetrics
 *        panzoom    — depends on `carousel.currentPhoto` + areaMetrics
 *        ghost      — depends on carousel (index + frame rect) for FLIP
 *   6. Declare the `open` / `close` / `next` / `prev` methods.
 *   7. Build gestures (takes references from every composable above).
 *   8. Attach keydown.
 *   9. Wire engine syncs + runtime watchers (see below).
 *  10. Return the public surface.
 *
 * ## Watcher graph
 *
 *   photos                         → syncEnginePhotos      (push to engine)
 *                                  → watchPhotoCollection  (navigate / close
 *                                                           if active removed)
 *
 *   carousel.activeIndex           → syncEngineActiveIndex (push to engine)
 *                                  → watchActiveIndexRuntime
 *                                        (panzoom reset, preload neighbours,
 *                                         refresh zoom state)
 *
 *   panzoom.{zoom,pan}State        → syncEngineViewportState
 *   ghost.{opacities, visibility}  → syncEnginePresentationState
 *
 *   useLightboxWindowLifecycle watches window visibility / resize to cancel
 *   pending taps, detach keydown, and resync geometry.
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
 * ## SSR
 *
 * Safe to call on the server: the engine runs, refs get their initial values,
 * and `useLightboxWindowLifecycle` / `createKeydownBinding` guard `window`
 * internally. Animations never fire because no user event reaches the server.
 *
 * Public API is exported at the bottom (`return { … }`) — everything above
 * the `return` is wiring.
 */
export function useLightboxContext(
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  transitionOption?: LightboxTransitionOption,
  minZoom?: number,
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
  const engine = createLightboxEngine({ photos: photos.value })
  const engineState = useLightboxEngineState(engine)

  const globalDefaults = inject(LightboxDefaultsKey, undefined)
  const resolvedMinZoom = minZoom ?? globalDefaults?.minZoom

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

  const carousel = useCarousel(
    photos,
    areaMetrics,
    DEFAULT_CAROUSEL_CONFIG,
    computed(() => engineState.isZoomedIn.value),
    engineState.animating,
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

  const syncGeometry = createGeometrySync(mediaAreaRef, areaMetrics, debug)
  const preloadAround = createPreloadAround(photos)
  // Suppresses `watchActiveIndexRuntime` side effects while `open()` runs —
  // the ghost transition callbacks handle the same work in the right order.
  const skipActiveIndexWatch = ref(false)

  async function open(photoOrIndex: PhotoItem | number = 0) {
    const index =
      typeof photoOrIndex === 'number'
        ? photoOrIndex
        : photos.value.findIndex(
            (photo) => photoId(photo) === photoId(photoOrIndex as PhotoItem),
          )

    skipActiveIndexWatch.value = true
    engine.open(index >= 0 ? index : 0)
    ghost.setCloseDragY(0)
    carousel.goTo(index >= 0 ? index : 0, true)
    keydown.attach()
    await ghost.open(index >= 0 ? index : 0, transitionCallbacks)
    engine.markOpened()
    preloadAround(index >= 0 ? index : 0)
    skipActiveIndexWatch.value = false
  }

  async function close() {
    engine.close()
    await ghost.close(closeCallbacks)
    engine.markClosed()
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

  const transitionCallbacks = {
    syncGeometry,
    refreshZoomState: panzoom.refreshZoomState,
    resetGestureState: () => gestures.resetGestureState(),
    cancelTapTimer: () => gestures.cancelTapTimer(),
  }

  const closeCallbacks = {
    ...transitionCallbacks,
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    isZoomedIn: panzoom.isZoomedIn,
  }

  // Keep the top-level composable orchestration-only.
  syncEnginePhotos(engine, photos)
  syncEngineActiveIndex(engine, carousel.activeIndex)
  syncEngineViewportState(engine, {
    zoomState: panzoom.zoomState,
    panState: panzoom.panState,
    isZoomedIn: panzoom.isZoomedIn,
    zoomAllowed: panzoom.zoomAllowed,
  })
  syncEnginePresentationState(engine, {
    gesturePhase: gestures.gesturePhase,
    animating: ghost.animating,
    ghostVisible: ghost.ghostVisible,
    ghostSrc: ghost.ghostSrc,
    hiddenThumbIndex: ghost.hiddenThumbIndex,
    overlayOpacity: ghost.overlayOpacity,
    mediaOpacity: ghost.mediaOpacity,
    chromeOpacity: ghost.chromeOpacity,
    uiVisible: ghost.uiVisible,
    closeDragY: ghost.closeDragY,
  })
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
    photos: engineState.photos,
    count: engineState.count,
    activeIndex: engineState.activeIndex,
    activePhoto: engineState.activePhoto,
    isOpen: engineState.isOpen,

    zoomState: engineState.zoomState,
    panState: engineState.panState,
    isZoomedIn: engineState.isZoomedIn,
    zoomAllowed: engineState.zoomAllowed,

    animating: engineState.animating,
    ghostVisible: engineState.ghostVisible,
    ghostSrc: engineState.ghostSrc,
    ghostStyle: ghost.ghostStyle,
    hiddenThumbIndex: engineState.hiddenThumbIndex,
    overlayOpacity: engineState.overlayOpacity,
    mediaOpacity: engineState.mediaOpacity,
    chromeOpacity: engineState.chromeOpacity,
    uiVisible: engineState.uiVisible,
    closeDragY: engineState.closeDragY,
    transitionInProgress: ghost.transitionInProgress,
    chromeStyle: ghost.chromeStyle,
    closeDragRatio: ghost.closeDragRatio,
    backdropStyle: ghost.backdropStyle,
    lightboxUiStyle: ghost.lightboxUiStyle,

    gesturePhase: engineState.gesturePhase,

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
    getSlideEffectStyle: carousel.getSlideEffectStyle,
  }
}
