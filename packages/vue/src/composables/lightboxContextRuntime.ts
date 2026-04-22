import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'
import {
  ensureImageLoaded,
  isUsableRect,
  lockBodyScroll,
  nextFrame,
  photoId,
  type AreaMetrics,
  type DebugLogger,
  type GestureMode,
  type PanState,
  type PhotoItem,
  type ZoomState,
} from '@nuxt-photo/core'
import type {
  LightboxEngine,
  LightboxPresentationState,
  LightboxViewportState,
} from '@nuxt-photo/engine'

/** Create attach/detach helpers for a lightbox-scoped global keydown handler. */
export function createKeydownBinding(
  onKeydown: (event: KeyboardEvent) => void,
) {
  let attached = false

  function attach() {
    if (typeof window === 'undefined' || attached) return
    window.addEventListener('keydown', onKeydown)
    attached = true
  }

  function detach() {
    if (typeof window === 'undefined' || !attached) return
    window.removeEventListener('keydown', onKeydown)
    attached = false
  }

  return { attach, detach }
}

/** Preload the active slide and its immediate neighbors. */
export function createPreloadAround(photos: ComputedRef<PhotoItem[]>) {
  return function preloadAround(index: number) {
    const candidates = [index - 1, index, index + 1]

    for (const candidate of candidates) {
      if (candidate < 0 || candidate >= photos.value.length) continue
      const photo = photos.value[candidate]
      if (!photo) continue
      void ensureImageLoaded(photo.src)
    }
  }
}

