import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

/** Max width delta considered a scrollbar oscillation. */
const MAX_SCROLLBAR_WIDTH = 20

/**
 * Tracks an element's width via ResizeObserver with scrollbar-oscillation detection. SSR-safe: the width is 0 until the observer starts
 * after mount.
 */
export function useElementWidth(containerRef: Readonly<Ref<HTMLElement | null | undefined>>): {
  containerWidth: Ref<number>
} {
  const containerWidth = ref(0)
  let rawWidth = 0

  const resolveWidth = (raw: number) => (raw > 0 ? raw : 0)

  let resizeObserver: ResizeObserver | null = null
  let prevWidth = 0
  let resizeFrame: number | null = null

  onMounted(() => {
    if (!containerRef.value) return

    rawWidth = containerRef.value.getBoundingClientRect().width
    const initial = resolveWidth(rawWidth)
    if (initial > 0) {
      prevWidth = containerWidth.value
      containerWidth.value = initial
    }

    resizeObserver = new ResizeObserver((entries) => {
      const raw = entries[0]?.contentRect.width
      if (!raw || raw <= 0) return

      rawWidth = raw
      if (resizeFrame !== null) return
      // Defer layout writes out of ResizeObserver delivery and keep only the
      // latest measurement when several notifications arrive in one frame.
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null
        const newW = resolveWidth(rawWidth)

        // Scrollbar oscillation: width bounces back to prevWidth within MAX_SCROLLBAR_WIDTH
        if (newW === prevWidth && Math.abs(newW - containerWidth.value) <= MAX_SCROLLBAR_WIDTH) {
          containerWidth.value = Math.min(containerWidth.value, newW)
          return
        }

        prevWidth = containerWidth.value
        containerWidth.value = newW
      })
    })

    resizeObserver.observe(containerRef.value)
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame)
  })

  return { containerWidth }
}
