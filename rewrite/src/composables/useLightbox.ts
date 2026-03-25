import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CarouselConfig, Photo } from '../types'
import { ensureImageLoaded } from '../utils/image'
import { lockBodyScroll } from '../utils/body-scroll'
import { nextFrame } from '../utils/timing'
import { usePanzoom } from './usePanzoom'
import { useSlideCarousel } from './useSlideCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'
import { createDebug } from './useDebug'
import { createTransitionMode } from './useTransitionMode'
import type { AreaMetrics } from '../types'
import { isUsableRect } from '../utils/geometry'

declare global {
  interface Window {
    __lightbox?: {
      debug: ReturnType<typeof createDebug>['flags']
      transitionMode: string
      autoThreshold: number
      carousel: CarouselConfig
    }
  }
}

export function useLightbox(photos: Photo[]) {
  const debug = createDebug()
  const transitionConfig = createTransitionMode()

  const carouselConfig: CarouselConfig = {
    style: 'classic',
    parallax: { amount: 0.3, scale: 0.92, opacity: 0.5 },
    fade: { minOpacity: 0 },
  }

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)

  // Proxy refs to break circular init dependency:
  // carousel needs isZoomedIn (from panzoom) and animating (from ghost),
  // but panzoom needs currentPhoto (from carousel)
  const isZoomedInProxy = ref(false)
  const animatingProxy = ref(false)

  const carousel = useSlideCarousel(
    photos,
    areaMetrics,
    carouselConfig,
    computed(() => isZoomedInProxy.value),
    animatingProxy,
    debug,
  )

  const panzoom = usePanzoom(carousel.currentPhoto, areaMetrics, debug)

  const ghost = useGhostTransition(
    photos,
    carousel.activeIndex,
    carousel.currentPhoto,
    areaMetrics,
    carousel.getAbsoluteFrameRect,
    debug,
    transitionConfig,
  )

  // Sync proxy refs
  watch(panzoom.isZoomedIn, (v) => { isZoomedInProxy.value = v }, { immediate: true })
  watch(ghost.animating, (v) => { animatingProxy.value = v }, { immediate: true })

  function syncGeometry() {
    const mediaAreaEl = mediaAreaRef.value
    if (!mediaAreaEl) {
      debug.warn('geometry', 'syncGeometry: mediaAreaRef is null')
      return null
    }

    const rect = mediaAreaEl.getBoundingClientRect()
    if (!isUsableRect(rect)) {
      debug.warn('geometry', 'syncGeometry: rect not usable', { left: rect.left, top: rect.top, width: rect.width, height: rect.height })
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

  async function openLightbox(index: number) {
    skipActiveIndexWatch = true
    ghost.closeDragY.value = 0
    // Navigate Embla to the target slide instantly before opening
    carousel.goTo(index, true)
    await ghost.open(index, transitionCallbacks)
    skipActiveIndexWatch = false
  }

  async function closeLightbox() {
    await ghost.close(closeCallbacks)
    ghost.closeDragY.value = 0
  }

  function next() {
    if (ghost.controlsDisabled.value) return
    carousel.goToNext()
  }

  function prev() {
    if (ghost.controlsDisabled.value) return
    carousel.goToPrev()
  }

  const gestures = useGestures({
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
    controlsDisabled: ghost.controlsDisabled,

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
    close: closeLightbox,
  }, debug)

  // Watchers
  watch(ghost.lightboxMounted, (mounted) => {
    debug.log('transitions', `lightboxMounted → ${mounted}`)
    lockBodyScroll(mounted)
  })

  watch(carousel.activeIndex, async (newIndex) => {
    if (!ghost.lightboxMounted.value || skipActiveIndexWatch) return

    debug.log('slides', `activeIndex changed → ${newIndex} ("${carousel.currentPhoto.value.title}")`)

    panzoom.setActiveSlideIndex(newIndex)

    await nextTick()
    await nextFrame()
    syncGeometry()
    panzoom.refreshZoomState(true)
    void ensureImageLoaded(carousel.currentPhoto.value.full)
  })

  // Lifecycle
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', gestures.onKeydown)
      window.addEventListener('resize', onResize)

      window.__lightbox = {
        debug: debug.flags,
        get transitionMode() { return transitionConfig.mode },
        set transitionMode(v: string) {
          if (v === 'flip' || v === 'fade' || v === 'auto' || v === 'none') {
            transitionConfig.mode = v
            console.log(`[lightbox] transitionMode set to "${v}"`)
          } else {
            console.warn(`[lightbox] invalid transitionMode "${v}", use: flip | fade | auto | none`)
          }
        },
        get autoThreshold() { return transitionConfig.autoThreshold },
        set autoThreshold(v: number) {
          transitionConfig.autoThreshold = v
          console.log(`[lightbox] autoThreshold set to ${v}`)
        },
        carousel: carouselConfig,
      }

      console.log(
        '%c[lightbox] Debug harness loaded. Use window.__lightbox to control:',
        'color: #a78bfa; font-weight: bold',
      )
      console.log('  __lightbox.debug.all = true          // enable all logging')
      console.log('  __lightbox.debug.transitions = true   // transitions only')
      console.log('  __lightbox.debug.gestures = true      // gestures only')
      console.log('  __lightbox.debug.zoom = true          // zoom/pan only')
      console.log('  __lightbox.debug.slides = true        // slide changes only')
      console.log('  __lightbox.debug.geometry = true      // geometry sync only')
      console.log('  __lightbox.transitionMode = "auto"    // auto | flip | fade | none')
      console.log('  __lightbox.autoThreshold = 0.55       // visibility % for auto mode')
      console.log('  __lightbox.carousel.style = "classic" // classic | parallax | fade')

      for (const photo of photos) {
        void ensureImageLoaded(photo.full)
      }
    }
  })

  onBeforeUnmount(() => {
    gestures.cancelTapTimer()

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', gestures.onKeydown)
      window.removeEventListener('resize', onResize)
      delete window.__lightbox
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

    // Carousel
    activeIndex: carousel.activeIndex,
    currentPhoto: carousel.currentPhoto,

    // Panzoom
    zoomState: panzoom.zoomState,
    panState: panzoom.panState,
    isZoomedIn: panzoom.isZoomedIn,
    zoomAllowed: panzoom.zoomAllowed,

    // Ghost transition
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
    controlsDisabled: ghost.controlsDisabled,
    chromeStyle: ghost.chromeStyle,
    closeDragRatio: ghost.closeDragRatio,
    backdropStyle: ghost.backdropStyle,
    lightboxUiStyle: ghost.lightboxUiStyle,

    // Gestures
    gesturePhase: gestures.gesturePhase,

    // Refs
    mediaAreaRef,
    emblaRef: carousel.emblaRef,

    // Ref callbacks
    setThumbRef: ghost.setThumbRef,
    setSlideZoomRef: panzoom.setSlideZoomRef,

    // Event handlers
    onMediaPointerDown: gestures.onMediaPointerDown,
    onMediaPointerMove: gestures.onMediaPointerMove,
    onMediaPointerUp: gestures.onMediaPointerUp,
    onMediaPointerCancel: gestures.onMediaPointerCancel,
    onWheel: gestures.onWheel,

    // Actions
    open: openLightbox,
    close: closeLightbox,
    next,
    prev,
    toggleZoom: panzoom.toggleZoom,
    handleBackdropClick: () => ghost.handleBackdropClick(closeLightbox),
    getSlideFrameStyle: carousel.getSlideFrameStyle,
    getSlideEffectStyle: carousel.getSlideEffectStyle,
  }
}
