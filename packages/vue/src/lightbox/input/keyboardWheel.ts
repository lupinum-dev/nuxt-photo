import type { ComputedRef, Ref } from 'vue'
import type { PanState } from '../../core/types'
import type { DebugLogger } from '../../core/debug/logger'

const TRACKPAD_WHEEL_THROTTLE_MS = 200
const MOUSE_WHEEL_THROTTLE_MS = 45

type KeyboardWheelConfig = {
  isOpen: Readonly<Ref<boolean>>
  animating: Readonly<Ref<boolean>>
  isZoomedIn: ComputedRef<boolean>
  transitionInProgress: ComputedRef<boolean>
  getCurrentScale: () => number
  getCurrentPan: () => PanState
  setCurrentPanImmediate: (pan: PanState, syncRefs?: boolean) => void
  clampPan: (pan: PanState, zoom?: number) => PanState
  applyWheelZoom: (event: WheelEvent) => void
  toggleZoom: (clientPoint?: { x: number; y: number }) => void
  goToNext: () => void
  goToPrev: () => void
  close: () => Promise<void>
}

function isEditableKeyTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

/** Keyboard and wheel input are stateless with respect to pointer sessions. */
export function createKeyboardWheelHandlers(
  config: KeyboardWheelConfig,
  debug?: DebugLogger,
) {
  let lastWheelTime = 0

  function onWheel(event: WheelEvent) {
    if (!config.isOpen.value || config.animating.value) return

    const now = performance.now()
    const isTrackpad =
      Math.abs(event.deltaY) < 100 && Math.abs(event.deltaX) < 100
    const throttleMs = isTrackpad
      ? TRACKPAD_WHEEL_THROTTLE_MS
      : MOUSE_WHEEL_THROTTLE_MS
    if (now - lastWheelTime < throttleMs) {
      event.preventDefault()
      return
    }

    lastWheelTime = now
    event.preventDefault()
    debug?.log(
      'zoom',
      `wheel: deltaY=${event.deltaY.toFixed(1)} isTrackpad=${isTrackpad}`,
    )
    config.applyWheelZoom(event)
  }

  function onKeydown(event: KeyboardEvent) {
    if (!config.isOpen.value || config.animating.value) return
    if (event.defaultPrevented || isEditableKeyTarget(event.target)) return

    if (event.key === 'Escape') {
      debug?.log('gestures', 'key: Escape → close')
      void config.close()
      return
    }
    if (event.key === 'z' || event.key === 'Z') {
      debug?.log('gestures', 'key: Z → toggleZoom')
      config.toggleZoom()
      return
    }

    const direction =
      event.key === 'ArrowRight' ? -1 : event.key === 'ArrowLeft' ? 1 : 0
    if (!direction) return

    if (config.isZoomedIn.value) {
      const pan = config.getCurrentPan()
      config.setCurrentPanImmediate(
        config.clampPan(
          { x: pan.x + direction * 80, y: pan.y },
          config.getCurrentScale(),
        ),
      )
      return
    }

    if (config.transitionInProgress.value) return
    if (direction < 0) config.goToNext()
    else config.goToPrev()
  }

  return { onWheel, onKeydown }
}
