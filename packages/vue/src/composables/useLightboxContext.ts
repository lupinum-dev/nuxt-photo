import { computed, nextTick, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRef } from 'vue'
import {
  ensureImageLoaded,
  lockBodyScroll,
  nextFrame,
  createDebug,
  createTransitionMode,
  isUsableRect,
  type CarouselConfig,
  type PhotoItem,
  type AreaMetrics,
} from '@nuxt-photo/core'
import { usePanzoom } from './usePanzoom'
import { useCarousel } from './useCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'

export function useLightboxContext(photosInput: MaybeRef<PhotoItem | PhotoItem[]>) {
  const photos = computed(() => {
    const value = toValue(photosInput)
    return Array.isArray(value) ? value : [value]
  })
  const count = computed(() => photos.value.length)

  const debug = createDebug()
  const transitionConfig = createTransitionMode()

  if (typeof window !== 'undefined') {
    ;(window as any).__NUXT_PHOTO_DEBUG__ = debug.flags
  }

  const carouselConfig: CarouselConfig = {
    style: 'classic',
    parallax: { amount: 0.3, scale: 0.92, opacity: 0.5 },
    fade: { minOpacity: 0 },
  }

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)

  const isZoomedInProxy = ref(false)
  const animatingProxy = ref(false)

  const carousel = useCarousel(
    photos,
    areaMetrics,
    carouselConfig,
    computed(() => isZoomedInProxy.value),
    animatingProxy,
    debug,
  )

  const panzoom = usePanzoom(carousel.currentPhoto, areaMetrics, debug)

  const ghost = useGhostTransition(
    photos.value,
    carousel.activeIndex,
    carousel.currentPhoto,
    areaMetrics,
    carousel.getAbsoluteFrameRect,
    debug,
    transitionConfig,
  )

  watch(panzoom.isZoomedIn, (value) => { isZoomedInProxy.value = value }, { immediate: true })
  watch(ghost.animating, (value) => { animatingProxy.value = value }, { immediate: true })

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

  let gestures!: ReturnType<typeof useGestures>

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

  let skipActiveIndexWatch = false

  async function open(photoOrIndex: PhotoItem | number = 0) {
    const index = typeof photoOrIndex === 'number'
      ? photoOrIndex
      : photos.value.findIndex(photo => photo === photoOrIndex || photo.id === photoOrIndex.id)

    skipActiveIndexWatch = true
    ghost.closeDragY.value = 0
    carousel.goTo(index >= 0 ? index : 0, true)
    await ghost.open(index >= 0 ? index : 0, transitionCallbacks)
    skipActiveIndexWatch = false
  }

  async function close() {
    await ghost.close(closeCallbacks)
    ghost.closeDragY.value = 0
  }

  function next() {
    if (ghost.transitionInProgress.value) return
    carousel.goToNext()
  }

  function prev() {
    if (ghost.transitionInProgress.value) return
    carousel.goToPrev()
  }

  gestures = useGestures({
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
    closeDragY: ghost.closeDragY,
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
  }, debug)

  watch(ghost.lightboxMounted, (mounted) => {
    debug.log('transitions', `lightboxMounted → ${mounted}`)
    lockBodyScroll(mounted)
  })

  watch(photos, async () => {
    if (ghost.lightboxMounted.value) {
      await close()
    }
    carousel.goTo(0, true)
  })

  watch(carousel.activeIndex, async (newIndex) => {
    if (!ghost.lightboxMounted.value || skipActiveIndexWatch) return

    debug.log('slides', `activeIndex changed → ${newIndex}`)

    panzoom.setActiveSlideIndex(newIndex)

    await nextTick()
    await nextFrame()
    syncGeometry()
    panzoom.refreshZoomState(true)
    void ensureImageLoaded(carousel.currentPhoto.value.src)
  })

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', gestures.onKeydown)
      window.addEventListener('resize', onResize)

      for (const photo of photos.value) {
        void ensureImageLoaded(photo.src)
      }
    }
  })

  onBeforeUnmount(() => {
    gestures.cancelTapTimer()

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', gestures.onKeydown)
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
    photos,
    count,
    activeIndex: carousel.activeIndex,
    activePhoto: carousel.currentPhoto,
    currentPhoto: carousel.currentPhoto,
    isOpen: computed(() => ghost.lightboxMounted.value),

    zoomState: panzoom.zoomState,
    panState: panzoom.panState,
    isZoomedIn: panzoom.isZoomedIn,
    zoomAllowed: panzoom.zoomAllowed,

    lightboxMounted: ghost.lightboxMounted,
    animating: ghost.animating,
    ghostVisible: ghost.ghostVisible,
    ghostSrc: ghost.ghostSrc,
    ghostStyle: ghost.ghostStyle,
    hiddenThumbIndex: ghost.hiddenThumbIndex,
    overlayOpacity: ghost.overlayOpacity,
    mediaOpacity: ghost.mediaOpacity,
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
    getSlideEffectStyle: carousel.getSlideEffectStyle,
  }
}
