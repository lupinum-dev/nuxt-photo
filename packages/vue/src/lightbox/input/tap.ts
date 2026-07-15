import { isDoubleTap } from '../../core/index'

/** Own single/double-tap timing independently from the pointer session. */
export function createTapHandler(
  toggleUi: () => void,
  toggleZoom: (point: { x: number; y: number }) => void,
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
      toggleZoom({ x: clientX, y: clientY })
      return
    }

    last = { time: now, clientX, clientY }
    timer = setTimeout(() => {
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
