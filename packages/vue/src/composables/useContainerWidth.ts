import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

/** Max width delta considered a scrollbar oscillation. */
const MAX_SCROLLBAR_WIDTH = 20

function snapToBreakpoint(width: number, breakpoints: readonly number[]): number {
  const sorted = [...breakpoints].filter(bp => bp > 0).sort((a, b) => b - a)
  if (sorted.length === 0) return width
  // Synthetic floor: half the smallest declared breakpoint
  sorted.push(Math.floor(sorted[sorted.length - 1] / 2))
  return sorted.find(bp => bp <= width) ?? sorted[sorted.length - 1]
}

/**
 * Tracks an element's width via ResizeObserver with optional breakpoint snapping and
 * scrollbar-oscillation detection. SSR-safe: initialises from `defaultContainerWidth`
 * and only starts the observer after mount.
 */
export function useContainerWidth(
  containerRef: Ref<HTMLElement | null>,
  options?: {
    /** Pre-render width so the JS layout runs on the server. Avoids CLS when it matches the breakpoint. */
    defaultContainerWidth?: number
    /** Snap observed width down to the largest breakpoint ≤ actual width. */
    breakpoints?: readonly number[]
  },
): { containerWidth: Ref<number> } {
  const containerWidth = ref<number>(options?.defaultContainerWidth ?? 0)

  function resolveWidth(raw: number): number {
    if (!raw || raw <= 0) return 0
    if (options?.breakpoints?.length) {
      return snapToBreakpoint(raw, options.breakpoints)
    }
    return raw
  }

  let resizeObserver: ResizeObserver | null = null
  let prevWidth = 0

  onMounted(() => {
    if (!containerRef.value || typeof ResizeObserver === 'undefined') return

    const initial = resolveWidth(containerRef.value.getBoundingClientRect().width)
    if (initial > 0) {
      prevWidth = containerWidth.value
      containerWidth.value = initial
    }

    resizeObserver = new ResizeObserver((entries) => {
      const raw = entries[0]?.contentRect.width
      if (!raw || raw <= 0) return

      const newW = resolveWidth(raw)

      // Scrollbar oscillation: width bounces back to prevWidth within MAX_SCROLLBAR_WIDTH
      if (newW === prevWidth && Math.abs(newW - containerWidth.value) <= MAX_SCROLLBAR_WIDTH) {
        containerWidth.value = Math.min(containerWidth.value, newW)
        return
      }

      prevWidth = containerWidth.value
      containerWidth.value = newW
    })

    resizeObserver.observe(containerRef.value)
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
  })

  return { containerWidth }
}
