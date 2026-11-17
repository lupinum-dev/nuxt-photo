import { nextTick } from 'vue'
import { chooseCloseTransition, coverPose, restingClip, type RectLike } from '../../core/index'
import { createStartGate, nextFrame } from './animation'
import {
  FADE_DURATION_MS,
  INTERRUPTED_HANDOFF_MS,
  REDUCED_MOTION_DURATION_MS,
  clamp01,
  flightDistance,
  planFlight,
  posedBox,
  releaseProgressSpeed,
} from './flight'
import { waitForImageReady } from './image-ready'
import type { CloseMotionCallbacks, CloseTransitionContext } from './types'
import {
  chromeOf,
  imageSource,
  isPartlyHidden,
  paint,
  opacityOf,
  falling,
  radiusOf,
  thumbRadius,
  visible,
} from './visual-state'

const TRANSITION_IMAGE_PREPARE_MS = 800

async function prepareTransitionImage(context: CloseTransitionContext, signal: AbortSignal) {
  const image = context.visual.elements().transitionImage
  if (!image) return false
  return (
    await waitForImageReady(image, signal, {
      timeoutMs: TRANSITION_IMAGE_PREPARE_MS,
      waitForLoadWithoutDecode: false,
      decodeLoaded: true,
    })
  ).ok
}

async function normalizeToGhost(context: CloseTransitionContext, signal: AbortSignal) {
  const { visual } = context
  const current = visual.elements()
  if (!current.transitionFrame || !current.transitionImage) return
  const ghostOpacity = Number(getComputedStyle(current.transitionImage).opacity)
  const shadowOpacity = opacityOf(current.transitionShadow, 0)
  if (ghostOpacity >= 0.99 && shadowOpacity >= 0.99) {
    paint(current.viewport, { opacity: '0' })
    return
  }
  await Promise.all([
    visual.fade(current.transitionImage, [ghostOpacity, 1], INTERRUPTED_HANDOFF_MS, signal),
    visual.fade(current.transitionShadow, [shadowOpacity, 1], INTERRUPTED_HANDOFF_MS, signal),
  ])
  paint(current.viewport, { opacity: '0' })
}

/** Let one frame draw the work done so far; resolve in the next one, where a start gate opens. */
async function frameAfterWork(signal: AbortSignal) {
  await nextTick()
  await nextFrame(signal)
  return nextFrame(signal)
}

async function runFadeClose(
  context: CloseTransitionContext,
  duration: number,
  signal: AbortSignal,
) {
  const { visual } = context
  const current = visual.elements()
  // Nothing flies home, so no thumbnail waits for the photo: the page shows complete under the
  // fade.
  context.hiddenThumbnailId.value = null
  const now = duration > 0 ? await frameAfterWork(signal) : 0
  const gate = createStartGate()
  const done = Promise.all(
    [current.overlay, current.viewport, ...chromeOf(current)].map((element) =>
      visual.fade(element, [opacityOf(element, 1), 0], duration, signal, gate),
    ),
  )
  gate.start(now)
  await done
}

/**
 * Put the ghost where the photo is drawn. An interrupted open keeps its layout box, pose and
 * crop, and the close continues from that pose instead of resizing the ghost. Otherwise the
 * ghost shows once its image is decoded: then it is the slide's photo, pixel for pixel, and
 * replaces it in one write. False when it could not decode.
 */
async function placeGhost(
  context: CloseTransitionContext,
  interrupted: boolean,
  fromRect: RectLike,
  src: string,
  signal: AbortSignal,
) {
  const { visual } = context
  if (interrupted) {
    visual.elements().transitionFrame!.style.display = 'block'
    await normalizeToGhost(context, signal)
    return true
  }
  visual.normalizeTransitionVisual(fromRect, src)
  if (!(await prepareTransitionImage(context, signal))) return false
  visual.showGhost()
  visual.hideSlidePhoto(context.activeIndex.value)
  return true
}

