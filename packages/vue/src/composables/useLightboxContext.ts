import { computed, getCurrentInstance, inject, nextTick, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRef } from 'vue'
import {
  ensureImageLoaded,
  lockBodyScroll,
  nextFrame,
  createDebug,
  createTransitionMode,
  isUsableRect,
  photoId,
  type CarouselConfig,
  type PhotoItem,
  type AreaMetrics,
  type TransitionMode,
  type TransitionModeConfig,
} from '@nuxt-photo/core'
import { usePanzoom } from './usePanzoom'
import { useCarousel } from './useCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'
import { LightboxDefaultsKey } from '../provide/keys'
import { isDev } from '../utils/isDev'

export type LightboxTransitionOption = TransitionMode | TransitionModeConfig

export function useLightboxContext(
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  transitionOption?: LightboxTransitionOption,
  minZoom?: number,
) {
  if (isDev() && !getCurrentInstance()) {
    console.warn('[nuxt-photo] useLightboxContext must be called inside a component setup()')
  }

  const photos = computed(() => {
    const value = toValue(photosInput)
    return Array.isArray(value) ? value : [value]
  })
  const count = computed(() => photos.value.length)

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
      transitionConfig.autoThreshold = transitionOption.autoThreshold
    }
  }

  // Respect prefers-reduced-motion (overrides 'auto' and 'flip', but not explicit 'none')
  if (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && transitionConfig.mode !== 'none'
  ) {
    transitionConfig.mode = 'fade'
  }

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

  const panzoom = usePanzoom(carousel.currentPhoto, areaMetrics, debug, resolvedMinZoom)

  const ghost = useGhostTransition(
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

  async function open(photoOrIndex: PhotoItem | number = 0) {
    const index = typeof photoOrIndex === 'number'
      ? photoOrIndex
      : photos.value.findIndex(photo => photoId(photo) === photoId(photoOrIndex as PhotoItem))

    skipActiveIndexWatch = true
    ghost.setCloseDragY(0)
    carousel.goTo(index >= 0 ? index : 0, true)
    attachKeydown()
    await ghost.open(index >= 0 ? index : 0, transitionCallbacks)
    skipActiveIndexWatch = false
  }

  async function close() {
    await ghost.close(closeCallbacks)
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
  }, debug)

  watch(ghost.lightboxMounted, (mounted) => {
    debug.log('transitions', `lightboxMounted → ${mounted}`)
    lockBodyScroll(mounted)
  })

  // Watch photos array — only close if the active photo was removed; otherwise maintain position
  watch(photos, (newPhotos, oldPhotos) => {
    if (!newPhotos || !oldPhotos) return

    const newIds = new Set(newPhotos.map(photoId))
    const oldIds = new Set(oldPhotos.map(photoId))

    // No change in IDs
    if (newIds.size === oldIds.size && [...newIds].every(id => oldIds.has(id))) return

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
    const newIndex = newPhotos.findIndex(p => photoId(p) === activeId)
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
    void ensureImageLoaded(carousel.currentPhoto.value.src)
  })

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize)

      for (const photo of photos.value) {
        void ensureImageLoaded(photo.src)
      }
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
    photos,
    count,
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
