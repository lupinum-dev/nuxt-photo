import { chooseCloseTransition } from '../../core/index'
import { waitForImageReady } from './image-ready'
import type { CloseMotionCallbacks, CloseTransitionContext } from './types'
import { imageSource, opacityOf, rectStyle, visible } from './visual-state'

const CLOSE_DURATION_MS = 360
const FADE_DURATION_MS = 220
const REDUCED_MOTION_DURATION_MS = 160
const INTERRUPTED_HANDOFF_MS = 80
const TRANSITION_IMAGE_PREPARE_MS = 800
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

async function prepareTransitionImage(context: CloseTransitionContext, signal: AbortSignal) {
  const image = context.visual.elements().transitionImage
  if (!image) return false
  return (
    await waitForImageReady(image, signal, {
      timeoutMs: TRANSITION_IMAGE_PREPARE_MS,
      waitForLoadWithoutDecode: false,
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
    if (current.viewport) current.viewport.style.opacity = '0'
    return
  }
  await Promise.all([
    visual.animate(
      current.transitionImage,
      [{ opacity: ghostOpacity }, { opacity: 1 }],
      { duration: INTERRUPTED_HANDOFF_MS, easing: 'linear' },
      ['opacity'],
      signal,
    ),
    visual.animate(
      current.transitionShadow,
      [{ opacity: shadowOpacity }, { opacity: 1 }],
      { duration: INTERRUPTED_HANDOFF_MS, easing: 'linear' },
      ['opacity'],
      signal,
    ),
  ])
  if (current.viewport) current.viewport.style.opacity = '0'
}

async function runFadeClose(
  context: CloseTransitionContext,
  duration: number,
  signal: AbortSignal,
) {
  const { visual } = context
  const current = visual.elements()
  await Promise.all([
    visual.animate(
      current.overlay,
      [{ opacity: opacityOf(current.overlay, 1) }, { opacity: 0 }],
      { duration, easing: EASING },
      ['opacity'],
      signal,
    ),
    visual.animate(
      current.viewport,
      [{ opacity: opacityOf(current.viewport, 1) }, { opacity: 0 }],
      { duration, easing: EASING },
      ['opacity'],
      signal,
    ),
    ...[...visual.controls, ...visual.captions].map((element) =>
      visual.animate(
        element,
        [{ opacity: Number(getComputedStyle(element).opacity) }, { opacity: 0 }],
        { duration, easing: EASING },
        ['opacity'],
        signal,
      ),
    ),
  ])
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
  const thumb = visual.thumbRefs.get(context.activeIndex.value) ?? null
  const toRect = thumb?.getBoundingClientRect() ?? null
  const activeFrame = visual.slideFrameRefs.get(context.activeIndex.value)
  const existingVisual = visible(visual.transitionFrameRef.value)
  const fromRect = existingVisual
    ? visual.transitionFrameRef.value!.getBoundingClientRect()
    : (activeFrame?.getBoundingClientRect() ?? context.getAbsoluteFrameRect(photo))
  const plan = chooseCloseTransition({ fromRect, toRect, thumbRefExists: !!thumb, config })
  const dragProgress = Math.min(
    1,
    Math.abs(context.closeDragY.value) / (context.areaMetrics.value?.height || 1),
  )
  const closeDuration = Math.max(180, CLOSE_DURATION_MS * (1 - dragProgress))

  try {
    if (plan.mode !== 'flip' || !fromRect || !toRect) {
      const duration =
        plan.mode === 'instant'
          ? 0
          : context.isReducedMotion()
            ? REDUCED_MOTION_DURATION_MS
            : FADE_DURATION_MS
      await runFadeClose(context, duration, signal)
    } else {
      const current = visual.elements()
      const slideImage = visual.slideImageRefs.get(context.activeIndex.value) ?? null
      const src = imageSource(slideImage, '') || callbacks.getThumbSrc(photo)
      if (!existingVisual) {
        visual.normalizeTransitionVisual(fromRect, src)
        if (current.transitionImage) current.transitionImage.style.opacity = '0'
        if (current.transitionShadow) current.transitionShadow.style.opacity = '0'
      } else {
        rectStyle(current.transitionFrame!, fromRect)
        current.transitionFrame!.style.transform = 'none'
        current.transitionFrame!.style.display = 'block'
      }
      if (!(await prepareTransitionImage(context, signal))) {
        if (current.transitionFrame) current.transitionFrame.style.display = 'none'
        await runFadeClose(
          context,
          context.isReducedMotion() ? REDUCED_MOTION_DURATION_MS : FADE_DURATION_MS,
          signal,
        )
        return
      }
      context.hiddenThumbIndex.value = context.activeIndex.value
      await normalizeToGhost(context, signal)

      const targetTransform = `translate3d(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px, 0) scale(${toRect.width / fromRect.width}, ${toRect.height / fromRect.height})`
      await Promise.all([
        visual.animate(
          current.transitionFrame,
          [{ transform: 'none' }, { transform: targetTransform }],
          { duration: closeDuration, easing: EASING },
          ['transform'],
          signal,
        ),
        visual.animate(
          current.overlay,
          [{ opacity: opacityOf(current.overlay, 1) }, { opacity: 0 }],
          { duration: closeDuration * 0.9, delay: closeDuration * 0.1, easing: EASING },
          ['opacity'],
          signal,
        ),
        visual.animate(
          current.transitionShadow,
          [{ opacity: 1 }, { opacity: 0 }],
          {
            duration: closeDuration * 0.55,
            delay: closeDuration * 0.45,
            easing: EASING,
          },
          ['opacity'],
          signal,
        ),
        ...[...visual.controls, ...visual.captions].map((element) =>
          visual.animate(
            element,
            [{ opacity: Number(getComputedStyle(element).opacity) }, { opacity: 0 }],
            { duration: closeDuration * 0.35, easing: EASING },
            ['opacity'],
            signal,
          ),
        ),
      ])
    }
  } catch (error) {
    visual.persistRunningAnimations()
    throw error
  }
}
