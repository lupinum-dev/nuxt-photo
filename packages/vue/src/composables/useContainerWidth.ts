import { ref, onMounted, onBeforeUnmount, toValue, watch, type MaybeRef, type Ref } from 'vue'

/** Max width delta considered a scrollbar oscillation. */
const MAX_SCROLLBAR_WIDTH = 20

function snapToBreakpoint(width: number, breakpoints: readonly number[]): number {
  const sorted = [...breakpoints].filter((bp) => bp > 0).sort((a, b) => b - a)
  if (sorted.length === 0) return width
  return sorted.find((bp) => bp <= width) ?? width
}

/**
 * Tracks an element's width via ResizeObserver with optional breakpoint snapping and
 * scrollbar-oscillation detection. SSR-safe: initialises from `defaultContainerWidth`
 * and only starts the observer after mount.
 *
 * ResizeObserver's contentRect is the single measurement source. This keeps
 * layout math aligned with the element's content box when borders or padding exist.
 */
export function useContainerWidth(
  containerRef: Ref<HTMLElement | null>,
  options?: {
    /** Pre-render width so the JS layout runs on the server. Avoids CLS when it matches the breakpoint. */
    defaultContainerWidth?: number
    /** Snap observed width down to the largest breakpoint ≤ actual width. */
    breakpoints?: MaybeRef<readonly number[] | undefined>
  },
): { containerWidth: Ref<number> } {
  const containerWidth = ref<number>(options?.defaultContainerWidth ?? 0)
  let rawWidth = options?.defaultContainerWidth ?? 0

  function resolveWidth(raw: number): number {
    if (!raw || raw <= 0) return 0
    const breakpoints = options?.breakpoints ? toValue(options.breakpoints) : undefined
    if (breakpoints?.length) {
      return snapToBreakpoint(raw, breakpoints)
    }
    return raw
  }

  let resizeObserver: ResizeObserver | null = null
  let prevWidth = 0

  onMounted(() => {
    if (!containerRef.value) return

    resizeObserver = new ResizeObserver((entries) => {
      const raw = entries[0]?.contentRect.width
      if (!raw || raw <= 0) return

      rawWidth = raw
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

  watch(
    () => (options?.breakpoints ? toValue(options.breakpoints) : undefined),
    () => {
      const newW = resolveWidth(rawWidth)
      if (newW > 0) {
        prevWidth = containerWidth.value
        containerWidth.value = newW
      }
    },
  )

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
  })

  return { containerWidth }
}