/** Measure the media area and cache the usable viewport metrics. */
export function createGeometrySync(
  mediaAreaRef: Ref<HTMLElement | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  debug?: DebugLogger,
) {
  return function syncGeometry() {
    const mediaAreaEl = mediaAreaRef.value
    if (!mediaAreaEl) {
      debug?.warn('geometry', 'syncGeometry: mediaAreaRef is null')
      return null
    }

    const rect = mediaAreaEl.getBoundingClientRect()
    if (!isUsableRect(rect)) {
      debug?.warn('geometry', 'syncGeometry: rect not usable', {
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

    debug?.log('geometry', 'syncGeometry:', areaMetrics.value)
    return areaMetrics.value
  }
}

/** Keep the engine photo collection in sync with the current reactive source. */
export function syncEnginePhotos(
  engine: LightboxEngine,
  photos: ComputedRef<PhotoItem[]>,
) {
  watch(
    photos,
    (nextPhotos) => {
      engine.setPhotos(nextPhotos)
    },
    { immediate: true },
  )
}

/** Mirror the active slide index into the engine state. */
export function syncEngineActiveIndex(
  engine: LightboxEngine,
  activeIndex: Ref<number>,
) {
  watch(
    activeIndex,
    (index) => {
      engine.setActiveIndex(index)
    },
    { immediate: true },
  )
}

/** Push viewport-derived zoom and pan state into the engine snapshot. */
export function syncEngineViewportState(
  engine: LightboxEngine,
  config: {
    zoomState: Ref<ZoomState>
    panState: Ref<PanState>
    isZoomedIn: ComputedRef<boolean>
    zoomAllowed: ComputedRef<boolean>
  },
) {
  watch(
    [config.zoomState, config.panState, config.isZoomedIn, config.zoomAllowed],
    ([zoomState, panState, isZoomedIn, zoomAllowed]) => {
      const viewportState: LightboxViewportState = {
        zoomState,
        panState,
        isZoomedIn,
        zoomAllowed,
      }
      engine.syncViewportState(viewportState)
    },
    { immediate: true },
  )
}

/** Push presentation-only runtime state into the engine snapshot. */
export function syncEnginePresentationState(
  engine: LightboxEngine,
  config: {
    gesturePhase: Ref<GestureMode>
    animating: Ref<boolean>
    ghostVisible: Ref<boolean>
    ghostSrc: Ref<string>
    hiddenThumbIndex: Ref<number | null>
    overlayOpacity: Ref<number>
    mediaOpacity: Ref<number>
    chromeOpacity: Ref<number>
    uiVisible: Ref<boolean>
    closeDragY: Ref<number>
  },
) {
  watch(
    [
      config.gesturePhase,
      config.animating,
      config.ghostVisible,
      config.ghostSrc,
      config.hiddenThumbIndex,
      config.overlayOpacity,
      config.mediaOpacity,
      config.chromeOpacity,
      config.uiVisible,
      config.closeDragY,
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
      const presentationState: LightboxPresentationState = {
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
      }
      engine.syncPresentationState(presentationState)
    },
    { immediate: true },
  )
}

/** React to photo-list changes that can invalidate the active slide at runtime. */
export function watchPhotoCollection(
  photos: ComputedRef<PhotoItem[]>,
  config: {
    activeIndex: Ref<number>
    lightboxMounted: Ref<boolean>
    goTo: (index: number, instant?: boolean) => void
    close: () => Promise<void>
  },
) {
  watch(photos, (newPhotos, oldPhotos) => {
    if (!newPhotos || !oldPhotos) return

    const newIds = new Set(newPhotos.map(photoId))
    const oldIds = new Set(oldPhotos.map(photoId))

    if (
      newIds.size === oldIds.size &&
      [...newIds].every((id) => oldIds.has(id))
    ) {
      return
    }

    const activePhoto = photos.value[config.activeIndex.value] ?? null
    const activeId = activePhoto ? photoId(activePhoto) : null

    if (!activeId || !newIds.has(activeId)) {
      if (config.lightboxMounted.value) {
        void config.close()
      }
      config.goTo(0, true)
      return
    }

    const newIndex = newPhotos.findIndex((photo) => photoId(photo) === activeId)
    if (newIndex !== -1 && newIndex !== config.activeIndex.value) {
      config.goTo(newIndex, true)
    }
  })
}

/** Refresh geometry, zoom bounds, and preloading when the active slide changes. */
export function watchActiveIndexRuntime(
  activeIndex: Ref<number>,
  config: {
    lightboxMounted: Ref<boolean>
    skipActiveIndexWatch: Ref<boolean>
    setActiveSlideIndex: (index: number) => void
    refreshZoomState: (preserveCurrent?: boolean) => void
    syncGeometry: () => AreaMetrics | null
    preloadAround: (index: number) => void
    debug?: DebugLogger
  },
) {
  watch(activeIndex, async (newIndex) => {
    if (!config.lightboxMounted.value || config.skipActiveIndexWatch.value) {
      return
    }

    config.debug?.log('slides', `activeIndex changed → ${newIndex}`)
    config.setActiveSlideIndex(newIndex)

    await nextTick()
    await nextFrame()
    config.syncGeometry()
    config.refreshZoomState(true)
    config.preloadAround(newIndex)
  })
}

/** Attach the window-level listeners and cleanup used by the lightbox runtime. */
export function useLightboxWindowLifecycle(config: {
  lightboxMounted: Ref<boolean>
  cancelTapTimer: () => void
  detachKeydown: () => void
  syncGeometry: () => AreaMetrics | null
  refreshZoomState: (preserveCurrent?: boolean) => void
  debug?: DebugLogger
}) {
  function onResize() {
    if (!config.lightboxMounted.value) return
    config.debug?.log('geometry', 'window resize')
    config.syncGeometry()
    config.refreshZoomState(false)
  }

  watch(config.lightboxMounted, (mounted) => {
    config.debug?.log('transitions', `lightboxMounted → ${mounted}`)
    lockBodyScroll(mounted)
  })

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize)
    }
  })

  onBeforeUnmount(() => {
    config.cancelTapTimer()
    config.detachKeydown()

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
    }

    if (typeof document !== 'undefined') {
      lockBodyScroll(false)
    }
  })
}
