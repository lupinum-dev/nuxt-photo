import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { isUsableRect, type AreaMetrics } from '../core/index'
import { lockBodyScroll } from '../internal/bodyScroll'

/** Create attach/detach helpers for a lightbox-scoped global keydown handler. */
export function createKeydownBinding(onKeydown: (event: KeyboardEvent) => void) {
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

/**
 * Measure the media area and the frame area inside it.
 *
 * The frame area is where a fitted photo may sit. Its size comes from CSS
 * (`--np-frame-inset-*` on the `[data-np-frame-area]` element), so themes set
 * the mat around the photo without JavaScript. Without that element the photo
 * may use the whole media area.
 */
export function createGeometrySync(
  mediaAreaRef: Ref<HTMLElement | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  frameAreaMetrics: Ref<AreaMetrics | null>,
) {
  return function syncGeometry() {
    const mediaAreaEl = mediaAreaRef.value
    if (!mediaAreaEl) return null

    const rect = mediaAreaEl.getBoundingClientRect()
    if (!isUsableRect(rect)) {
      return null
    }

    areaMetrics.value = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }

    const frame = mediaAreaEl.querySelector('[data-np-frame-area]')?.getBoundingClientRect()
    frameAreaMetrics.value =
      frame && frame.width > 0 && frame.height > 0
        ? { left: frame.left, top: frame.top, width: frame.width, height: frame.height }
        : areaMetrics.value

    return areaMetrics.value
  }
}

/** Attach the window-level listeners and cleanup used by lightbox state. */
export function useLightboxWindowLifecycle(config: {
  isMounted: Readonly<Ref<boolean>>
  cancelTapTimer: () => void
  detachKeydown: () => void
  syncGeometry: () => AreaMetrics | null
  refreshZoomState: (preserveCurrent?: boolean) => void
}) {
  let didLock = false

  function onResize() {
    if (!config.isMounted.value) return
    config.syncGeometry()
    config.refreshZoomState(false)
  }

  watch(
    config.isMounted,
    (mounted) => {
      if (typeof document === 'undefined') return
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
    },
    { immediate: true },
  )

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
