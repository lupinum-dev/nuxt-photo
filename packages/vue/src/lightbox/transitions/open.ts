import { nextTick, toValue } from 'vue'
import {
  isUsableRect,
  shouldUseFlip,
  type RectLike,
} from '../../core/index'
import { flipTransform } from '../../core/geometry/rect'
import { IMAGE_LOAD_TIMEOUT_MS } from '../../core/image/constants'
import { nextFrame, throwIfAborted, wait } from './animation'
import type { MotionCallbacks, OpenTransitionContext } from './types'
import { opacityOf, rectsMatch, visible } from './visual-state'
import { REDUCED_MOTION_DURATION_MS, TRANSITION_EASING } from './timing'

const OPEN_DURATION_MS = 420
const FADE_DURATION_MS = 220
const HANDOFF_DURATION_MS = 100
const INTERRUPTED_HANDOFF_MS = 80

async function decodeActiveImage(
  context: OpenTransitionContext,
  index: number,
  signal: AbortSignal,
) {
  await nextTick()
  throwIfAborted(signal)
  const element = context.visual.slideImageRefs.get(index)
  if (!(element instanceof HTMLImageElement)) {
    await nextFrame(signal)
    return { ok: true as const }
  }

  const decode = element.decode?.bind(element)
  if (!decode) {
    if (element.complete && element.naturalWidth > 0) return { ok: true as const }
    return new Promise<{ ok: true } | { ok: false; error: unknown }>((resolve, reject) => {
      let settled = false
      const cleanup = () => {
        clearTimeout(timeout)
        signal.removeEventListener('abort', abort)
        element.removeEventListener('load', loaded)
        element.removeEventListener('error', failed)
      }
      const finish = (result: { ok: true } | { ok: false; error: unknown }) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(result)
      }
      const abort = () => {
        if (settled) return
        settled = true
        cleanup()
        reject(signal.reason ?? new DOMException('Operation aborted', 'AbortError'))
      }
      const loaded = () => finish({ ok: true })
      const failed = () => finish({ ok: false, error: new Error('Image failed to load') })
      const timeout = setTimeout(
        () => finish({ ok: false, error: new Error('Image load timed out') }),
        IMAGE_LOAD_TIMEOUT_MS,
      )
      signal.addEventListener('abort', abort, { once: true })
      element.addEventListener('load', loaded, { once: true })
      element.addEventListener('error', failed, { once: true })
      if (signal.aborted) abort()
    })
  }

  try {
    await Promise.race([
      decode(),
      wait(IMAGE_LOAD_TIMEOUT_MS, signal).then(() => {
        throw new Error(`Image decode timed out: ${element.currentSrc || element.src}`)
      }),
    ])
    return { ok: true as const }
  } catch (error) {
    throwIfAborted(signal)
    return { ok: false as const, error }
  }
}

async function handoffToMedia(context: OpenTransitionContext, signal: AbortSignal) {
  const current = context.visual.elements()
  if (!current.transitionFrame) return
  if (current.viewport) current.viewport.style.opacity = '1'
  await context.visual.animate(
    current.transitionImage,
    [{ opacity: Number(getComputedStyle(current.transitionImage!).opacity) }, { opacity: 0 }],
    { duration: HANDOFF_DURATION_MS, easing: 'linear' },
    ['opacity'],
    signal,
  )
  current.transitionFrame.style.display = 'none'
  current.transitionFrame.style.opacity = '0'
}

async function runFadeOpen(
  context: OpenTransitionContext,
  duration: number,
  callbacks: MotionCallbacks,
  signal: AbortSignal,
) {
  const { visual } = context
  const current = visual.elements()
  context.stageMounted.value = true
  const decodePromise = callbacks
    .prepareActiveSlide(true)
    .then(() => decodeActiveImage(context, context.activeIndex.value, signal))
  const shell = Promise.all([
    visual.animate(
      current.overlay,
      [{ opacity: 0 }, { opacity: 1 }],
      { duration, easing: TRANSITION_EASING },
      ['opacity'],
      signal,
    ),
    ...[...visual.controls, ...visual.captions].map((element) =>
      visual.animate(
        element,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration, easing: TRANSITION_EASING },
        ['opacity'],
        signal,
      ),
    ),
  ])
  const media = decodePromise.then((decode) => {
    callbacks.setImageLoadFailed(!decode.ok, decode.ok ? undefined : decode.error)
    return visual.animate(
      current.viewport,
      [{ opacity: 0 }, { opacity: decode.ok ? 1 : 0 }],
      { duration, easing: TRANSITION_EASING },
      ['opacity'],
      signal,
    )
  })
  await Promise.all([shell, media])
}

function resolveOpenRects(
  context: OpenTransitionContext,
  index: number,
  toRect: RectLike | null,
) {
  const { visual } = context
  const captured = context.getCapturedOpen()?.index === index ? context.getCapturedOpen() : null
  const interruptedRect = visible(visual.transitionFrameRef.value)
    ? visual.transitionFrameRef.value!.getBoundingClientRect()
    : null
  const fromRect =
    interruptedRect ??
    captured?.rect ??
    visual.thumbRefs.get(index)?.getBoundingClientRect() ??
    null
  return { captured, interruptedRect, fromRect, toRect }
}

