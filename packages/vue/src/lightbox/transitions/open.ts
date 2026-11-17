import { nextTick } from 'vue'
import {
  coverPose,
  isUsableRect,
  restingClip,
  shouldUseFlip,
  type RectLike,
} from '../../core/index'
import { IMAGE_LOAD_TIMEOUT_MS } from '../../core/image/constants'
import { createStartGate, nextFrame, throwIfAborted, wait, type StartGate } from './animation'
import {
  FADE_DURATION_MS,
  INTERRUPTED_HANDOFF_MS,
  REDUCED_MOTION_DURATION_MS,
  clamp01,
  flightDistance,
  planFlight,
  posedBox,
} from './flight'
import { waitForImageReady } from './image-ready'
import type { OpenMotionCallbacks, OpenTransitionContext } from './types'
import {
  chromeOf,
  isPartlyHidden,
  paint,
  opacityOf,
  radiusOf,
  rising,
  rectsMatch,
  thumbRadius,
  visible,
  type FlightTrack,
  type MotionElements,
} from './visual-state'

const HANDOFF_DURATION_MS = 100
const CAPTION_DURATION_MS = 140
const GHOST_DECODE_TIMEOUT_MS = 800

type DecodeResult = { ok: true } | { ok: false; error: unknown }

async function decodeActiveImage(
  context: OpenTransitionContext,
  index: number,
  signal: AbortSignal,
): Promise<DecodeResult> {
  await nextTick()
  throwIfAborted(signal)
  const element = context.visual.slideImage(index)
  if (!(element instanceof HTMLImageElement)) {
    await nextFrame(signal)
    return { ok: true }
  }

  return waitForImageReady(element, signal, {
    timeoutMs: IMAGE_LOAD_TIMEOUT_MS,
    waitForLoadWithoutDecode: true,
  })
}

/** The captions in the slides, which show only once the stage does. */
const slideCaptions = (current: MotionElements) =>
  current.captions.filter((caption) => current.viewport?.contains(caption))

/**
 * Mount the stage and let one frame draw that work, then hand back that frame's successor: the
 * moment a start gate opens. Mounting builds the slides and hiding a thumbnail re-renders the
 * gallery; done inside the motion, that work would swallow its first frames.
 */
async function mountStage(
  context: OpenTransitionContext,
  index: number,
  callbacks: OpenMotionCallbacks,
  signal: AbortSignal,
) {
  context.stageMounted.value = true
  await callbacks.prepareActiveSlide(true)
  throwIfAborted(signal)
  const state: { result: DecodeResult | null } = { result: null }
  const decode = decodeActiveImage(context, index, signal).then((result) => {
    state.result = result
    callbacks.setImageLoadFailed(!result.ok, result.ok ? undefined : result.error)
    return result
  })
  void decode.catch(() => {})
  await nextTick()
  await nextFrame(signal)
  // The ambient glow belongs to the backdrop and fades in with it: a glow still painting gets
  // one more frame at most.
  await Promise.race([callbacks.glowReady(), nextFrame(signal)])
  const now = await nextFrame(signal)
  return { now, decode, state }
}

async function handoffToMedia(context: OpenTransitionContext, signal: AbortSignal) {
  const { visual } = context
  const current = visual.elements()
  if (!current.transitionFrame) return
  // The slides' captions rise in as the real photo takes over from the ghost, linearly, so no
  // frame shows a large step.
  const captions = slideCaptions(current)
  visual.setChromeOpacity(0, captions)
  paint(current.viewport, { opacity: '1' })
  const gate = createStartGate()
  const done = Promise.all([
    visual.fade(
      current.transitionImage,
      [Number(getComputedStyle(current.transitionImage!).opacity), 0],
      HANDOFF_DURATION_MS,
      signal,
      gate,
    ),
    ...captions.map((caption) =>
      visual.animate(
        caption,
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: CAPTION_DURATION_MS, easing: 'linear' },
        ['opacity', 'transform'],
        signal,
        gate.hold,
      ),
    ),
  ])
  gate.startNextFrame()
  await done
  visual.hideGhost()
}

