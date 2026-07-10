import {
  flipTransform,
  makeGhostBaseStyle,
  chooseCloseTransition,
  DEFAULT_TRANSITION_CONFIG,
  type RectLike,
} from '../../core/index'
import {
  closeDurationMs,
  fadeDurationMs,
  type CloseCallbacks,
  type GhostState,
} from './types'
import { resetCloseState } from './state'
import { animateNumber, easeOutCubic, nextFrame, wait } from './animation'

async function doInstantClose(s: GhostState) {
  s.debug?.log('transitions', 'close: INSTANT (mode=none)')
  s.mediaOpacity.value = 0
  s.chromeOpacity.value = 0
  s.overlayOpacity.value = 0
}

async function doFadeClose(
  s: GhostState,
  slideSrc: string,
  frameRect: RectLike | null,
  signal: AbortSignal,
) {
  const fadeCloseDuration = 300
  const backdropDelayRatio = 0.2

  s.animating.value = true
  s.chromeOpacity.value = 0
  s.disableBackdropTransition.value = true

  if (frameRect) {
    s.debug?.log(
      'transitions',
      `close FADE: ghost scale-out at ${frameRect.width.toFixed(0)}x${frameRect.height.toFixed(0)} @ (${frameRect.left.toFixed(0)},${frameRect.top.toFixed(0)})`,
    )

    s.ghostSrc.value = slideSrc
    s.ghostVisible.value = true
    s.ghostStyle.value = {
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

    await nextFrame(signal)
    s.mediaOpacity.value = 0
    await nextFrame(signal)

    const overlayStart = s.overlayOpacity.value

    await animateNumber(
      0,
      1,
      fadeCloseDuration,
      (t) => {
        const sc = 1 - 0.12 * t
        s.ghostStyle.value = {
          ...s.ghostStyle.value,
          transform: `scale(${sc})`,
          opacity: String(1 - t),
        }

        const backdropT = Math.max(
          0,
          (t - backdropDelayRatio) / (1 - backdropDelayRatio),
        )
        s.overlayOpacity.value = overlayStart * (1 - backdropT)
      },
      easeOutCubic,
      signal,
    )
  } else {
    s.debug?.log(
      'transitions',
      'close FADE: no frame rect, simple overlay fade',
    )
    s.mediaOpacity.value = 0

    await animateNumber(
      s.overlayOpacity.value,
      0,
      fadeDurationMs,
      (v) => {
        s.overlayOpacity.value = v
      },
      easeOutCubic,
      signal,
    )
  }

  s.debug?.log('transitions', 'close FADE: animation complete')
}

async function doFlipClose(
  s: GhostState,
  slideSrc: string,
  fromRect: RectLike,
  toRect: DOMRect,
  dragOffsetY: number,
  dragScale: number,
  signal: AbortSignal,
) {
  s.debug?.log('transitions', 'close FLIP: starting')

  s.animating.value = true
  s.disableBackdropTransition.value = true
  s.hiddenThumbIndex.value = s.activeIndex.value
  s.chromeOpacity.value = 0

  s.ghostSrc.value = slideSrc
  s.debug?.log('transitions', `close FLIP: ghostSrc=${slideSrc}`)

  const adjustedFromRect: RectLike =
    dragOffsetY !== 0 || dragScale !== 1
      ? {
          left: fromRect.left + (fromRect.width * (1 - dragScale)) / 2,
          top:
            fromRect.top +
            dragOffsetY +
            (fromRect.height * (1 - dragScale)) / 2,
          width: fromRect.width * dragScale,
          height: fromRect.height * dragScale,
        }
      : fromRect

  if (dragOffsetY !== 0 || dragScale !== 1) {
    s.debug?.log(
      'transitions',
      `close FLIP: drag-adjusted fromRect — dragY=${dragOffsetY.toFixed(1)} dragScale=${dragScale.toFixed(3)}`,
      adjustedFromRect,
    )
  }

  const initialTransform = flipTransform(adjustedFromRect, toRect)
  s.debug?.log(
    'transitions',
    `close FLIP: ghost base at thumbnail ${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} @ (${toRect.left.toFixed(0)},${toRect.top.toFixed(0)})`,
  )
  s.debug?.log(
    'transitions',
    `close FLIP: initial transform: ${initialTransform}`,
  )

  s.ghostVisible.value = true
  s.ghostStyle.value = {
    position: 'fixed',
    zIndex: '60',
    objectFit: 'cover',
    transformOrigin: 'top left',
    pointerEvents: 'none',
    willChange: 'transform',
    borderRadius: '24px',
    boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
    transition: `transform ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${closeDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    ...makeGhostBaseStyle(toRect),
    transform: initialTransform,
  }

  s.debug?.log(
    'transitions',
    'close FLIP: ghost visible, waiting for next frame',
  )
  await nextFrame(signal)

  s.mediaOpacity.value = 0
  await nextFrame(signal)

  s.debug?.log(
    'transitions',
    'close FLIP: animating to identity (thumbnail position)',
  )
  s.overlayOpacity.value = 0
  s.ghostStyle.value = {
    ...s.ghostStyle.value,
    transform: 'translate(0px, 0px) scale(1, 1)',
    borderRadius: '18px',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.12)',
  }

  await wait(closeDurationMs, signal)

  s.hiddenThumbIndex.value = null
  s.ghostStyle.value = {
    ...s.ghostStyle.value,
    transition: 'opacity 180ms ease',
    opacity: '0',
  }
  await wait(180, signal)

  s.debug?.log(
    'transitions',
    `close FLIP: animation complete (${closeDurationMs}ms)`,
  )
}

/** Create the close-transition controller and recovery guards for ghost animations. */
export function createCloseTransition(s: GhostState) {
  async function close(callbacks: CloseCallbacks, signal: AbortSignal) {
    s.debug?.group('transitions', `close(activeIndex=${s.activeIndex.value})`)
    s.debug?.log(
      'transitions',
      `close: pre-state — isZoomedIn=${callbacks.isZoomedIn.value} closeDragY=${s.closeDragY.value.toFixed(1)} ghostVisible=${s.ghostVisible.value} mediaOpacity=${s.mediaOpacity.value.toFixed(2)}`,
    )

    callbacks.cancelTapTimer()
    callbacks.resetGestureState()

    const dragOffsetY = s.closeDragY.value
    const dragScale = 1 - s.closeDragRatio.value * 0.05
    if (dragOffsetY !== 0) {
      s.debug?.log(
        'transitions',
        `close: captured drag state — dragY=${dragOffsetY.toFixed(1)} dragScale=${dragScale.toFixed(3)}`,
      )
    }

    if (callbacks.isZoomedIn.value) {
      s.debug?.log('transitions', 'close: resetting zoom')
      callbacks.setPanzoomImmediate(1, { x: 0, y: 0 })
    }
    s.closeDragY.value = 0
    await nextFrame(signal)

    callbacks.syncGeometry()

    const photo = s.currentPhoto.value
    if (!photo) {
      s.debug?.warn(
        'transitions',
        'close: no active photo, using instant close',
      )
      await doInstantClose(s)
      resetCloseState(s)
      s.debug?.groupEnd('transitions')
      return
    }

    try {
      const slideSrc = callbacks.getSlideSrc(photo)
      const fromRect = s.getAbsoluteFrameRect(photo)
      s.debug?.log(
        'transitions',
        'close: fromRect (lightbox frame)',
        fromRect
          ? `${fromRect.width.toFixed(0)}x${fromRect.height.toFixed(0)} @ (${fromRect.left.toFixed(0)},${fromRect.top.toFixed(0)})`
          : 'NULL',
      )

      const thumbEl = s.thumbRefs.get(s.activeIndex.value)
      s.debug?.log(
        'transitions',
        `close: thumbRef lookup index=${s.activeIndex.value} found=${!!thumbEl} registeredRefs=[${[...s.thumbRefs.keys()].join(',')}]`,
      )

      const toRect = thumbEl?.getBoundingClientRect() ?? null
      s.debug?.log(
        'transitions',
        'close: toRect (thumbnail)',
        toRect
          ? `${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} @ (${toRect.left.toFixed(0)},${toRect.top.toFixed(0)})`
          : 'NULL',
      )

      const plan = chooseCloseTransition({
        fromRect,
        toRect,
        thumbRefExists: !!thumbEl,
        config: s.transitionConfig ?? DEFAULT_TRANSITION_CONFIG,
        debug: s.debug,
      })

      s.debug?.log(
        'transitions',
        `close: plan=${plan.mode} reason=${plan.reason}`,
      )

      if (plan.mode === 'instant') {
        await doInstantClose(s)
      } else if (plan.mode === 'flip' && plan.fromRect && plan.toRect) {
        await doFlipClose(
          s,
          slideSrc,
          plan.fromRect,
          plan.toRect as DOMRect,
          dragOffsetY,
          dragScale,
          signal,
        )
      } else {
        await doFadeClose(s, slideSrc, fromRect, signal)
      }

      s.debug?.log('transitions', 'close: complete')
      s.debug?.groupEnd('transitions')
      resetCloseState(s)
    } catch (err) {
      s.debug?.warn('transitions', 'close: error, forcing recovery', err)
      s.debug?.groupEnd('transitions')
      resetCloseState(s)
      throw err
    }
  }

  async function animateCloseDragTo(
    target: number,
    duration = 220,
    signal?: AbortSignal,
  ) {
    const start = s.closeDragY.value
    await animateNumber(
      start,
      target,
      duration,
      (value) => {
        s.closeDragY.value = value
      },
      undefined,
      signal,
    )
  }

  async function handleCloseGesture(
    deltaY: number,
    velocityY: number,
    closeFn: () => Promise<void>,
  ) {
    const threshold = Math.min(180, (s.areaMetrics.value?.height ?? 600) * 0.2)

    s.debug?.log(
      'gestures',
      `closeGesture: deltaY=${deltaY.toFixed(1)} velocityY=${velocityY.toFixed(3)} threshold=${threshold.toFixed(0)}`,
    )

    if (Math.abs(deltaY) > threshold || Math.abs(velocityY) > 0.55) {
      s.debug?.log('gestures', 'closeGesture: threshold exceeded → closing')
      s.debug?.log(
        'transitions',
        `close: triggered by drag gesture — deltaY=${deltaY.toFixed(1)} velocityY=${velocityY.toFixed(3)}`,
      )
      await closeFn()
      return
    }

    s.debug?.log('gestures', 'closeGesture: below threshold → bouncing back')
    s.animating.value = true
    try {
      await animateCloseDragTo(0)
    } finally {
      s.animating.value = false
    }
  }

  function handleBackdropClick(closeFn: () => Promise<void>) {
    if (s.animating.value) return
    s.debug?.log('transitions', 'backdrop click → closing')
    void closeFn()
  }

  return { close, animateCloseDragTo, handleCloseGesture, handleBackdropClick }
}
