import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'
import {
  DEFAULT_TRANSITION_CONFIG,
  type AreaMetrics,
  type LightboxNavigationMode,
  type LightboxTransitionOption,
  type ResolvedPhotoItem as PhotoItem,
} from '../core/index'
import { usePanzoom } from './panzoom'
import { useCarousel } from './carousel'
import { useLightboxMotion } from './transitions/runtime'
import { useLightboxInputHandlers } from './input/pointer'
import { createGeometrySync, createKeydownBinding, useLightboxWindowLifecycle } from './watchers'
import { useGalleryRuntime } from '../gallery/runtime'
import { usePhotoConfig } from '../config'
import { resolvePhotoImage } from '../providers/resolve'
import type { LightboxLifecycleStatus } from '../provide/keys'
import { devWarn } from '../core/env'
import { isAbortError } from './transitions/animation'
import { useAsyncErrorReporter } from '../internal/asyncErrors'
import {
  acquireLightboxOwnership,
  releaseLightboxOwnership,
  ownsLightboxScreen,
} from '../internal/lightboxOwnership'
import { createLightboxHistory, initialPhotoId } from './history'

export function getMountedSlideIndices(
  active: number,
  count: number,
  leaving: Iterable<number> = [],
  neighboursReady = true,
) {
  if (count <= 0) return new Set<number>()
  const mounted = new Set<number>()
  for (let offset = neighboursReady ? -1 : 0; offset <= (neighboursReady ? 1 : 0); offset++)
    mounted.add((((active + offset) % count) + count) % count)
  // A photo that is still fading out keeps its image until the fade ends.
  for (const index of leaving) if (index < count) mounted.add(index)
  return mounted
}

export function resolveTransitionConfig(
  option: LightboxTransitionOption | undefined,
  reducedMotion: boolean,
) {
  const config = { ...DEFAULT_TRANSITION_CONFIG }
  if (typeof option === 'string') {
    config.mode = option
  } else if (option) {
    config.mode = option.mode
    config.autoThreshold = option.autoThreshold ?? DEFAULT_TRANSITION_CONFIG.autoThreshold
  }
  if (reducedMotion && config.mode !== 'none') config.mode = 'fade'
  return config
}

/**
 * Internal Vue lightbox state.
 *
 * Public customisation should go through `provideLightbox`; this function
 * wires the Vue-side composables together: reactive photo state, DOM refs,
 * Embla paging, pan/zoom, gestures, and DOM-owned transitions.
 * Lifecycle intent is reconciled by one abortable runner. The gallery owns identity and visibility;
 * lifecycle status only coordinates animations and DOM mounting.
 */
