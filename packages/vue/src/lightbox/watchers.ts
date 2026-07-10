import {
  onBeforeUnmount,
  onMounted,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'
import {
  isUsableRect,
  loadImage,
  type AreaMetrics,
  type ImageAdapter,
  type PhotoItem,
} from '../core/index'
import type { DebugLogger } from '../core/debug/logger'
import { lockBodyScroll } from '../internal/bodyScroll'

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
export function createPreloadAround(
  photos: ComputedRef<PhotoItem[]>,
  imageAdapter: ComputedRef<ImageAdapter>,
) {
  return function preloadAround(index: number) {
    const candidates = [index - 1, index, index + 1]

    for (const candidate of candidates) {
      if (candidate < 0 || candidate >= photos.value.length) continue
      const photo = photos.value[candidate]
      if (!photo) continue
      void loadImage(imageAdapter.value(photo, 'slide').src)
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

/** React to photo-list changes that can invalidate the active slide at runtime. */
export function watchPhotoCollection(
  photos: ComputedRef<PhotoItem[]>,
  config: {
    activeIndex: Ref<number>
    isMounted: Readonly<Ref<boolean>>
    goTo: (index: number, instant?: boolean) => void
    close: () => Promise<void>
    reportAsyncError: (operation: string, task: Promise<unknown>) => void
  },
) {
  watch(photos, (newPhotos, oldPhotos) => {
    if (!newPhotos || !oldPhotos) return

    const newIds = new Set(newPhotos.map((photo) => photo.id))
    const activePhoto = oldPhotos[config.activeIndex.value] ?? null
    const activeId = activePhoto?.id ?? null

    if (!activeId) {
      config.goTo(0, true)
      return
    }

    if (!newIds.has(activeId)) {
      if (config.isMounted.value) {
        config.reportAsyncError('collection-close', config.close())
      }
      config.goTo(0, true)
      return
    }

    const newIndex = newPhotos.findIndex((photo) => photo.id === activeId)
    if (newIndex !== -1 && newIndex !== config.activeIndex.value) {
      config.goTo(newIndex, true)
    }
  })
}

/** Attach the window-level listeners and cleanup used by lightbox state. */
export function useLightboxWindowLifecycle(config: {
  isMounted: Readonly<Ref<boolean>>
  cancelTapTimer: () => void
  detachKeydown: () => void
  syncGeometry: () => AreaMetrics | null
  refreshZoomState: (preserveCurrent?: boolean) => void
  debug?: DebugLogger
}) {
  let didLock = false

  function onResize() {
    if (!config.isMounted.value) return
    config.debug?.log('geometry', 'window resize')
    config.syncGeometry()
    config.refreshZoomState(false)
  }

  watch(config.isMounted, (mounted) => {
    config.debug?.log('transitions', `mounted → ${mounted}`)
    if (mounted) {
      if (!didLock) {
        lockBodyScroll(true)
        didLock = true
      }
      return
    }

    if (didLock) {
      lockBodyScroll(false)
      didLock = false
    }
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

    if (typeof document !== 'undefined' && didLock) {
      lockBodyScroll(false)
      didLock = false
    }
  })
}
