import { setTransform, toTransformString } from '../utils/dom'
import type {
  Bounds,
  CssAnimationProps,
  LightboxInstance,
} from '../types'

export interface CloseAnimationSnapshot {
  thumbBounds: Bounds
  slideContainer: HTMLDivElement
  currentSlideTransform: string
  targetSlideTransform: string
  outerCropContainer?: HTMLDivElement
  innerCropContainer?: HTMLElement
  currentOuterCropTransform?: string
  currentInnerCropTransform?: string
  targetOuterCropTransform?: string
  targetInnerCropTransform?: string
  croppedZoom: boolean
}

export function getElementTransformValue(element: HTMLElement): string {
  return element.style.transform || getComputedStyle(element).transform || ''
}

export function waitForAnimationFrames(count: number): Promise<void> {
  if (count <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const requestNextFrame = window.requestAnimationFrame?.bind(window)
      ?? ((cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16))

    const tick = (remaining: number) => {
      if (remaining <= 0) {
        resolve()
        return
      }

      requestNextFrame(() => tick(remaining - 1))
    }

    tick(count)
  })
}

export function getSlideTransformForBounds(
  slide: NonNullable<LightboxInstance['currSlide']>,
  nextThumbBounds: Bounds,
): string {
  const targetPoint = nextThumbBounds.innerRect || nextThumbBounds
  const targetZoomLevel = nextThumbBounds.w / slide.width
  const resolution = slide.currentResolution || slide.zoomLevels.initial
  const scale = targetZoomLevel / resolution
  return toTransformString(targetPoint.x, targetPoint.y, scale)
}

export function buildCloseAnimationSnapshot({
  croppedZoom,
  currentThumbBounds,
  lightbox,
  outerCropContainer,
  innerCropContainer,
}: {
  croppedZoom: boolean
  currentThumbBounds?: Bounds
  lightbox: LightboxInstance
  outerCropContainer?: HTMLDivElement
  innerCropContainer?: HTMLElement | null
}): CloseAnimationSnapshot | undefined {
  if (!currentThumbBounds || !lightbox.currSlide) {
    return undefined
  }

  const snapshot: CloseAnimationSnapshot = {
    thumbBounds: currentThumbBounds,
    slideContainer: lightbox.currSlide.container,
    currentSlideTransform: getElementTransformValue(lightbox.currSlide.container),
    targetSlideTransform: getSlideTransformForBounds(lightbox.currSlide, currentThumbBounds),
    croppedZoom,
  }

  if (croppedZoom && currentThumbBounds.innerRect && outerCropContainer && innerCropContainer) {
    const { innerRect } = currentThumbBounds
    const { viewportSize } = lightbox
    const outerPanX = -viewportSize.x + (currentThumbBounds.x - innerRect.x) + innerRect.w
    const outerPanY = -viewportSize.y + (currentThumbBounds.y - innerRect.y) + innerRect.h
    const innerPanX = viewportSize.x - innerRect.w
    const innerPanY = viewportSize.y - innerRect.h

    snapshot.outerCropContainer = outerCropContainer
    snapshot.innerCropContainer = innerCropContainer
    snapshot.currentOuterCropTransform = getElementTransformValue(outerCropContainer)
    snapshot.currentInnerCropTransform = getElementTransformValue(innerCropContainer)
    snapshot.targetOuterCropTransform = toTransformString(outerPanX, outerPanY)
    snapshot.targetInnerCropTransform = toTransformString(innerPanX, innerPanY)
  }

  return snapshot
}

export function animateTo({
  duration,
  easing,
  onAnimationComplete,
  property,
  target,
  value,
  lightbox,
}: {
  duration: number | false | undefined
  easing: string
  onAnimationComplete: () => void
  property: 'transform' | 'opacity'
  target: HTMLElement
  value: string
  lightbox: LightboxInstance
}): void {
  if (!duration) {
    target.style[property] = value
    return
  }

  const animationProps: CssAnimationProps = {
    duration: duration as number,
    easing,
    onComplete: () => {
      if (!lightbox.animations.activeAnimations.length) {
        onAnimationComplete()
      }
    },
    target,
  }
  ;(animationProps as unknown as Record<string, unknown>)[property] = value
  lightbox.animations.startTransition(animationProps)
}

export function setClosedStateZoomPan({
  animate,
  croppedZoom,
  currentThumbBounds,
  lightbox,
  outerCropContainer,
  innerCropContainer,
  animateToTarget,
}: {
  animate?: boolean
  croppedZoom: boolean
  currentThumbBounds?: Bounds
  lightbox: LightboxInstance
  outerCropContainer?: HTMLDivElement
  innerCropContainer?: HTMLElement | null
  animateToTarget: (target: HTMLElement, property: 'transform' | 'opacity', value: string) => void
}): void {
  if (!currentThumbBounds) return

  const { innerRect } = currentThumbBounds
  const { currSlide, viewportSize } = lightbox

  if (croppedZoom && innerRect && outerCropContainer && innerCropContainer) {
    const outerPanX = -viewportSize.x + (currentThumbBounds.x - innerRect.x) + innerRect.w
    const outerPanY = -viewportSize.y + (currentThumbBounds.y - innerRect.y) + innerRect.h
    const innerPanX = viewportSize.x - innerRect.w
    const innerPanY = viewportSize.y - innerRect.h

    if (animate) {
      animateToTarget(outerCropContainer, 'transform', toTransformString(outerPanX, outerPanY))
      animateToTarget(innerCropContainer as HTMLElement, 'transform', toTransformString(innerPanX, innerPanY))
    }
    else {
      setTransform(outerCropContainer, outerPanX, outerPanY)
      setTransform(innerCropContainer as HTMLElement, innerPanX, innerPanY)
    }
  }

  if (currSlide) {
    currSlide.pan.x = (innerRect || currentThumbBounds).x
    currSlide.pan.y = (innerRect || currentThumbBounds).y
    currSlide.currZoomLevel = currentThumbBounds.w / currSlide.width
    if (animate) {
      animateToTarget(currSlide.container, 'transform', currSlide.getCurrentTransform())
    }
    else {
      currSlide.applyCurrentZoomPan()
    }
  }
}

export function getFadeScaleTransform(lightbox: LightboxInstance, gracefulFadeScale: number): string | undefined {
  const slide = lightbox.currSlide
  if (!slide) return

  const currentScale = slide.currZoomLevel / (slide.currentResolution || slide.zoomLevels.initial)
  const scaledDown = currentScale * gracefulFadeScale
  const offsetX = (slide.width * currentScale - slide.width * scaledDown) / 2
  const offsetY = (slide.height * currentScale - slide.height * scaledDown) / 2

  return toTransformString(slide.pan.x + offsetX, slide.pan.y + offsetY, scaledDown)
}
