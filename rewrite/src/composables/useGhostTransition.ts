import { computed, nextTick, ref, type ComponentPublicInstance, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import type { AreaMetrics, GhostStyleValue, PanState, Photo } from '../types'
import { flipTransform, isUsableRect, makeGhostBaseStyle } from '../utils/geometry'
import { ensureImageLoaded } from '../utils/image'
import { nextFrame, wait } from '../utils/timing'
import { animateNumber } from '../utils/animation'

const openDurationMs = 420
const closeDurationMs = 380

export type TransitionCallbacks = {
  syncGeometry: () => void
  refreshZoomState: (reset: boolean) => void
  resetGestureState: () => void
  cancelTapTimer: () => void
}

export type CloseCallbacks = TransitionCallbacks & {
  setPanzoomImmediate: (scale: number, pan: PanState) => void
  isZoomedIn: ComputedRef<boolean>
}

export function useGhostTransition(
  _photos: Photo[],
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<Photo>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: (photo: Photo) => ReturnType<typeof import('../utils/geometry').fitRect> | null,
) {
  const lightboxMounted = ref(false)
  const animating = ref(false)
  const ghostVisible = ref(false)
  const ghostSrc = ref('')
  const ghostStyle = ref<GhostStyleValue>({})
  const hiddenThumbIndex = ref<number | null>(null)

  const overlayOpacity = ref(0)
  const mediaOpacity = ref(0)
  const chromeOpacity = ref(0)
  const uiVisible = ref(true)

  const closeDragY = ref(0)

  const thumbRefs = new Map<number, HTMLElement>()

  const controlsDisabled = computed(() => animating.value || ghostVisible.value)

  const chromeStyle = computed<CSSProperties>(() => ({
    opacity: String(uiVisible.value ? chromeOpacity.value : 0),
    pointerEvents: uiVisible.value && chromeOpacity.value > 0.05 ? 'auto' : 'none',
  }))

  const closeDragRatio = computed(() => {
    const height = areaMetrics.value?.height || 1
    return Math.min(0.75, Math.abs(closeDragY.value) / Math.max(240, height * 0.85))
  })

  const backdropStyle = computed<CSSProperties>(() => ({
    opacity: String(overlayOpacity.value * (1 - closeDragRatio.value)),
  }))

  const lightboxUiStyle = computed<CSSProperties>(() => ({
    transform: `translate3d(0, ${closeDragY.value}px, 0) scale(${1 - closeDragRatio.value * 0.05})`,
  }))

  function setThumbRef(index: number) {
    return (value: Element | ComponentPublicInstance | null) => {
      const el = value instanceof HTMLElement
        ? value
        : value && '$el' in value && value.$el instanceof HTMLElement
          ? value.$el
          : null

      if (el instanceof HTMLElement) {
        thumbRefs.set(index, el)
      } else {
        thumbRefs.delete(index)
      }
    }
  }

  async function open(index: number, callbacks: TransitionCallbacks) {
    if (animating.value) return

    callbacks.resetGestureState()
    callbacks.cancelTapTimer()

    activeIndex.value = index
    uiVisible.value = true

    lightboxMounted.value = true
    overlayOpacity.value = 0
    mediaOpacity.value = 0
    chromeOpacity.value = 0

    await nextTick()
    await nextFrame()

    callbacks.syncGeometry()
    callbacks.refreshZoomState(true)

    const photo = currentPhoto.value
    const thumbEl = thumbRefs.get(index)
    const fromRect = thumbEl?.getBoundingClientRect() ?? null
    const toRect = getAbsoluteFrameRect(photo)

    if (!isUsableRect(fromRect) || !toRect) {
      overlayOpacity.value = 1
      await ensureImageLoaded(photo.full)
      mediaOpacity.value = 1
      chromeOpacity.value = 1
      return
    }

    animating.value = true
    hiddenThumbIndex.value = index

    ghostSrc.value = photo.thumb
    ghostVisible.value = true
    ghostStyle.value = {
      position: 'fixed',
      zIndex: '60',
      objectFit: 'contain',
      transformOrigin: 'top left',
      pointerEvents: 'none',
      willChange: 'transform',
      borderRadius: '18px',
      boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
      transition:
        `transform ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      ...makeGhostBaseStyle(toRect),
      transform: flipTransform(fromRect, toRect),
    }

    await nextFrame()

    overlayOpacity.value = 1
    ghostStyle.value = {
      ...ghostStyle.value,
      transform: 'translate(0px, 0px) scale(1, 1)',
      borderRadius: '24px',
      boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
    }

    await Promise.all([wait(openDurationMs), ensureImageLoaded(photo.full)])

    mediaOpacity.value = 1
    await nextFrame()
    ghostVisible.value = false
    chromeOpacity.value = 1
    animating.value = false
  }

  async function close(callbacks: CloseCallbacks) {
    if (!lightboxMounted.value || animating.value) return

    callbacks.cancelTapTimer()
    callbacks.resetGestureState()

    if (callbacks.isZoomedIn.value || closeDragY.value) {
      callbacks.setPanzoomImmediate(1, { x: 0, y: 0 })
      closeDragY.value = 0
      await nextFrame()
    }

    callbacks.syncGeometry()

    const photo = currentPhoto.value
    const fromRect = getAbsoluteFrameRect(photo)
    const toRect = thumbRefs.get(activeIndex.value)?.getBoundingClientRect() ?? null

    if (!fromRect || !isUsableRect(toRect)) {
      mediaOpacity.value = 0
      chromeOpacity.value = 0
      overlayOpacity.value = 0
      await wait(220)
      ghostVisible.value = false
      lightboxMounted.value = false
      hiddenThumbIndex.value = null
      return
    }

    animating.value = true
    hiddenThumbIndex.value = activeIndex.value
    mediaOpacity.value = 0
    chromeOpacity.value = 0

    ghostSrc.value = photo.full
    ghostVisible.value = true
    ghostStyle.value = {
      position: 'fixed',
      zIndex: '60',
      objectFit: 'contain',
      transformOrigin: 'top left',
      pointerEvents: 'none',
      willChange: 'transform',
      borderRadius: '24px',
      boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
      transition:
        `transform ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      ...makeGhostBaseStyle(toRect),
      transform: flipTransform(fromRect, toRect),
    }

    await nextFrame()

    overlayOpacity.value = 0
    ghostStyle.value = {
      ...ghostStyle.value,
      transform: 'translate(0px, 0px) scale(1, 1)',
      borderRadius: '18px',
      boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
    }

    await wait(closeDurationMs)

    ghostVisible.value = false
    lightboxMounted.value = false
    hiddenThumbIndex.value = null
    closeDragY.value = 0
    animating.value = false
  }

  async function animateCloseDragTo(target: number, duration = 220) {
    const start = closeDragY.value
    await animateNumber(start, target, duration, (value) => {
      closeDragY.value = value
    })
  }

  async function handleCloseGesture(deltaY: number, velocityY: number, closeFn: () => Promise<void>) {
    const threshold = Math.min(180, (areaMetrics.value?.height ?? 600) * 0.2)

    if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
      await closeFn()
      return
    }

    animating.value = true
    await animateCloseDragTo(0)
    animating.value = false
  }

  function handleBackdropClick(closeFn: () => Promise<void>) {
    if (animating.value) return
    void closeFn()
  }

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
    controlsDisabled,
    chromeStyle,
    closeDragRatio,
    backdropStyle,
    lightboxUiStyle,

    setThumbRef,
    open,
    close,
    animateCloseDragTo,
    handleCloseGesture,
    handleBackdropClick,
  }
}
