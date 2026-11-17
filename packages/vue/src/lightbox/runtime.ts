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
import { createSlideTrack } from './track'
import { createGlowChannel } from './glow'
import { useLightboxMotion } from './transitions/runtime'
import { useLightboxInputHandlers } from './input/pointer'
import { createGeometrySync, createKeydownBinding, useLightboxWindowLifecycle } from './watchers'
import { useGalleryRuntime, type GalleryRuntime } from '../gallery/runtime'
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
import { createLightboxHistory } from './history'
import { initialPhotoId } from '../gallery/deepLink'
import { photoAt } from '../core/photo/lookup'

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
 * Custom lightboxes use `LightboxProvider` and `useLightbox`; this function
 * wires the Vue-side composables together: reactive photo state, DOM refs,
 * the slide track, pan/zoom, gestures, and DOM-owned transitions.
 * Lifecycle intent is reconciled by one abortable runner. The gallery owns identity and visibility;
 * lifecycle status only coordinates animations and DOM mounting.
 */
export function useLightboxRuntimeState(
  photosInput: MaybeRefOrGetter<PhotoItem | readonly PhotoItem[]>,
  options: {
    /** Find the page element that shows a photo, at the moment the lightbox needs it. */
    thumbnailFor?: (id: string) => HTMLElement | null
    /** The identity store of the group that owns this lightbox; else this component's own. */
    gallery?: GalleryRuntime
  } = {},
) {
  const thumbnailFor = options.thumbnailFor ?? (() => null)
  if (import.meta.env.DEV && !getCurrentInstance()) {
    console.warn('[nuxt-photo] useLightboxRuntimeState must be called inside a component setup()')
  }

  const photos = computed(() => {
    const value = toValue(photosInput)
    return Array.isArray(value) ? value : [value]
  })

  const gallery = options.gallery ?? useGalleryRuntime(photos)
  const config = usePhotoConfig()
  const initialId = initialPhotoId(
    typeof window === 'undefined' ? config.value.initialUrl : window.location.href,
    config.value.lightbox.deepLink,
  )
  const initialIndex = photos.value.findIndex((photo) => photo.id === initialId)
  const initialOpening = ref(initialIndex >= 0)
  if (initialOpening.value) gallery.requestIndex(initialIndex)
  const rootRef = ref<HTMLElement | null>(null)
  const resolvedMinZoom = config.value.lightbox.minZoom

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
    return resolveTransitionConfig(config.value.lightbox.transition, reducedMotion.value)
  })
  const navigationMode = computed(
    (): LightboxNavigationMode => config.value.lightbox.navigation ?? 'slide',
  )

  const mediaAreaRef = ref<HTMLElement | null>(null)
  const areaMetrics = ref<AreaMetrics | null>(null)
  const frameAreaMetrics = ref<AreaMetrics | null>(null)
  const lifecycleStatus = ref<LightboxLifecycleStatus>(initialOpening.value ? 'opening' : 'closed')
  const loadedSlides = ref(new Set<PhotoItem>())
  const prefetchedAround = ref(-1)
  const prefetched = new Set<string>()
  const activeImageLoadFailed = ref(false)

  const carousel = useCarousel(gallery, areaMetrics, frameAreaMetrics, {
    navigationMode: () => navigationMode.value,
    isReducedMotion: () => reducedMotion.value,
    onNavigate: (from, to) => {
      // The glow crosses over on the incoming photo's timing.
      const timing = motion.playNavigation(from, to)
      if (timing) glow.current()?.fade(to, timing)
    },
    track: () => track,
  })

  const panzoom = usePanzoom(
    carousel.currentPhoto,
    areaMetrics,
    resolvedMinZoom,
    carousel.getRelativeFrameRect,
  )

  // The element a visitor activated wins over the provider's lookup for its photo, so a
  // photo shown twice flies from and back to the copy that was clicked. It stays until the
  // next open, which also lets focus return to it after the close.
  let activated: { readonly id: string; readonly element: HTMLElement } | null = null
  function thumbnail(id: string) {
    if (activated?.id === id && activated.element.isConnected) return activated.element
    return thumbnailFor(id)
  }

  const motion = useLightboxMotion(
    carousel.activeIndex,
    carousel.currentPhoto,
    areaMetrics,
    carousel.getAbsoluteFrameRect,
    () => transitionConfig.value,
    () => reducedMotion.value,
    () => navigationMode.value,
    thumbnail,
    () => rootRef.value,
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
      if (status !== 'open' || moving || !loaded) return
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
  const glow = createGlowChannel()
  const track = createSlideTrack({
    viewport: carousel.trackRef,
    activeIndex: carousel.activeIndex,
    count: () => photos.value.length,
    enabled: () => navigationMode.value === 'slide',
    direction: () => gallery.direction.value,
    reducedMotion: () => reducedMotion.value,
    requestIndex: (index) => gallery.requestIndex(index),
    leaving: motion.leavingSlides,
    geometry: () => areaMetrics.value?.width,
    glow: () => glow.current(),
  })
  const slideMode = () => navigationMode.value === 'slide'

  const syncGeometry = createGeometrySync(mediaAreaRef, areaMetrics, frameAreaMetrics)

  type LightboxIntent = { readonly kind: 'closed' } | { readonly kind: 'open'; readonly id: string }
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
  let activeRun: AbortController | null = null
  let reconcilePromise: Promise<void> | null = null

  function startRun<T>(operation: (signal: AbortSignal) => Promise<T>) {
    const controller = new AbortController()
    const done = operation(controller.signal)
    activeRun = controller
    return done.finally(() => {
      if (activeRun === controller) activeRun = null
    })
  }

  async function prepareActiveSlide(reset: boolean) {
    panzoom.setActiveSlideIndex(carousel.activeIndex.value)
    await nextTick()
    syncGeometry()
    panzoom.refreshZoomState(reset)
  }

  /** Drop everything the open lightbox drew and listens to. */
  function forceClosed() {
    motion.resetClosedVisualState()
    keydown.detach()
    lifecycleStatus.value = 'closed'
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
          await startRun((signal) => motion.close(transitionCallbacks, signal))
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
          if (opened) lifecycleStatus.value = 'open'
          else forceClosed()
        }
      } catch (error) {
        if (isAbortError(error)) continue
        forceClosed()
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

  async function open(index = 0, source: HTMLElement | null = null, fromInitialLink = false) {
    const photo = photoAt(photos.value, index)
    activated = source ? { id: photo.id, element: source } : null
    motion.captureOpen(photo.id, resolvePhotoImage(photo, 'thumb', config.value).src)
    if (!isOpen.value) gallery.resolveDirection(thumbnail(photo.id))
    const target: LightboxIntent = { kind: 'open', id: photo.id }
    desired = target
    activeRun?.abort()
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
    activeRun?.abort()
    const historyClosed = fromPop ? Promise.resolve() : locationHistory.leave()
    try {
      await Promise.all([ensureReconciled(), historyClosed])
    } finally {
      releaseClosedOwnership()
    }
  }

  /** A step for the public `next` and `prev`: only while open and not moving. */
  const stepper = (go: () => void) => () => {
    if (lifecycleStatus.value === 'open' && !motion.transitionInProgress.value) go()
  }
  const next = stepper(carousel.goToNext)
  const prev = stepper(carousel.goToPrev)

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
    panzoom,
    navigation: {
      goToNext: carousel.goToNext,
      goToPrev: carousel.goToPrev,
      goTo: carousel.goTo,
      selectedSnap: carousel.selectedSnap,
      // One swipe path for every mode; the mode decides only what the change looks like.
      catchSlide: () => slideMode() && track.settling() && track.begin(),
      beginSlide: () => {
        if (slideMode()) track.begin()
      },
      dragSlide: (deltaX: number) => {
        if (slideMode()) track.drag(deltaX)
        else motion.dragNavigation(deltaX)
      },
      releaseSlide: (deltaX, velocityX, pointerType, leadX) => {
        if (slideMode()) {
          track.release(velocityX, pointerType, leadX)
          return
        }
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
    glowReady: () => glow.current()?.ready() ?? Promise.resolve(),
    resetGestureState: gestures.resetGestureState,
    cancelTapTimer: gestures.cancelTapTimer,
    getThumbSrc: (photo: PhotoItem) => resolvePhotoImage(photo, 'thumb', config.value).src,
    setImageLoadFailed: (failed: boolean, error?: unknown) => {
      activeImageLoadFailed.value = failed
      if (failed) devWarn('Active slide image failed to decode', error)
    },
    syncGeometry,
    setPanzoomImmediate: panzoom.setPanzoomImmediate,
    isZoomedIn: panzoom.isZoomedIn,
  }

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
        open(initialIndex, null, true).finally(() => {
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
    activated = null
    activeRun?.abort()
    gestures.disposeGestureState()
    forceClosed()
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
    hiddenThumbnailId: motion.hiddenThumbnailId,
    activeImageLoadFailed,
    uiVisible: motion.uiVisible,
    stageMounted: motion.stageMounted,
    activeImagePending: motion.activeImagePending,
    transitionInProgress: motion.transitionInProgress,

    gesturePhase: gestures.gesturePhase,

    mediaAreaRef,
    trackRef: carousel.trackRef,

    thumbnailFor: thumbnail,
    glow,
    setSlideZoomRef: panzoom.setSlideZoomRef,
    // While the lightbox opens or closes, its motion owns every caption's opacity.
    adoptCaption: (element: HTMLElement) => {
      if (lifecycleStatus.value === 'open') motion.adoptChrome(element)
    },
    onSlideImageLoad: (index: number) => {
      const photo = photos.value[index]
      if (photo) {
        loadedSlides.value.add(photo)
        const image = resolvePhotoImage(photo, 'slide', config.value)
        prefetched.add(image.srcset ?? image.src)
      }
    },

    onMediaPointerDown: gestures.onMediaPointerDown,
    onMediaPointerMove: gestures.onMediaPointerMove,
    onMediaPointerUp: gestures.onMediaPointerUp,
    onMediaPointerCancel: gestures.onMediaPointerCancel,
    onWheel: gestures.onWheel,

    open: (index?: number, source?: HTMLElement | null) => open(index, source),
    close: () => close(),
    next,
    prev,
    toggleZoom: panzoom.toggleZoom,
    handleBackdropClick: () => close(),
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
