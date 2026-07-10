import { isDoubleTap } from '../../core/index'
import type { DebugLogger } from '../../core/debug/logger'

/** Own single/double-tap timing independently from the pointer session. */
export function createTapHandler(
  toggleUi: () => void,
  toggleZoom: (point: { x: number; y: number }) => void,
  debug?: DebugLogger,
) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let last: { time: number; clientX: number; clientY: number } | null = null

  function cancel() {
    if (!timer) return
    clearTimeout(timer)
    timer = undefined
  }

  function handle(clientX: number, clientY: number) {
    const now = performance.now()
    const doubleTap = isDoubleTap(now, last, clientX, clientY)
    cancel()

    if (doubleTap) {
      last = null
      debug?.log('gestures', 'double-tap → toggleZoom', { clientX, clientY })
      toggleZoom({ x: clientX, y: clientY })
      return
    }

    last = { time: now, clientX, clientY }
    timer = setTimeout(() => {
      debug?.log('gestures', 'single-tap → toggle UI visibility')
      toggleUi()
      timer = undefined
    }, 220)
  }

  function dispose() {
    cancel()
    last = null
  }

  return { handle, cancel, dispose }
}
