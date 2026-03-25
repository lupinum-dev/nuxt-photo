import { computed, nextTick, ref, type ComponentPublicInstance, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import type { AreaMetrics, GhostStyleValue, PanState, Photo } from '../types'
import { flipTransform, isUsableRect, makeGhostBaseStyle } from '../utils/geometry'
import { ensureImageLoaded } from '../utils/image'
import { nextFrame, wait } from '../utils/timing'
import { animateNumber } from '../utils/animation'
import { easeOutCubic } from '../utils/easing'
import type { DebugLogger } from './useDebug'
import { type TransitionModeConfig, shouldUseFlip } from './useTransitionMode'

const openDurationMs = 420
const closeDurationMs = 380
const fadeDurationMs = 200

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
  getAbsoluteFrameRect: (photo: Photo) => { left: number; top: number; width: number; height: number } | null,
  debug?: DebugLogger,
  transitionConfig?: TransitionModeConfig,
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

  function resetOpenState() {
    ghostVisible.value = false
    chromeOpacity.value = 1
    animating.value = false
  }

  function resetCloseState() {
    ghostVisible.value = false
    ghostSrc.value = ''
    hiddenThumbIndex.value = null
    closeDragY.value = 0
    overlayOpacity.value = 0
    mediaOpacity.value = 0
    chromeOpacity.value = 0
    animating.value = false
    // lightboxMounted set LAST — triggers watchers
    lightboxMounted.value = false
  }

  function isNoneMode(): boolean {
    return transitionConfig?.mode === 'none'
  }

  // --- OPEN ---

  async function doInstantOpen(photo: Photo) {
    debug?.log('transitions', 'open: INSTANT (mode=none)')
    overlayOpacity.value = 1
    await ensureImageLoaded(photo.full)
    mediaOpacity.value = 1
    chromeOpacity.value = 1
  }

  async function doFadeOpen(photo: Photo) {
    debug?.log('transitions', 'open: using smooth FADE')
    animating.value = true

    // Animate overlay in
    await animateNumber(0, 1, fadeDurationMs, (v) => {
      overlayOpacity.value = v
    }, easeOutCubic)

    // Load image while overlay is visible
    await ensureImageLoaded(photo.full)

    // Show media + chrome
    mediaOpacity.value = 1
    chromeOpacity.value = 1
    animating.value = false
  }

  async function doFlipOpen(index: number, photo: Photo, fromRect: DOMRect, toRect: { left: number; top: number; width: number; height: number }) {
    debug?.log('transitions', 'open: using FLIP animation')

    animating.value = true
    hiddenThumbIndex.value = index

    ghostSrc.value = photo.thumb
    ghostVisible.value = true
    ghostStyle.value = {
      position: 'fixed',
      zIndex: '60',
      objectFit: 'cover',
      transformOrigin: 'top left',
      pointerEvents: 'none',
      willChange: 'transform',
      borderRadius: '18px',
      boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
      background: 'rgba(255, 0, 0, 0.3)',
      transition:
        `transform ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${openDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      ...makeGhostBaseStyle(toRect),
      transform: flipTransform(fromRect, toRect),
    }

    debug?.log('transitions', 'open: ghost initial style:', JSON.stringify({
      left: `${toRect.left}px`, top: `${toRect.top}px`,
      width: `${toRect.width}px`, height: `${toRect.height}px`,
      transform: flipTransform(fromRect, toRect),
    }))

    await nextFrame()

    // Verify ghost element exists in DOM
    const ghostEl = document.querySelector('.ghost-image') as HTMLElement | null
    debug?.log('transitions', 'open: ghost element after nextFrame:', ghostEl ? {
      offsetWidth: ghostEl.offsetWidth,
      offsetHeight: ghostEl.offsetHeight,
      computedTransform: getComputedStyle(ghostEl).transform,
      computedPosition: getComputedStyle(ghostEl).position,
      computedDisplay: getComputedStyle(ghostEl).display,
      computedVisibility: getComputedStyle(ghostEl).visibility,
      computedOpacity: getComputedStyle(ghostEl).opacity,
      naturalWidth: (ghostEl as HTMLImageElement).naturalWidth,
      naturalHeight: (ghostEl as HTMLImageElement).naturalHeight,
      currentSrc: (ghostEl as HTMLImageElement).currentSrc,
    } : 'NOT FOUND IN DOM')

    overlayOpacity.value = 1
    ghostStyle.value = {
      ...ghostStyle.value,
      transform: 'translate(0px, 0px) scale(1, 1)',
      borderRadius: '24px',
      boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
    }

    debug?.log('transitions', 'open: transition target set, waiting', openDurationMs, 'ms + image load')

    await Promise.all([wait(openDurationMs), ensureImageLoaded(photo.full)])

    mediaOpacity.value = 1
    await nextFrame()
    resetOpenState()
  }

  async function open(index: number, callbacks: TransitionCallbacks) {
    if (animating.value) return

    debug?.group('transitions', `open(index=${index})`)

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

    try {
      // Instant mode — no animation at all
      if (isNoneMode()) {
        await doInstantOpen(photo)
        debug?.log('transitions', 'open: complete')
        debug?.groupEnd('transitions')
        return
      }

      const thumbEl = thumbRefs.get(index)
      const fromRect = thumbEl?.getBoundingClientRect() ?? null
      const toRect = getAbsoluteFrameRect(photo)

      debug?.log('transitions', 'fromRect (thumb):', fromRect ? { left: fromRect.left, top: fromRect.top, width: fromRect.width, height: fromRect.height } : null)
      debug?.log('transitions', 'toRect (frame):', toRect)
      debug?.log('transitions', 'isUsableRect(fromRect):', isUsableRect(fromRect))

      // Determine transition mode
      const useFlip = fromRect && toRect && isUsableRect(fromRect)
        && (!transitionConfig || shouldUseFlip(fromRect, transitionConfig, debug))

      if (useFlip) {
        await doFlipOpen(index, photo, fromRect, toRect)
      } else {
        await doFadeOpen(photo)
      }

      debug?.log('transitions', 'open: complete')
      debug?.groupEnd('transitions')
    } catch (err) {
      debug?.warn('transitions', 'open: error, forcing recovery', err)
      debug?.groupEnd('transitions')
      // Force a usable state: show the lightbox without animation
      overlayOpacity.value = 1
      mediaOpacity.value = 1
      resetOpenState()
    }
  }

  // --- CLOSE ---

  async function doInstantClose() {
    debug?.log('transitions', 'close: INSTANT (mode=none)')
    mediaOpacity.value = 0
    chromeOpacity.value = 0
    overlayOpacity.value = 0
  }

  async function doFadeClose() {
    debug?.log('transitions', 'close: using smooth FADE')
    animating.value = true
    mediaOpacity.value = 0
    chromeOpacity.value = 0

    // Animate overlay out smoothly
    await animateNumber(overlayOpacity.value, 0, fadeDurationMs, (v) => {
      overlayOpacity.value = v
    }, easeOutCubic)
  }

  async function doFlipClose(photo: Photo, fromRect: { left: number; top: number; width: number; height: number }, toRect: DOMRect) {
    debug?.log('transitions', 'close: using FLIP animation')

    animating.value = true
    hiddenThumbIndex.value = activeIndex.value
    mediaOpacity.value = 0
    chromeOpacity.value = 0

    ghostSrc.value = photo.thumb
    ghostVisible.value = true
    ghostStyle.value = {
      position: 'fixed',
      zIndex: '60',
      objectFit: 'cover',
      transformOrigin: 'top left',
      pointerEvents: 'none',
      willChange: 'transform',
      borderRadius: '24px',
      boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
      background: 'rgba(0, 0, 255, 0.3)',
      transition:
        `transform ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      ...makeGhostBaseStyle(toRect),
      transform: flipTransform(fromRect, toRect),
    }

    debug?.log('transitions', 'close: ghost initial style:', JSON.stringify({
      left: `${toRect.left}px`, top: `${toRect.top}px`,
      width: `${toRect.width}px`, height: `${toRect.height}px`,
      transform: flipTransform(fromRect, toRect),
    }))

    await nextFrame()

    // Verify ghost element exists in DOM
    const ghostEl = document.querySelector('.ghost-image') as HTMLElement | null
    debug?.log('transitions', 'close: ghost element after nextFrame:', ghostEl ? {
      offsetWidth: ghostEl.offsetWidth,
      offsetHeight: ghostEl.offsetHeight,
      boundingRect: ghostEl.getBoundingClientRect(),
      computedTransform: getComputedStyle(ghostEl).transform,
      computedPosition: getComputedStyle(ghostEl).position,
      computedDisplay: getComputedStyle(ghostEl).display,
      computedVisibility: getComputedStyle(ghostEl).visibility,
      computedOpacity: getComputedStyle(ghostEl).opacity,
      computedZIndex: getComputedStyle(ghostEl).zIndex,
      naturalWidth: (ghostEl as HTMLImageElement).naturalWidth,
      naturalHeight: (ghostEl as HTMLImageElement).naturalHeight,
      complete: (ghostEl as HTMLImageElement).complete,
    } : 'NOT FOUND IN DOM')

    overlayOpacity.value = 0
    ghostStyle.value = {
      ...ghostStyle.value,
      transform: 'translate(0px, 0px) scale(1, 1)',
      borderRadius: '18px',
      boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
    }

    debug?.log('transitions', 'close: transition target set, waiting', closeDurationMs, 'ms')

    await wait(closeDurationMs)
  }

  async function close(callbacks: CloseCallbacks) {
    if (!lightboxMounted.value || animating.value) return

    debug?.group('transitions', `close(activeIndex=${activeIndex.value})`)

    callbacks.cancelTapTimer()
    callbacks.resetGestureState()

    if (callbacks.isZoomedIn.value || closeDragY.value) {
      debug?.log('transitions', 'close: resetting zoom/drag before close')
      callbacks.setPanzoomImmediate(1, { x: 0, y: 0 })
      closeDragY.value = 0
      await nextFrame()
    }

    callbacks.syncGeometry()

    const photo = currentPhoto.value

    try {
      // Instant mode
      if (isNoneMode()) {
        await doInstantClose()
        debug?.log('transitions', 'close: complete')
        debug?.groupEnd('transitions')
        resetCloseState()
        return
      }

      const fromRect = getAbsoluteFrameRect(photo)
      const toRect = thumbRefs.get(activeIndex.value)?.getBoundingClientRect() ?? null

      debug?.log('transitions', 'fromRect (frame):', fromRect)
      debug?.log('transitions', 'toRect (thumb):', toRect ? { left: toRect.left, top: toRect.top, width: toRect.width, height: toRect.height } : null)
      debug?.log('transitions', 'isUsableRect(toRect):', isUsableRect(toRect))

      // Determine transition mode
      const useFlip = fromRect && toRect && isUsableRect(toRect)
        && (!transitionConfig || shouldUseFlip(toRect, transitionConfig, debug))

      if (useFlip) {
        await doFlipClose(photo, fromRect, toRect)
      } else {
        await doFadeClose()
      }

      // Log BEFORE resetting state (lightboxMounted=false triggers watchers)
      debug?.log('transitions', 'close: complete')
      debug?.groupEnd('transitions')
    } catch (err) {
      debug?.warn('transitions', 'close: error, forcing recovery', err)
      debug?.groupEnd('transitions')
    }

    resetCloseState()
  }

  async function animateCloseDragTo(target: number, duration = 220) {
    const start = closeDragY.value
    await animateNumber(start, target, duration, (value) => {
      closeDragY.value = value
    })
  }

  async function handleCloseGesture(deltaY: number, velocityY: number, closeFn: () => Promise<void>) {
    const threshold = Math.min(180, (areaMetrics.value?.height ?? 600) * 0.2)

    debug?.log('gestures', `closeGesture: deltaY=${deltaY.toFixed(1)} velocityY=${velocityY.toFixed(3)} threshold=${threshold.toFixed(0)}`)

    if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
      debug?.log('gestures', 'closeGesture: threshold exceeded → closing')
      await closeFn()
      return
    }

    debug?.log('gestures', 'closeGesture: below threshold → bouncing back')
    animating.value = true
    try {
      await animateCloseDragTo(0)
    } finally {
      animating.value = false
    }
  }

  function handleBackdropClick(closeFn: () => Promise<void>) {
    if (animating.value) return
    debug?.log('transitions', 'backdrop click → closing')
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