async function runFadeOpen(
  context: OpenTransitionContext,
  index: number,
  duration: number,
  callbacks: OpenMotionCallbacks,
  signal: AbortSignal,
) {
  const { visual } = context
  const current = visual.elements()
  paint(current.overlay, { opacity: '0' })
  paint(current.viewport, { opacity: '0' })
  visual.setChromeOpacity(0)
  const { now, decode, state } = await mountStage(context, index, callbacks, signal)
  const fade = (gate: StartGate) => (element: HTMLElement | null) =>
    visual.fade(element, [0, 1], duration, signal, gate)
  const gate = createStartGate()
  const shell = Promise.all([current.overlay, ...chromeOf(current)].map(fade(gate)))
  // A photo decoded by now fades in with the room; a slower one when it is ready.
  const media = state.result
    ? state.result.ok
      ? fade(gate)(current.viewport)
      : Promise.resolve()
    : decode.then((result) => {
        if (!result.ok) return
        const late = createStartGate()
        const fading = fade(late)(current.viewport)
        late.startNextFrame()
        return fading
      })
  gate.start(now)
  await Promise.all([shell, media])
}

function resolveOpenRects(context: OpenTransitionContext, id: string, toRect: RectLike | null) {
  const { visual } = context
  const captured = context.getCapturedOpen()?.id === id ? context.getCapturedOpen() : null
  const frame = visual.elements().transitionFrame
  const interruptedRect = visible(frame) ? frame!.getBoundingClientRect() : null
  const thumb = context.thumbnail(id)
  const fromRect = interruptedRect ?? captured?.rect ?? thumb?.getBoundingClientRect() ?? null
  return { captured, interruptedRect, thumb, fromRect, toRect }
}

/**
 * The ghost shows over the thumbnail, posed like it, once its image is decoded: before, it would
 * draw a blank box. False when it could not decode.
 */
async function showGhostOverThumb(
  context: OpenTransitionContext,
  toRect: RectLike,
  fromRect: RectLike,
  thumb: HTMLElement | null,
  src: string,
  signal: AbortSignal,
) {
  const { visual } = context
  const current = visual.elements()
  visual.normalizeTransitionVisual(toRect, src)
  visual.poseGhost(coverPose(toRect, fromRect, thumbRadius(thumb)))
  paint(current.transitionShadow, { opacity: '0' })
  paint(current.overlay, { opacity: '0' })
  paint(current.viewport, { opacity: '0' })
  visual.setChromeOpacity(0)
  const ready = current.transitionImage
    ? await waitForImageReady(current.transitionImage, signal, {
        timeoutMs: GHOST_DECODE_TIMEOUT_MS,
        waitForLoadWithoutDecode: false,
        decodeLoaded: true,
      })
    : { ok: false as const }
  if (!ready.ok) return false
  visual.showGhost()
  // The thumbnail hides only after a frame has drawn the ghost over it.
  await nextFrame(signal)
  await nextFrame(signal)
  return true
}

/** An interrupted close had already brought the ghost back over the slide: hand over. */
async function finishLanded(context: OpenTransitionContext, signal: AbortSignal) {
  const { visual } = context
  const current = visual.elements()
  context.stageMounted.value = true
  paint(current.viewport, { opacity: '1' })
  const image = current.transitionImage
  await visual.fade(image, [opacityOf(image, 1), 0], INTERRUPTED_HANDOFF_MS, signal)
  visual.hideGhost()
  paint(current.overlay, { opacity: '1' })
}

/**
 * Fly the ghost from where it is drawn to the slide's photo, with the backdrop, the shadow and
 * the chrome following its progress, and hand over to the photo once the ghost is in place.
 */
