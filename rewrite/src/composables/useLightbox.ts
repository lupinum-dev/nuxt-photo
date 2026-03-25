import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import type { AreaMetrics, Photo } from '../types'
import { isUsableRect } from '../utils/geometry'
import { ensureImageLoaded } from '../utils/image'
import { lockBodyScroll } from '../utils/body-scroll'
import { nextFrame } from '../utils/timing'
import { usePanzoom } from './usePanzoom'
import { useSlideCarousel } from './useSlideCarousel'
import { useGhostTransition } from './useGhostTransition'
import { useGestures } from './useGestures'
import { createDebug } from './useDebug'
import { createTransitionMode } from './useTransitionMode'

declare global {
  interface Window {
    __lightbox?: {
      debug: ReturnType<typeof createDebug>['flags']
      transitionMode: string
      autoThreshold: number
    }
  }
}

export function useLightbox(photos: Photo[]) {
  const debug = createDebug()
  const transitionConfig = createTransitionMode()

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)

  const carousel = useSlideCarousel(photos, areaMetrics, debug)
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
    carousel.slideDragOffset.value = 0
    ghost.closeDragY.value = 0
    await ghost.open(index, transitionCallbacks)
    skipActiveIndexWatch = false
  }

  async function closeLightbox() {
    await ghost.close(closeCallbacks)
    carousel.slideDragOffset.value = 0
    ghost.closeDragY.value = 0
  }

  async function next() {
    if (ghost.controlsDisabled.value) return
    ghost.animating.value = true
    try {
      await carousel.commitSlideChange(1)
    } finally {
      ghost.animating.value = false
    }
  }

  async function prev() {
    if (ghost.controlsDisabled.value) return
    ghost.animating.value = true
    try {
      await carousel.commitSlideChange(-1)
    } finally {
      ghost.animating.value = false
    }
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
    slideDragOffset: carousel.slideDragOffset,
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

    commitSlideChange: carousel.commitSlideChange,
    resolveSlideTarget: carousel.resolveSlideTarget,
    animateSlideTo: carousel.animateSlideTo,

    handleCloseGesture: ghost.handleCloseGesture,
    close: closeLightbox,
  }, debug)

  // Computed styles that depend on multiple composables
  const mediaTrackStyle = computed<CSSProperties>(() => {
    const area = areaMetrics.value
    const width = area?.width ?? 0
    const height = area?.height ?? 0

    return {
      width: `${width * 3}px`,
      height: `${height}px`,
      opacity: String(ghost.mediaOpacity.value),
      transform: `translate3d(${-width + carousel.slideDragOffset.value}px, 0, 0)`,
    }
  })

  const slideCellStyle = computed<CSSProperties>(() => {
    const area = areaMetrics.value
    return {
      width: `${area?.width ?? 0}px`,
      height: `${area?.height ?? 0}px`,
    }
  })

  // Watchers
  watch(ghost.lightboxMounted, (mounted) => {
    debug.log('transitions', `lightboxMounted → ${mounted}`)
    lockBodyScroll(mounted)
  })

  watch(carousel.activeIndex, async (newIndex) => {
    if (!ghost.lightboxMounted.value || skipActiveIndexWatch) return

    debug.log('slides', `activeIndex changed → ${newIndex} ("${carousel.currentPhoto.value.title}")`)

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

      // Expose debug harness on window
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
      console.log('  __lightbox.autoThreshold = 0.4        // visibility % for auto mode')

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
    slideViews: carousel.slideViews,
    slideDragOffset: carousel.slideDragOffset,

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

    // Computed styles
    mediaTrackStyle,
    slideCellStyle,

    // Refs
    mediaAreaRef,

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
    getSlideZoomStyle: carousel.getSlideZoomStyle,
  }
}
