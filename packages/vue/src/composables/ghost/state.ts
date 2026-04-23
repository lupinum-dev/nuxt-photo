import {
  computed,
  ref,
  type ComponentPublicInstance,
  type ComputedRef,
  type CSSProperties,
  type Ref,
} from 'vue'
import type {
  AreaMetrics,
  DebugLogger,
  PhotoItem,
  TransitionModeConfig,
} from '@nuxt-photo/core'
import type { GhostState } from './types'

/** Create the shared reactive state used by ghost open/close transition helpers. */
export function createGhostState(
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<PhotoItem | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: GhostState['getAbsoluteFrameRect'],
  debug?: DebugLogger,
  transitionConfig?: TransitionModeConfig,
): GhostState {
  const lightboxMounted = ref(false)
  const animating = ref(false)
  const ghostVisible = ref(false)
  const ghostSrc = ref('')
  const ghostStyle = ref<CSSProperties>({})
  const hiddenThumbIndex = ref<number | null>(null)

  const overlayOpacity = ref(0)
  const mediaOpacity = ref(0)
  const chromeOpacity = ref(0)
  const uiVisible = ref(true)

  const closeDragY = ref(0)
  const disableBackdropTransition = ref(false)

  const closeDragRatio = computed(() => {
    const height = areaMetrics.value?.height || 1
    return Math.min(
      0.75,
      Math.abs(closeDragY.value) / Math.max(240, height * 0.85),
    )
  })

  const thumbRefs = new Map<number, HTMLElement>()

  return {
    lightboxMounted,
    animating,
    ghostVisible,
    ghostSrc,
    ghostStyle,
    hiddenThumbIndex,
    overlayOpacity,
    mediaOpacity,
    chromeOpacity,
    uiVisible,
    closeDragY,
    disableBackdropTransition,
    closeDragRatio,
    thumbRefs,
    activeIndex,
    currentPhoto,
    areaMetrics,
    getAbsoluteFrameRect,
    debug,
    transitionConfig,
  }
}

/** Record or clear the thumbnail element for a slide index. */
export function setThumbRef(state: GhostState, index: number) {
  return (value: Element | ComponentPublicInstance | null) => {
    const el =
      value instanceof HTMLElement
        ? value
        : value && '$el' in value && value.$el instanceof HTMLElement
          ? value.$el
          : null

    if (el instanceof HTMLElement) {
      state.thumbRefs.set(index, el)
    } else {
      state.thumbRefs.delete(index)
    }
  }
}

/** Reset the transient state used only during the open transition path. */
export function resetOpenState(state: GhostState) {
  state.ghostVisible.value = false
  state.ghostSrc.value = ''
  state.hiddenThumbIndex.value = null
  state.overlayOpacity.value = 1
  state.mediaOpacity.value = 1
  state.chromeOpacity.value = 1
  state.animating.value = false
  state.closeDragY.value = 0
  state.disableBackdropTransition.value = false
}

/** Reset the close-transition state and unmount the lightbox runtime cleanly. */
export function resetCloseState(state: GhostState, clearGuard: () => void) {
  state.debug?.log('transitions', 'resetCloseState: unmounting lightbox')
  clearGuard()
  state.ghostVisible.value = false
  state.ghostSrc.value = ''
  state.hiddenThumbIndex.value = null
  state.closeDragY.value = 0
  state.disableBackdropTransition.value = false
  state.overlayOpacity.value = 0
  state.mediaOpacity.value = 0
  state.chromeOpacity.value = 0
  state.animating.value = false
  state.lightboxMounted.value = false
}