export function useLightboxRuntimeState(
  photosInput: MaybeRefOrGetter<PhotoItem | readonly PhotoItem[]>,
  transitionOption?: MaybeRefOrGetter<LightboxTransitionOption | undefined>,
  minZoom?: number,
  navigationOption?: MaybeRefOrGetter<LightboxNavigationMode | undefined>,
) {
  if (import.meta.env.DEV && !getCurrentInstance()) {
    console.warn('[nuxt-photo] useLightboxRuntimeState must be called inside a component setup()')
  }

  const photos = computed(() => {
    const value = toValue(photosInput)
    return Array.isArray(value) ? value : [value]
  })

  const gallery = useGalleryRuntime(photos)
  const config = usePhotoConfig()
  const initialId = initialPhotoId(
    typeof window === 'undefined' ? config.value.initialUrl : window.location.href,
    config.value.lightbox.deepLink,
  )
  const initialIndex = photos.value.findIndex((photo) => photo.id === initialId)
  const initialOpening = ref(initialIndex >= 0)
  if (initialOpening.value) gallery.requestIndex(initialIndex)
  const rootRef = ref<HTMLElement | null>(null)
  const resolvedMinZoom = minZoom ?? config.value.lightbox.minZoom

  const reportAsyncError = useAsyncErrorReporter()
  const ownershipId = Symbol('nuxt-photo:lightbox-owner')
  const reducedMotion = ref(false)
  const motionQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
  const syncReducedMotion = () => {
    reducedMotion.value = motionQuery?.matches ?? false
  }
  syncReducedMotion()
  motionQuery?.addEventListener('change', syncReducedMotion)

  const transitionConfig = computed(() => {
    if (initialOpening.value) return { ...DEFAULT_TRANSITION_CONFIG, mode: 'none' as const }
    return resolveTransitionConfig(
      toValue(transitionOption) ?? config.value.lightbox.transition,
      reducedMotion.value,
    )
  })
  const navigationMode = computed(
    (): LightboxNavigationMode =>
      toValue(navigationOption) ?? config.value.lightbox.navigation ?? 'slide',
  )

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)
  const frameAreaMetrics = ref<AreaMetrics | null>(null)
  const lifecycleStatus = ref<LightboxLifecycleStatus>(initialOpening.value ? 'opening' : 'closed')
  const loadedSlides = ref(new Set<PhotoItem>())
  const prefetchedAround = ref(-1)
  const prefetched = new Set<string>()
  const activeImageLoadFailed = ref(false)
  let isZoomedIn = () => false
  let isInteractionLocked = () => false

  const carousel = useCarousel(gallery, areaMetrics, frameAreaMetrics, {
    isZoomedIn: () => isZoomedIn(),
    isInteractionLocked: () => isInteractionLocked(),
    navigationMode: () => navigationMode.value,
    isReducedMotion: () => reducedMotion.value,
    onNavigate: (from, to) => motion.playNavigation(from, to),
  })

  const panzoom = usePanzoom(carousel.currentPhoto, areaMetrics, resolvedMinZoom, (photo) =>
    carousel.getRelativeFrameRect(photo),
  )

  const motion = useLightboxMotion(
    carousel.activeIndex,
    carousel.currentPhoto,
    areaMetrics,
    carousel.getAbsoluteFrameRect,
    () => transitionConfig.value,
    () => reducedMotion.value,
    () => navigationMode.value,
  )
  watch(
    [
      lifecycleStatus,
      carousel.activeIndex,
      () => {
        const photo = photos.value[carousel.activeIndex.value]
        return !!photo && loadedSlides.value.has(photo)
      },
      motion.transitionInProgress,
    ],
    ([status, active, loaded, moving]) => {
      if (status === 'closed') {
        prefetched.clear()
        loadedSlides.value.clear()
        prefetchedAround.value = -1
        return
      }
      if (status !== 'open' || moving || !loaded || typeof Image === 'undefined') return
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection
      if (connection?.saveData) return
      const count = photos.value.length
      for (const offset of [-1, 1]) {
        const index = (active + offset + count) % count
        if (index === active) continue
        const photo = photos.value[index]!
        const resolved = resolvePhotoImage(photo, 'slide', config.value)
        const key = resolved.srcset ?? resolved.src
        if (prefetched.has(key)) continue
        prefetched.add(key)
        const image = new Image()
        image.fetchPriority = 'low'
        image.decoding = 'async'
        // Match LightboxSlide's fitted width and set it before source selection.
        const width = Number.parseInt(String(carousel.getSlideFrameStyle(photo).width)) || 0
        image.sizes = width > 0 ? `${width}px` : '100vw'
        if (resolved.srcset) image.srcset = resolved.srcset
        image.src = resolved.src
      }
      prefetchedAround.value = active
    },
    { flush: 'post' },
  )
  if (initialOpening.value) motion.stageMounted.value = true
  isZoomedIn = () => panzoom.isZoomedIn.value
  isInteractionLocked = () => motion.animating.value

  const syncGeometry = createGeometrySync(mediaAreaRef, areaMetrics, frameAreaMetrics)

  type LightboxIntent = { readonly kind: 'closed' } | { readonly kind: 'open'; readonly id: string }
  type ActiveRun = {
    readonly controller: AbortController
    readonly done: Promise<unknown>
  }

  watch(lifecycleStatus, (status) => gallery.requestVisibility(status !== 'closed'), {
    flush: 'sync',
    immediate: true,
  })
  const isOpen = gallery.isOpen
  let desired: LightboxIntent = { kind: 'closed' }

  function releaseClosedOwnership() {
    if (lifecycleStatus.value === 'closed' && desired.kind === 'closed')
      releaseLightboxOwnership(ownershipId)
  }
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
      const targetIndex =
        target.kind === 'open' ? photos.value.findIndex((photo) => photo.id === target.id) : -1
      if (target.kind === 'open' && targetIndex < 0) {
        desired = { kind: 'closed' }
        continue
      }

      try {
        if (target.kind === 'closed') {
          if (lifecycleStatus.value === 'closed') return

          lifecycleStatus.value = 'closing'
          await startRun((signal) => motion.close(closeCallbacks, signal))
          motion.resetCloseDrag()
          keydown.detach()
          lifecycleStatus.value = 'closed'
        } else if (lifecycleStatus.value === 'open') {
          if (carousel.activeIndex.value !== targetIndex) {
            carousel.goTo(targetIndex, true)
            activeImageLoadFailed.value = false
            await prepareActiveSlide(true)
          }
        } else {
          carousel.goTo(targetIndex, true)
          lifecycleStatus.value = 'opening'
          keydown.attach()

          const opened = await startRun((signal) =>
            motion.open(targetIndex, transitionCallbacks, signal),
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
            carousel.activeIndex.value === targetIndex))
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

  async function open(index = 0, fromInitialLink = false) {
    const currentPhotos = photos.value
    if (index < 0 || index >= currentPhotos.length) {
      throw new RangeError(`[nuxt-photo] No photo found at index ${String(index)}`)
    }

    const photo = currentPhotos[index]!
    motion.captureOpen(index, resolvePhotoImage(photo, 'thumb', config.value).src)
    if (!isOpen.value) gallery.resolveDirection(motion.getThumbElement(index))
    const target: LightboxIntent = { kind: 'open', id: photo.id }
    desired = target
    activeRun?.controller.abort()
    await acquireLightboxOwnership({ id: ownershipId, close })
    try {
      if (desired !== target) {
        await ensureReconciled()
        return
      }
      await locationHistory.enter(photo.id, fromInitialLink)
      if (desired !== target) return
      await ensureReconciled()
    } finally {
      releaseClosedOwnership()
    }
  }

  async function close(fromPop = false) {
    desired = { kind: 'closed' }
    activeRun?.controller.abort()
    const historyClosed = fromPop ? Promise.resolve() : locationHistory.leave()
    try {
      await Promise.all([ensureReconciled(), historyClosed])
    } finally {
      releaseClosedOwnership()
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

  /**
   * Where the active photo is drawn at fit, as CSS custom properties in viewport
   * pixels. Themes anchor the caption and arrows to the photo with them.
   */
  const frameVars = computed((): Record<string, string> => {
    const photo = carousel.currentPhoto.value
    const frame = photo ? carousel.getAbsoluteFrameRect(photo) : null
    if (!frame) return {}
    return {
      '--np-frame-x': `${frame.left}px`,
      '--np-frame-y': `${frame.top}px`,
      '--np-frame-width': `${frame.width}px`,
      '--np-frame-height': `${frame.height}px`,
    }
  })

  const gestures = useLightboxInputHandlers({
    state: {
      isOpen,
      direction: gallery.direction,
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
      isPointOnPhoto: panzoom.isPointOnPhoto,
      toggleZoom: panzoom.toggleZoom,
      getPanBounds: panzoom.getPanBounds,
      getFrameOffset: panzoom.getFrameOffset,
    },
    navigation: {
      goToNext: carousel.goToNext,
      goToPrev: carousel.goToPrev,
      goTo: carousel.goTo,
      selectedSnap: carousel.selectedSnap,
      usesTrack: () => navigationMode.value === 'slide',
      dragSlide: motion.dragNavigation,
      releaseSlide: (deltaX: number, velocityX: number) => {
        // With one photo there is nowhere to go; the drag settles back.
        const count = photos.value.length
        if (!motion.releaseNavigation(count > 1 ? deltaX : 0, count > 1 ? velocityX : 0)) return
        // Dragging toward the start edge reveals the next photo, mirrored for RTL.
        const rtl = gallery.direction.value === 'rtl'
        if (rtl ? deltaX > 0 : deltaX < 0) carousel.goToNext()
        else carousel.goToPrev()
      },
      goToFirst: () => carousel.goTo(0),
      goToLast: () => carousel.goTo(photos.value.length - 1),
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
    getThumbSrc: (photo: PhotoItem) => resolvePhotoImage(photo, 'thumb', config.value).src,
    setImageLoadFailed: (failed: boolean, error?: unknown) => {
      activeImageLoadFailed.value = failed
      if (failed) devWarn('Active slide image failed to decode', error)
    },
    syncGeometry,
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    isZoomedIn: panzoom.isZoomedIn,
  }

  const closeCallbacks = transitionCallbacks

  watch(photos, () => {
    if (isOpen.value && !gallery.activePhoto.value) reportAsyncError('collection-close', close())
  })
  watch(carousel.activeIndex, () => {
    if (lifecycleStatus.value !== 'open') return
    reportAsyncError('prepare-active-slide', prepareActiveSlide(true))
    if (gallery.activeId.value) locationHistory.navigate(gallery.activeId.value)
  })
  const locationHistory = createLightboxHistory({
    config: () => config.value.lightbox,
    ownsScreen: () => ownsLightboxScreen(ownershipId),
    requestClose: () => reportAsyncError('history-close', close(true)),
  })
  onMounted(() => {
    if (initialOpening.value)
      reportAsyncError(
        'initial-deep-link',
        open(initialIndex, true).finally(() => {
          initialOpening.value = false
        }),
      )
  })
  useLightboxWindowLifecycle({
    isMounted: isOpen,
    cancelTapTimer: gestures.cancelTapTimer,
    detachKeydown: keydown.detach,
    syncGeometry,
    refreshZoomState: panzoom.refreshZoomState,
  })

  onBeforeUnmount(() => {
    locationHistory.dispose()
    motionQuery?.removeEventListener('change', syncReducedMotion)
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
    transitionConfig,
    navigationMode,
    reducedMotion,
    activeId: gallery.activeId,
    direction: gallery.direction,
    activeIndex: carousel.activeIndex,
    activePhoto: carousel.currentPhoto,
    isOpen,
    photoConfig: config,
    initialOpening,
    rootRef,

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
    getThumbElement: motion.getThumbElement,
    setSlideZoomRef: panzoom.setSlideZoomRef,
    setSlideFrameRef: motion.setSlideFrameRef,
    setSlideImageRef: motion.setSlideImageRef,
    onSlideImageLoad: (index: number) => {
      const photo = photos.value[index]
      if (photo) {
        loadedSlides.value.add(photo)
        const image = resolvePhotoImage(photo, 'slide', config.value)
        prefetched.add(image.srcset ?? image.src)
      }
    },
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
    close: () => close(),
    next,
    prev,
    toggleZoom: panzoom.toggleZoom,
    handleBackdropClick: () => motion.handleBackdropClick(close),
    getSlideFrameStyle: carousel.getSlideFrameStyle,
    frameVars,
    isSlideLeaving: (index: number) => motion.leavingSlides.value.includes(index),
    isSlideMediaMounted: (index: number) => {
      const count = photos.value.length
      return getMountedSlideIndices(
        carousel.activeIndex.value,
        count,
        motion.leavingSlides.value,
        prefetchedAround.value === carousel.activeIndex.value,
      ).has(index)
    },
  }
}
