import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRef,
} from 'vue'
import {
  ensureImageLoaded,
  lockBodyScroll,
  nextFrame,
  createDebug,
  createTransitionMode,
  isUsableRect,
  photoId,
  type PhotoItem,
  type AreaMetrics,
} from '@nuxt-photo/core'
import {
  createLightboxEngine,
  type CarouselConfig,
  type LightboxTransitionOption,
} from '@nuxt-photo/engine'
import { usePanzoom } from './usePanzoom'
import { useCarousel } from './useCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'
import { useLightboxEngineState } from './useLightboxEngineState'
import { LightboxDefaultsKey } from '../provide/keys'

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

  const carouselConfig: CarouselConfig = {
    style: 'classic',
    parallax: { amount: 0.3, scale: 0.92, opacity: 0.5 },
    fade: { minOpacity: 0 },
  }

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)

  const carousel = useCarousel(
    photos,
    areaMetrics,
    carouselConfig,
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

  function syncGeometry() {
    const mediaAreaEl = mediaAreaRef.value
    if (!mediaAreaEl) {
      debug.warn('geometry', 'syncGeometry: mediaAreaRef is null')
      return null
    }

    const rect = mediaAreaEl.getBoundingClientRect()
    if (!isUsableRect(rect)) {
      debug.warn('geometry', 'syncGeometry: rect not usable', {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      })
      return null
    }

    areaMetrics.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }

    debug.log('geometry', 'syncGeometry:', areaMetrics.value)
    return areaMetrics.value
  }

  let skipActiveIndexWatch = false

  // Track whether the keyboard listener is currently attached
  let keydownAttached = false

  function attachKeydown() {
    if (typeof window === 'undefined' || keydownAttached) return
    window.addEventListener('keydown', gestures.onKeydown)
    keydownAttached = true
  }

  function detachKeydown() {
    if (typeof window === 'undefined' || !keydownAttached) return
    window.removeEventListener('keydown', gestures.onKeydown)
    keydownAttached = false
  }

  function preloadAround(index: number) {
    const candidates = [index - 1, index, index + 1]

    for (const candidate of candidates) {
      if (candidate < 0 || candidate >= photos.value.length) continue
      const photo = photos.value[candidate]
      if (!photo) continue
      void ensureImageLoaded(photo.src)
    }
  }

  async function open(photoOrIndex: PhotoItem | number = 0) {
    const index =
      typeof photoOrIndex === 'number'
        ? photoOrIndex
        : photos.value.findIndex(
            (photo) => photoId(photo) === photoId(photoOrIndex as PhotoItem),
          )

    skipActiveIndexWatch = true
    engine.open(index >= 0 ? index : 0)
    ghost.setCloseDragY(0)
    carousel.goTo(index >= 0 ? index : 0, true)
    attachKeydown()
    await ghost.open(index >= 0 ? index : 0, transitionCallbacks)
    engine.markOpened()
    preloadAround(index >= 0 ? index : 0)
    skipActiveIndexWatch = false
  }

  async function close() {
    engine.close()
    await ghost.close(closeCallbacks)
    engine.markClosed()
    ghost.setCloseDragY(0)
    detachKeydown()
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

  watch(ghost.lightboxMounted, (mounted) => {
    debug.log('transitions', `lightboxMounted → ${mounted}`)
    lockBodyScroll(mounted)
  })

  watch(
    photos,
    (nextPhotos) => {
      engine.setPhotos(nextPhotos)
    },
    { immediate: true },
  )

  watch(
    carousel.activeIndex,
    (index) => {
      engine.setActiveIndex(index)
    },
    { immediate: true },
  )

  watch(
    [
      panzoom.zoomState,
      panzoom.panState,
      panzoom.isZoomedIn,
      panzoom.zoomAllowed,
    ],
    ([zoomState, panState, isZoomedIn, zoomAllowed]) => {
      engine.setZoomState(zoomState)
      engine.setPanState(panState)
      engine.setZoomFlags({ isZoomedIn, zoomAllowed })
    },
    { immediate: true },
  )

  watch(
    [
      gestures.gesturePhase,
      ghost.animating,
      ghost.ghostVisible,
      ghost.ghostSrc,
      ghost.hiddenThumbIndex,
      ghost.overlayOpacity,
      ghost.mediaOpacity,
      ghost.chromeOpacity,
      ghost.uiVisible,
      ghost.closeDragY,
    ],
    ([
      gesturePhase,
      animating,
      ghostVisible,
      ghostSrc,
      hiddenThumbIndex,
      overlayOpacity,
      mediaOpacity,
      chromeOpacity,
      uiVisible,
      closeDragY,
    ]) => {
      engine.setGesturePhase(gesturePhase)
      engine.setAnimating(animating)
      engine.setUiVisible(uiVisible)
      engine.setGhostState({
        ghostVisible,
        ghostSrc,
        hiddenThumbIndex,
        overlayOpacity,
        mediaOpacity,
        chromeOpacity,
        closeDragY,
      })
    },
    { immediate: true },
  )

  // Watch photos array — only close if the active photo was removed; otherwise maintain position
  watch(photos, (newPhotos, oldPhotos) => {
    if (!newPhotos || !oldPhotos) return

    const newIds = new Set(newPhotos.map(photoId))
    const oldIds = new Set(oldPhotos.map(photoId))

    // No change in IDs
    if (
      newIds.size === oldIds.size &&
      [...newIds].every((id) => oldIds.has(id))
    )
      return

    const activePhoto = carousel.currentPhoto.value
    const activeId = activePhoto ? photoId(activePhoto) : null

    if (!activeId || !newIds.has(activeId)) {
      // Active photo was removed or array is empty — close
      if (ghost.lightboxMounted.value) {
        void close()
      }
      carousel.goTo(0, true)
      return
    }

    // Active photo still exists — jump to its new index
    const newIndex = newPhotos.findIndex((p) => photoId(p) === activeId)
    if (newIndex !== -1 && newIndex !== carousel.activeIndex.value) {
      carousel.goTo(newIndex, true)
    }
  })

  watch(carousel.activeIndex, async (newIndex) => {
    if (!ghost.lightboxMounted.value || skipActiveIndexWatch) return

    debug.log('slides', `activeIndex changed → ${newIndex}`)

    panzoom.setActiveSlideIndex(newIndex)

    await nextTick()
    await nextFrame()
    syncGeometry()
    panzoom.refreshZoomState(true)
    preloadAround(newIndex)
  })

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize)
    }
  })

  onBeforeUnmount(() => {
    gestures.cancelTapTimer()
    detachKeydown()

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
    }

    if (typeof document !== 'undefined') {
      lockBodyScroll(false)
    }
  })

  function onResize() {
    if (!ghost.lightboxMounted.value) return
    debug.log('geometry', 'window resize')
    syncGeometry()
    panzoom.refreshZoomState(false)
  }

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