/**
 * Fly the ghost from where it is drawn to the thumbnail, cropped like it, with the backdrop,
 * the shadow and the chrome following its progress. The flight starts at `now`.
 */
async function flyHome(
  context: CloseTransitionContext,
  thumb: HTMLElement | null,
  toRect: RectLike,
  now: number,
  signal: AbortSignal,
) {
  const { visual } = context
  const current = visual.elements()
  const from = visual.ghostPlace()
  const { layout } = from
  const start = {
    pose: from.pose,
    clip: from.clip ?? restingClip(radiusOf(current.transitionImage)),
  }
  const end = coverPose(layout, toRect, thumbRadius(thumb))
  const fromBox = posedBox(layout, start.pose)
  const toBox = posedBox(layout, end.pose)
  // A drag down hands its release speed to the flight; a tap, key or button starts from rest.
  const dragged = context.closeDragY.value !== 0
  const speed = dragged ? releaseProgressSpeed(fromBox, toBox, context.closeVelocityY.value) : 0
  const plan = planFlight(flightDistance(fromBox, toBox), speed)
  const overlayFrom = opacityOf(current.overlay, 1)
  const shadowFrom = opacityOf(current.transitionShadow, 1)
  // The controls leave over the first 60% of the flight; the shadow before the crop shows,
  // since it belongs to the uncropped frame. The backdrop follows the whole flight.
  const leaving = (share: number) => 1 - clamp01(share / 0.6)
  const gate = createStartGate()
  const done = visual.fly(
    plan,
    start,
    end,
    [
      falling(current.overlay, overlayFrom, (share) => 1 - share),
      falling(current.transitionShadow, shadowFrom, (share) => 1 - clamp01(share / 0.25)),
      ...chromeOf(current).map((element) => falling(element, opacityOf(element, 1), leaving)),
    ],
    signal,
    gate,
  )
  gate.start(now)
  await done
}

/** Run the close choreography while the coordinator retains cancellation and ownership. */
export async function runCloseTransition(
  context: CloseTransitionContext,
  callbacks: CloseMotionCallbacks,
  signal: AbortSignal,
) {
  const { visual } = context
  if (callbacks.isZoomedIn.value) callbacks.setPanzoomImmediate(1, { x: 0, y: 0 })
  callbacks.syncGeometry()
  const photo = context.currentPhoto.value
  if (!photo) {
    return
  }

  const config = context.getTransitionConfig()
  const thumb = context.thumbnail(photo.id)
  const toRect = thumb?.getBoundingClientRect() ?? null
  const activeFrame = visual.slideFrame(context.activeIndex.value)
  const frame = visual.elements().transitionFrame
  const existingVisual = visible(frame)
  const fromRect = existingVisual
    ? frame!.getBoundingClientRect()
    : (activeFrame?.getBoundingClientRect() ?? context.getAbsoluteFrameRect(photo))
  const plan = chooseCloseTransition({ fromRect, toRect, thumbnailExists: !!thumb, config })
  // A thumbnail the page's chrome covers takes the fade: no ghost flies over that chrome.
  const covered =
    config.mode === 'auto' && !existingVisual && !!thumb && isPartlyHidden(thumb, visual.root())
  const fadeDuration = context.isReducedMotion() ? REDUCED_MOTION_DURATION_MS : FADE_DURATION_MS

  try {
    if (plan.mode !== 'flip' || covered || !fromRect || !toRect) {
      await runFadeClose(context, plan.mode === 'instant' ? 0 : fadeDuration, signal)
      return
    }
    const slideImage = visual.slideImage(context.activeIndex.value)
    const src = imageSource(slideImage, '') || callbacks.getThumbSrc(photo)
    context.hiddenThumbnailId.value = photo.id
    if (!(await placeGhost(context, existingVisual, fromRect, src, signal))) {
      visual.hideGhost()
      await runFadeClose(context, fadeDuration, signal)
      return
    }
    await flyHome(context, thumb, toRect, await frameAfterWork(signal), signal)
  } catch (error) {
    visual.persistRunningAnimations()
    throw error
  }
}