async function flyOpen(
  context: OpenTransitionContext,
  index: number,
  photoId: string,
  toRect: RectLike,
  callbacks: OpenMotionCallbacks,
  signal: AbortSignal,
) {
  const { visual } = context
  const current = visual.elements()
  // The slide's photo shows under the stage only at the handoff; the ghost stands for it.
  paint(current.viewport, { opacity: '0' })
  const imageRadius = radiusOf(current.transitionImage)
  const from = visual.ghostPlace()
  const { layout } = from
  const start = { pose: from.pose, clip: from.clip ?? restingClip(imageRadius) }
  context.hiddenThumbnailId.value = photoId
  const { now, decode, state } = await mountStage(context, index, callbacks, signal)

  // The end: the layout box over the slide's photo, uncropped.
  const scale = toRect.width / (layout.width || 1)
  const end = {
    pose: { x: toRect.left - layout.left, y: toRect.top - layout.top, scale },
    clip: restingClip(imageRadius / (scale || 1)),
  }
  const plan = planFlight(flightDistance(posedBox(layout, start.pose), posedBox(layout, end.pose)))
  const overlayFrom = opacityOf(current.overlay, 0)
  const shadowFrom = opacityOf(current.transitionShadow, 0)
  // The controls arrive over the flight's second half; the shadow once the crop is nearly
  // gone, since it belongs to the uncropped frame.
  const arriving = (share: number) => clamp01((share - 0.4) / 0.6)
  const inSlides = slideCaptions(current)
  const gate = createStartGate()
  const flight = visual.fly(
    plan,
    start,
    end,
    [
      rising(current.overlay, overlayFrom, (share) => share),
      rising(current.transitionShadow, shadowFrom, (share) => clamp01((share - 0.6) / 0.4)),
      ...current.controls.map((element) => rising(element, opacityOf(element, 0), arriving)),
      // Captions outside the slides rise with the controls; the slides' own at the handoff.
      ...current.captions
        .filter((caption) => !inSlides.includes(caption))
        .map((element): FlightTrack => [
          element,
          (share) => ({
            opacity: arriving(share),
            transform: `translateY(${8 * (1 - arriving(share))}px)`,
          }),
          ['opacity', 'transform'],
        ]),
    ],
    signal,
    gate,
  )
  void flight.catch(() => {})
  gate.start(now)

  // The handoff starts when the ghost is within a couple of px of its place.
  if (typeof current.transitionFrame?.animate === 'function')
    await wait(Math.max(0, now + plan.handoffMs - performance.now()), signal)
  else await decode
  const earlyDecode = state.result
  if (earlyDecode?.ok) {
    await Promise.all([flight, handoffToMedia(context, signal)])
    return
  }
  await flight
  const result = earlyDecode ?? (await decode)
  if (result.ok) await handoffToMedia(context, signal)
  else visual.hideGhost()
}

/** Run the open choreography while the coordinator retains cancellation and ownership. */
export async function runOpenTransition(
  context: OpenTransitionContext,
  index: number,
  callbacks: OpenMotionCallbacks,
  signal: AbortSignal,
) {
  const { visual } = context
  // A close interrupted by this open had hidden the photo under its flying ghost.
  visual.showSlidePhotos()
  await nextTick()
  throwIfAborted(signal)
  callbacks.syncGeometry()

  const photo = context.currentPhoto.value
  if (!photo) {
    return false
  }

  const config = context.getTransitionConfig()
  const fadeDuration =
    config.mode === 'none'
      ? 0
      : context.isReducedMotion()
        ? REDUCED_MOTION_DURATION_MS
        : FADE_DURATION_MS
  const rects = resolveOpenRects(context, photo.id, context.getAbsoluteFrameRect(photo))
  const { captured, interruptedRect, thumb, fromRect, toRect } = rects
  const useFlip =
    config.mode !== 'none' &&
    fromRect &&
    toRect &&
    (config.mode === 'flip' ||
      (isUsableRect(fromRect) &&
        shouldUseFlip(fromRect, config) &&
        // A thumbnail the page's chrome covers fades: no ghost flies over that chrome.
        (!!interruptedRect || !thumb || !isPartlyHidden(thumb, visual.root()))))
  const fade = () => runFadeOpen(context, index, fadeDuration, callbacks, signal)

  try {
    if (!useFlip || !fromRect || !toRect) await fade()
    // An interrupted close continues from the ghost's place on screen.
    else if (!interruptedRect) {
      const src = captured?.src || callbacks.getThumbSrc(photo)
      if (await showGhostOverThumb(context, toRect, fromRect, thumb, src, signal))
        await flyOpen(context, index, photo.id, toRect, callbacks, signal)
      else {
        visual.hideGhost()
        await fade()
      }
    } else if (
      rectsMatch(interruptedRect, toRect) &&
      opacityOf(visual.elements().viewport, 0) > 0.01
    )
      await finishLanded(context, signal)
    else await flyOpen(context, index, photo.id, toRect, callbacks, signal)
    visual.setChromeOpacity(1)
    return true
  } catch (error) {
    visual.persistRunningAnimations()
    throw error
  }
}
