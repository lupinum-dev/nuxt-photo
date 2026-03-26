import { computed, nextTick, ref, type ComponentPublicInstance, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import {
  flipTransform,
  isUsableRect,
  makeGhostBaseStyle,
  ensureImageLoaded,
  nextFrame,
  wait,
  animateNumber,
  easeOutCubic,
  shouldUseFlip,
  planCloseTransition,
  type AreaMetrics,
  type PanState,
  type PhotoItem,
  type DebugLogger,
  type TransitionModeConfig,
  type RectLike,
} from '@nuxt-photo/core'

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
  activeIndex: Ref<number>,
  currentPhoto: ComputedRef<PhotoItem>,
  areaMetrics: Ref<AreaMetrics | null>,
  getAbsoluteFrameRect: (photo: PhotoItem) => { left: number; top: number; width: number; height: number } | null,
  debug?: DebugLogger,
  transitionConfig?: TransitionModeConfig,
) {
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

  const thumbRefs = new Map<number, HTMLElement>()

  const transitionInProgress = computed(() => animating.value || ghostVisible.value)

  const chromeStyle = computed<CSSProperties>(() => ({
    opacity: String(uiVisible.value ? chromeOpacity.value : 0),
    pointerEvents: uiVisible.value && chromeOpacity.value > 0.05 ? 'auto' : 'none',
  }))

  const closeDragRatio = computed(() => {
    const height = areaMetrics.value?.height || 1
    return Math.min(0.75, Math.abs(closeDragY.value) / Math.max(240, height * 0.85))
  })

  const disableBackdropTransition = ref(false)

  const backdropStyle = computed<CSSProperties>(() => ({
    opacity: String(overlayOpacity.value * (1 - closeDragRatio.value)),
    ...(disableBackdropTransition.value ? { transition: 'none' } : {}),
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

  let animationGuardId: ReturnType<typeof setTimeout> | null = null
  const MAX_ANIMATION_MS = 2000

  function startAnimationGuard() {
    clearAnimationGuard()
    animationGuardId = setTimeout(() => {
      if (animating.value) {
        debug?.warn('transitions', `RECOVERY: animating stuck for ${MAX_ANIMATION_MS}ms, forcing resetCloseState`)
        resetCloseState()
      }
    }, MAX_ANIMATION_MS)
  }

  function clearAnimationGuard() {
    if (animationGuardId) {
      clearTimeout(animationGuardId)
      animationGuardId = null
    }
  }

  function resetCloseState() {
    debug?.log('transitions', 'resetCloseState: unmounting lightbox')
    clearAnimationGuard()
    ghostVisible.value = false
    ghostSrc.value = ''
    hiddenThumbIndex.value = null
    closeDragY.value = 0
    disableBackdropTransition.value = false
    overlayOpacity.value = 0
    mediaOpacity.value = 0
    chromeOpacity.value = 0
    animating.value = false
    lightboxMounted.value = false
  }

  function isNoneMode(): boolean {
    return transitionConfig?.mode === 'none'
  }

  async function doInstantOpen(photo: PhotoItem) {
    debug?.log('transitions', 'open: INSTANT (mode=none)')
    overlayOpacity.value = 1
    await ensureImageLoaded(photo.src)
    mediaOpacity.value = 1
    chromeOpacity.value = 1
  }

  async function doFadeOpen(photo: PhotoItem, targetRect: RectLike | null) {
    const fadeOpenDuration = 300

    animating.value = true
    const imgSrc = photo.thumbSrc || photo.src

    if (targetRect) {
      debug?.log('transitions', `open FADE: ghost scale-in at ${targetRect.width.toFixed(0)}x${targetRect.height.toFixed(0)} @ (${targetRect.left.toFixed(0)},${targetRect.top.toFixed(0)})`)

      ghostSrc.value = imgSrc
      ghostVisible.value = true
      ghostStyle.value = {
        position: 'fixed',
        zIndex: '60',
        objectFit: 'contain',
        transformOrigin: 'center center',
        pointerEvents: 'none',
        willChange: 'transform, opacity',
        borderRadius: '16px',
        opacity: '0',
        transform: 'scale(0.92)',
        ...makeGhostBaseStyle(targetRect),
      }

      await nextFrame()

      // Animate ghost scale-in + backdrop together
      await animateNumber(0, 1, fadeOpenDuration, (t) => {
        const s = 0.92 + 0.08 * t
        ghostStyle.value = {
          ...ghostStyle.value,
          transform: `scale(${s})`,
          opacity: String(t),
        }
        overlayOpacity.value = t
      }, easeOutCubic)

      // Wait for full-res image then swap
      await ensureImageLoaded(photo.src)
      mediaOpacity.value = 1
      ghostVisible.value = false
      chromeOpacity.value = 1
    } else {
      debug?.log('transitions', 'open FADE: no target rect, simple overlay fade')

      await animateNumber(0, 1, fadeOpenDuration, (v) => {
        overlayOpacity.value = v
      }, easeOutCubic)

      await ensureImageLoaded(photo.src)
      mediaOpacity.value = 1
      chromeOpacity.value = 1
    }

    animating.value = false
  }

  async function doFlipOpen(index: number, photo: PhotoItem, fromRect: DOMRect, toRect: { left: number; top: number; width: number; height: number }) {
    debug?.log('transitions', 'open: using FLIP animation')

    animating.value = true
    hiddenThumbIndex.value = index

    const thumbSrc = photo.thumbSrc || photo.src
    ghostSrc.value = thumbSrc
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

    await Promise.all([wait(openDurationMs), ensureImageLoaded(photo.src)])

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
      if (isNoneMode()) {
        await doInstantOpen(photo)
        debug?.log('transitions', 'open: complete')
        debug?.groupEnd('transitions')
        return
      }

      const thumbEl = thumbRefs.get(index)
      const fromRect = thumbEl?.getBoundingClientRect() ?? null
      const toRect = getAbsoluteFrameRect(photo)

      const useFlip = fromRect && toRect && isUsableRect(fromRect)
        && (!transitionConfig || shouldUseFlip(fromRect, transitionConfig, debug))

      if (useFlip) {
        await doFlipOpen(index, photo, fromRect, toRect)
      } else {
        await doFadeOpen(photo, toRect)
      }

      debug?.log('transitions', 'open: complete')
      debug?.groupEnd('transitions')
    } catch (err) {
      debug?.warn('transitions', 'open: error, forcing recovery', err)
      debug?.groupEnd('transitions')
      overlayOpacity.value = 1
      mediaOpacity.value = 1
      resetOpenState()
    }
  }

  async function doInstantClose() {
    debug?.log('transitions', 'close: INSTANT (mode=none)')
    mediaOpacity.value = 0
    chromeOpacity.value = 0
    overlayOpacity.value = 0
  }

  async function doFadeClose(photo: PhotoItem, frameRect: RectLike | null) {
    const fadeCloseDuration = 300
    const backdropDelayRatio = 0.2

    animating.value = true
    chromeOpacity.value = 0
    disableBackdropTransition.value = true

    if (frameRect) {
      debug?.log('transitions', `close FADE: ghost scale-out at ${frameRect.width.toFixed(0)}x${frameRect.height.toFixed(0)} @ (${frameRect.left.toFixed(0)},${frameRect.top.toFixed(0)})`)

      // Show ghost at exact lightbox image position, let it render, THEN hide real image
      ghostSrc.value = photo.src
      ghostVisible.value = true
      ghostStyle.value = {
        position: 'fixed',
        zIndex: '60',
        objectFit: 'contain',
        transformOrigin: 'center center',
        pointerEvents: 'none',
        willChange: 'transform, opacity',
        borderRadius: '16px',
        opacity: '1',
        transform: 'scale(1)',
        ...makeGhostBaseStyle(frameRect),
      }

      await nextFrame()
      mediaOpacity.value = 0
      await nextFrame()

      const overlayStart = overlayOpacity.value

      // Animate ghost scale-out + staggered backdrop fade
      await animateNumber(0, 1, fadeCloseDuration, (t) => {
        const s = 1 - 0.12 * t
        ghostStyle.value = {
          ...ghostStyle.value,
          transform: `scale(${s})`,
          opacity: String(1 - t),
        }

        // Backdrop starts fading after a delay
        const backdropT = Math.max(0, (t - backdropDelayRatio) / (1 - backdropDelayRatio))
        overlayOpacity.value = overlayStart * (1 - backdropT)
      }, easeOutCubic)
    } else {
      debug?.log('transitions', 'close FADE: no frame rect, simple overlay fade')
      mediaOpacity.value = 0

      await animateNumber(overlayOpacity.value, 0, fadeDurationMs, (v) => {
        overlayOpacity.value = v
      }, easeOutCubic)
    }

    debug?.log('transitions', 'close FADE: animation complete')
  }

  async function doFlipClose(
    photo: PhotoItem,
    fromRect: RectLike,
    toRect: DOMRect,
    dragOffsetY: number,
    dragScale: number,
  ) {
    debug?.log('transitions', 'close FLIP: starting')

    animating.value = true
    disableBackdropTransition.value = true
    hiddenThumbIndex.value = activeIndex.value
    chromeOpacity.value = 0

    // Use full-res src (already loaded & cached) to avoid any loading flash
    ghostSrc.value = photo.src
    debug?.log('transitions', `close FLIP: ghostSrc=${photo.src}`)

    // Adjust fromRect to match the visual position if there was a drag offset
    const adjustedFromRect: RectLike = (dragOffsetY !== 0 || dragScale !== 1)
      ? {
          left: fromRect.left + (fromRect.width * (1 - dragScale)) / 2,
          top: fromRect.top + dragOffsetY + (fromRect.height * (1 - dragScale)) / 2,
          width: fromRect.width * dragScale,
          height: fromRect.height * dragScale,
        }
      : fromRect

    if (dragOffsetY !== 0 || dragScale !== 1) {
      debug?.log('transitions', `close FLIP: drag-adjusted fromRect — dragY=${dragOffsetY.toFixed(1)} dragScale=${dragScale.toFixed(3)}`, adjustedFromRect)
    }

    const initialTransform = flipTransform(adjustedFromRect, toRect)
    debug?.log('transitions', `close FLIP: ghost base at thumbnail ${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} @ (${toRect.left.toFixed(0)},${toRect.top.toFixed(0)})`)
    debug?.log('transitions', `close FLIP: initial transform: ${initialTransform}`)

    // Show ghost and let it render BEFORE hiding the real image to avoid black flash
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
      transition:
        `transform ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      ...makeGhostBaseStyle(toRect),
      transform: initialTransform,
    }

    debug?.log('transitions', 'close FLIP: ghost visible, waiting for next frame')
    await nextFrame()

    // Hide real image only after ghost has rendered
    mediaOpacity.value = 0
    await nextFrame()

    debug?.log('transitions', 'close FLIP: animating to identity (thumbnail position)')
    overlayOpacity.value = 0
    ghostStyle.value = {
      ...ghostStyle.value,
      transform: 'translate(0px, 0px) scale(1, 1)',
      borderRadius: '18px',
      boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
    }

    await wait(closeDurationMs)

    // Cross-fade: unhide thumbnail and fade ghost out so thumbnails with CSS
    // opacity transitions don't flash black when the ghost is removed instantly
    hiddenThumbIndex.value = null
    ghostStyle.value = {
      ...ghostStyle.value,
      transition: 'opacity 180ms ease',
      opacity: '0',
    }
    await wait(180)

    debug?.log('transitions', `close FLIP: animation complete (${closeDurationMs}ms)`)
  }

  async function close(callbacks: CloseCallbacks) {
    if (!lightboxMounted.value || animating.value) {
      debug?.warn('transitions', `close: BLOCKED — lightboxMounted=${lightboxMounted.value} animating=${animating.value}`)
      return
    }

    debug?.group('transitions', `close(activeIndex=${activeIndex.value})`)
    debug?.log('transitions', `close: pre-state — isZoomedIn=${callbacks.isZoomedIn.value} closeDragY=${closeDragY.value.toFixed(1)} ghostVisible=${ghostVisible.value} mediaOpacity=${mediaOpacity.value.toFixed(2)}`)

    startAnimationGuard()

    callbacks.cancelTapTimer()
    callbacks.resetGestureState()

    // Capture drag state BEFORE resetting so we can position the ghost correctly
    const dragOffsetY = closeDragY.value
    const dragScale = 1 - closeDragRatio.value * 0.05
    if (dragOffsetY !== 0) {
      debug?.log('transitions', `close: captured drag state — dragY=${dragOffsetY.toFixed(1)} dragScale=${dragScale.toFixed(3)}`)
    }

    if (callbacks.isZoomedIn.value) {
      debug?.log('transitions', 'close: resetting zoom')
      callbacks.setPanzoomImmediate(1, { x: 0, y: 0 })
    }
    // Reset drag AFTER capturing
    closeDragY.value = 0
    await nextFrame()

    callbacks.syncGeometry()

    const photo = currentPhoto.value

    try {
      const fromRect = getAbsoluteFrameRect(photo)
      debug?.log('transitions', 'close: fromRect (lightbox frame)',
        fromRect ? `${fromRect.width.toFixed(0)}x${fromRect.height.toFixed(0)} @ (${fromRect.left.toFixed(0)},${fromRect.top.toFixed(0)})` : 'NULL')

      const thumbEl = thumbRefs.get(activeIndex.value)
      debug?.log('transitions', `close: thumbRef lookup index=${activeIndex.value} found=${!!thumbEl} registeredRefs=[${[...thumbRefs.keys()].join(',')}]`)

      const toRect = thumbEl?.getBoundingClientRect() ?? null
      debug?.log('transitions', 'close: toRect (thumbnail)',
        toRect ? `${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} @ (${toRect.left.toFixed(0)},${toRect.top.toFixed(0)})` : 'NULL')

      // Build a transition plan
      let plan = planCloseTransition({
        fromRect,
        toRect,
        thumbRefExists: !!thumbEl,
        config: transitionConfig ?? { mode: 'auto', autoThreshold: 0.55 },
        debug,
      })

      debug?.log('transitions', `close: plan=${plan.mode} reason=${plan.reason}`)

      // Scroll-into-view recovery for off-screen thumbnails
      if (plan.reason === 'thumb-off-screen' && thumbEl) {
        debug?.log('transitions', 'close: thumbnail off-screen, attempting scrollIntoView recovery')
        try {
          thumbEl.scrollIntoView({ behavior: 'instant', block: 'nearest' })
        } catch {
          thumbEl.scrollIntoView({ block: 'nearest' })
        }
        await nextFrame()

        const retriedRect = thumbEl.getBoundingClientRect()
        debug?.log('transitions', 'close: retried toRect after scroll',
          `${retriedRect.width.toFixed(0)}x${retriedRect.height.toFixed(0)} @ (${retriedRect.left.toFixed(0)},${retriedRect.top.toFixed(0)})`)

        if (isUsableRect(retriedRect) && shouldUseFlip(retriedRect, transitionConfig ?? { mode: 'auto', autoThreshold: 0.55 }, debug)) {
          debug?.log('transitions', 'close: scroll recovery succeeded → upgrading to FLIP')
          plan = { mode: 'flip', durationMs: closeDurationMs, fromRect: fromRect!, toRect: retriedRect as unknown as DOMRect, reason: 'scrolled-into-view' }
        } else {
          debug?.log('transitions', 'close: scroll recovery failed → staying with FADE')
        }
      }

      if (plan.mode === 'instant') {
        await doInstantClose()
      } else if (plan.mode === 'flip' && plan.fromRect && plan.toRect) {
        await doFlipClose(photo, plan.fromRect, plan.toRect as DOMRect, dragOffsetY, dragScale)
      } else {
        await doFadeClose(photo, fromRect)
      }

      debug?.log('transitions', 'close: complete')
    } catch (err) {
      debug?.warn('transitions', 'close: error, forcing recovery', err)
    } finally {
      debug?.groupEnd('transitions')
      resetCloseState()
    }
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
      debug?.log('transitions', `close: triggered by drag gesture — deltaY=${deltaY.toFixed(1)} velocityY=${velocityY.toFixed(3)}`)
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
    transitionInProgress,
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
