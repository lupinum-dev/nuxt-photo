import { nextTick } from 'vue'
import { isUsableRect, shouldUseFlip, type RectLike } from '../../core/index'
import { flipTransform } from '../../core/geometry/rect'
import { IMAGE_LOAD_TIMEOUT_MS } from '../../core/image/constants'
import { nextFrame, throwIfAborted, wait } from './animation'
import { waitForImageReady } from './image-ready'
import type { OpenMotionCallbacks, OpenTransitionContext } from './types'
import { opacityOf, rectsMatch, visible } from './visual-state'

const OPEN_DURATION_MS = 420
const FADE_DURATION_MS = 220
const REDUCED_MOTION_DURATION_MS = 160
const HANDOFF_DURATION_MS = 100
const INTERRUPTED_HANDOFF_MS = 80
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

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

  return waitForImageReady(element, signal, {
    timeoutMs: IMAGE_LOAD_TIMEOUT_MS,
    waitForLoadWithoutDecode: true,
  })
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
  callbacks: OpenMotionCallbacks,
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
      { duration, easing: EASING },
      ['opacity'],
      signal,
    ),
    ...[...visual.controls, ...visual.captions].map((element) =>
      visual.animate(
        element,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration, easing: EASING },
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
      { duration, easing: EASING },
      ['opacity'],
      signal,
    )
  })
  await Promise.all([shell, media])
}

function resolveOpenRects(context: OpenTransitionContext, index: number, toRect: RectLike | null) {
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
  callbacks: OpenMotionCallbacks,
  signal: AbortSignal,
) {
  const { visual } = context
  await nextTick()
  throwIfAborted(signal)
  callbacks.syncGeometry()

  const photo = context.currentPhoto.value
  if (!photo) {
    return false
  }

  const config = context.getTransitionConfig()
  const duration =
    config.mode === 'none'
      ? 0
      : context.isReducedMotion()
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
          { duration: OPEN_DURATION_MS, easing: EASING },
          ['transform'],
          signal,
        ),
        visual.animate(
          current.overlay,
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: OPEN_DURATION_MS * 0.7, easing: EASING },
          ['opacity'],
          signal,
        ),
        visual.animate(
          current.transitionShadow,
          [{ opacity: 0 }, { opacity: 1 }],
          {
            duration: OPEN_DURATION_MS * 0.5,
            delay: OPEN_DURATION_MS * 0.35,
            easing: EASING,
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
              easing: EASING,
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
              easing: EASING,
            },
            ['opacity', 'transform'],
            signal,
          ),
        ),
      ])
      void flight.catch(() => {})

      const handoffWindow =
        typeof current.transitionFrame?.animate === 'function'
          ? wait(OPEN_DURATION_MS - HANDOFF_DURATION_MS, signal)
          : null
      void handoffWindow?.catch(() => {})

      await nextFrame(signal)
      context.stageMounted.value = true
      const decodeState: {
        result: { ok: true } | { ok: false; error: unknown } | null
      } = { result: null }
      const decode = callbacks
        .prepareActiveSlide(true)
        .then(() => decodeActiveImage(context, index, signal))
        .then((result) => {
          decodeState.result = result
          callbacks.setImageLoadFailed(!result.ok, result.ok ? undefined : result.error)
          return result
        })
      void decode.catch(() => {})

      if (handoffWindow) await handoffWindow
      else await decode
      const earlyDecode = decodeState.result

      if (earlyDecode?.ok) {
        await Promise.all([flight, handoffToMedia(context, signal)])
      } else {
        await flight
        const result = earlyDecode ?? (await decode)
        if (result.ok) await handoffToMedia(context, signal)
        else if (current.transitionFrame) current.transitionFrame.style.display = 'none'
      }
    }

    visual.setChromeOpacity(1)
    return true
  } catch (error) {
    visual.persistRunningAnimations()
    throw error
  }
}