/** Run the open choreography while the coordinator retains cancellation and ownership. */
export async function runOpenTransition(
  context: OpenTransitionContext,
  index: number,
  callbacks: MotionCallbacks,
  signal: AbortSignal,
) {
  const { visual } = context
  callbacks.resetGestureState()
  callbacks.cancelTapTimer()
  context.animating.value = true
  context.activeImagePending.value = true
  context.uiVisible.value = true
  context.activeIndex.value = index
  callbacks.setImageLoadFailed(false)

  await nextTick()
  throwIfAborted(signal)
  callbacks.syncGeometry()

  const photo = context.currentPhoto.value
  if (!photo) {
    context.resetClosedVisualState()
    return false
  }

  const config = toValue(context.transitionConfig)
  const duration =
    config.mode === 'none'
      ? 0
      : toValue(context.reducedMotion)
        ? REDUCED_MOTION_DURATION_MS
        : config.mode === 'fade'
          ? FADE_DURATION_MS
          : OPEN_DURATION_MS
  const rects = resolveOpenRects(context, index, context.getAbsoluteFrameRect(photo))
  const { captured, interruptedRect, fromRect, toRect } = rects
  const useFlip =
    config.mode !== 'none' &&
    fromRect &&
    toRect &&
    (config.mode === 'flip' || (isUsableRect(fromRect) && shouldUseFlip(fromRect, config)))

  try {
    if (!useFlip || !fromRect || !toRect) {
      await runFadeOpen(context, duration, callbacks, signal)
    } else {
      const current = visual.elements()
      const src = captured?.src || callbacks.getThumbSrc(photo)

      if (
        interruptedRect &&
        rectsMatch(interruptedRect, toRect) &&
        opacityOf(current.viewport, 0) > 0.01
      ) {
        context.stageMounted.value = true
        if (current.viewport) current.viewport.style.opacity = '1'
        await visual.animate(
          current.transitionImage,
          [{ opacity: opacityOf(current.transitionImage, 1) }, { opacity: 0 }],
          { duration: INTERRUPTED_HANDOFF_MS, easing: 'linear' },
          ['opacity'],
          signal,
        )
        if (current.transitionFrame) {
          current.transitionFrame.style.display = 'none'
          current.transitionFrame.style.opacity = '0'
        }
        if (current.overlay) current.overlay.style.opacity = '1'
        visual.setChromeOpacity(1)
        context.activeImagePending.value = false
        context.animating.value = false
        context.clearCapturedOpen()
        return true
      }

      visual.normalizeTransitionVisual(toRect, src)
      if (current.transitionFrame) {
        current.transitionFrame.style.transform = flipTransform(fromRect, toRect)
      }
      if (current.overlay) current.overlay.style.opacity = '0'
      if (current.viewport) current.viewport.style.opacity = '0'
      visual.setChromeOpacity(0)

      await nextFrame(signal)
      context.hiddenThumbIndex.value = index

      const flight = Promise.all([
        visual.animate(
          current.transitionFrame,
          [
            { transform: current.transitionFrame?.style.transform || 'none' },
            { transform: 'none' },
          ],
          { duration: OPEN_DURATION_MS, easing: TRANSITION_EASING },
          ['transform'],
          signal,
        ),
        visual.animate(
          current.overlay,
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: OPEN_DURATION_MS * 0.7, easing: TRANSITION_EASING },
          ['opacity'],
          signal,
        ),
        visual.animate(
          current.transitionShadow,
          [{ opacity: 0 }, { opacity: 1 }],
          {
            duration: OPEN_DURATION_MS * 0.5,
            delay: OPEN_DURATION_MS * 0.35,
            easing: TRANSITION_EASING,
          },
          ['opacity'],
          signal,
        ),
        ...[...visual.controls].map((element) =>
          visual.animate(
            element,
            [{ opacity: 0 }, { opacity: 1 }],
            {
              duration: OPEN_DURATION_MS * 0.35,
              delay: OPEN_DURATION_MS * 0.55,
              easing: TRANSITION_EASING,
            },
            ['opacity'],
            signal,
          ),
        ),
        ...[...visual.captions].map((element) =>
          visual.animate(
            element,
            [
              { opacity: 0, transform: 'translateY(8px)' },
              { opacity: 1, transform: 'none' },
            ],
            {
              duration: OPEN_DURATION_MS * 0.33,
              delay: OPEN_DURATION_MS * 0.62,
              easing: TRANSITION_EASING,
            },
            ['opacity', 'transform'],
            signal,
          ),
        ),
      ])
      const handoffWindow =
        typeof current.transitionFrame?.animate === 'function'
          ? wait(OPEN_DURATION_MS - HANDOFF_DURATION_MS, signal).then(
              () => ({ kind: 'window' as const }),
            )
          : null

      await nextFrame(signal)
      context.stageMounted.value = true
      const decode = callbacks
        .prepareActiveSlide(true)
        .then(() => decodeActiveImage(context, index, signal))
        .then((result) => {
          callbacks.setImageLoadFailed(!result.ok, result.ok ? undefined : result.error)
          return { kind: 'decoded' as const, result }
        })
      const handoff = (async () => {
        const first = handoffWindow ? await Promise.race([decode, handoffWindow]) : await decode
        if (first.kind === 'decoded' && first.result.ok) {
          await handoffToMedia(context, signal)
          return
        }

        await flight
        const result = first.kind === 'decoded' ? first.result : (await decode).result
        if (result.ok) await handoffToMedia(context, signal)
        else if (current.transitionFrame) current.transitionFrame.style.display = 'none'
      })()

      await Promise.all([flight, handoff])
    }

    context.activeImagePending.value = false
    context.animating.value = false
    context.clearCapturedOpen()
    return true
  } catch (error) {
    visual.persistRunningAnimations()
    context.animating.value = false
    context.activeImagePending.value = false
    throw error
  }
}
