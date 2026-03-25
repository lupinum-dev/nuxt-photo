import { useResizeObserver } from '../../utils/dom-helpers'
import type { Ref } from 'vue'
import { nextTick, ref, watch } from 'vue'
import { resolveBreakpoint } from '../../utils/responsives'

type UseContainerWidthOptions = {
  breakpoints: Ref<readonly number[]>
  containerWidth: Ref<number | undefined>
  defaultContainerWidth: Ref<number | undefined>
}

function normalizeWidth(width?: number) {
  return width === undefined ? undefined : Math.max(1, Math.round(width))
}

export function useContainerWidth(
  target: Ref<HTMLElement | undefined>,
  options: UseContainerWidthOptions,
) {
  const controlled = ref(false)
  const rawWidth = ref<number | undefined>(
    normalizeWidth(options.containerWidth.value ?? options.defaultContainerWidth.value),
  )
  const activeBreakpoint = ref(
    resolveBreakpoint(rawWidth.value ?? 0, options.breakpoints.value),
  )

  let stopObserver: (() => void) | undefined

  const disconnect = () => {
    stopObserver?.()
    stopObserver = undefined
  }

  const updateWidth = (width?: number) => {
    const nextWidth = normalizeWidth(width)
    if (nextWidth === undefined) {
      return
    }

    if (nextWidth !== rawWidth.value) {
      rawWidth.value = nextWidth
    }

    const nextBreakpoint = resolveBreakpoint(nextWidth, options.breakpoints.value)
    if (nextBreakpoint !== activeBreakpoint.value) {
      activeBreakpoint.value = nextBreakpoint
    }
  }

  watch(
    [options.containerWidth, options.defaultContainerWidth, options.breakpoints],
    ([
      containerWidth,
      defaultContainerWidth,
      breakpoints,
    ]: [number | undefined, number | undefined, readonly number[]]) => {
      controlled.value = typeof containerWidth === 'number'

      const nextWidth = controlled.value
        ? containerWidth ?? defaultContainerWidth
        : rawWidth.value ?? defaultContainerWidth

      updateWidth(nextWidth)
      activeBreakpoint.value = resolveBreakpoint(rawWidth.value ?? 0, breakpoints)
    },
    { immediate: true },
  )

  watch(
    [target, options.containerWidth],
    async () => {
      disconnect()

      if (
        controlled.value
        || target.value === undefined
      ) {
        return
      }

      await nextTick()
      if (target.value === undefined) {
        return
      }

      updateWidth(target.value.clientWidth)

      const { stop } = useResizeObserver(target, (entries) => {
        const entry = entries[0]
        updateWidth(entry?.contentRect.width ?? target.value?.clientWidth)
      })

      stopObserver = stop
    },
    { immediate: true, flush: 'post' },
  )

  return {
    activeBreakpoint,
    containerWidth: rawWidth,
  }
}
