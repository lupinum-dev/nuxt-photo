import { decodeImage } from '../utils/decode'
import { debugLog, getDebugSnapshot, shouldTraceCategory, summarizeForDebug } from '../utils/debug'
import type {
  Bounds,
  OpenerInstance,
  LightboxInstance,
  ThumbnailBoundsData,
  TransitionPhase,
} from '../types'
import {
  animateTo,
  buildCloseAnimationSnapshot,
  getFadeScaleTransform,
  getSlideTransformForBounds,
  setClosedStateZoomPan,
  waitForAnimationFrames,
} from './openerAnimationHelpers'
import type { CloseAnimationSnapshot } from './openerAnimationHelpers'
import { resolveTransitionDecision } from './openerTransitionDecision'

const MIN_OPACITY = 0.003
const GRACEFUL_FADE_SCALE = 0.96

export { getThumbBoundsData, getThumbBounds } from './openerThumbBounds'

export function useOpener(lightbox: LightboxInstance): OpenerInstance {
  let isClosed = true
  let isOpen = false
  let isClosing = false
  let isOpening = false

  let duration: number | false | undefined
  let useAnimation = false
  let animateZoom = false
  let animateFadeScale = false
  let croppedZoom = false
  let animateRootOpacity = false
  let animateBgOpacity = false

  let placeholderElement: HTMLImageElement | HTMLDivElement | null | undefined
  let outerCropContainer: HTMLDivElement | undefined
  let innerCropContainer: HTMLElement | null | undefined
  let thumbBounds: Bounds | undefined
  let initialThumbBounds: Bounds | undefined
  let initialThumbData: ThumbnailBoundsData | undefined
  let closeSnapshot: CloseAnimationSnapshot | undefined

  function prepareOpen(): void {
    lightbox.off('firstZoomPan', prepareOpen)
    if (!isOpening) {
      const slide = lightbox.currSlide
      isOpening = true
      isClosing = false
      duration = lightbox.options.showAnimationDuration
      if (slide && slide.zoomLevels.initial * slide.width >= lightbox.options.maxWidthToAnimate) {
        duration = 0
      }
      if (shouldTraceCategory(lightbox.options, 'traceState')) {
        debugLog(lightbox.options, 'opener.prepareOpen', getDebugSnapshot(lightbox, {
          duration,
          requestedMode: lightbox.options.openAnimationType,
          slide: summarizeForDebug(slide
            ? {
                index: slide.index,
                width: slide.width,
                height: slide.height,
                initialZoom: slide.zoomLevels.initial,
                currZoomLevel: slide.currZoomLevel,
              }
            : null),
        }))
      }
      applyStartProps('open')
    }
  }

  // Decide once per transition whether zoom is trustworthy or whether the opener should degrade to fade.
  function applyStartProps(phase: TransitionPhase): void {
    const slide = lightbox.currSlide
    croppedZoom = false
    outerCropContainer = undefined
    innerCropContainer = undefined
    closeSnapshot = undefined

    const transitionDecision = resolveTransitionDecision(phase, {
      lightbox,
      duration,
      initialThumbBounds,
      initialThumbData,
    })

    if (phase === 'open') {
      lightbox.resolvedOpenTransition = transitionDecision
    }

    thumbBounds = transitionDecision.resolvedMode === 'zoom' ? transitionDecision.thumbBounds : undefined
    placeholderElement = slide?.getPlaceholderElement()

    debugLog(lightbox.options, 'opener.applyStartProps', {
      phase,
      requestedMode: transitionDecision.requestedMode,
      resolvedMode: transitionDecision.resolvedMode,
      fallbackReason: transitionDecision.fallbackReason,
      thumbBounds: transitionDecision.hasThumbBounds,
      thumbVisibleAreaRatio: transitionDecision.thumbVisibleAreaRatio,
      placeholder: transitionDecision.hasPlaceholder,
      isOpening,
      isClosing,
      initialThumbBounds: !!initialThumbBounds,
      snapshot: shouldTraceCategory(lightbox.options, 'traceState') ? getDebugSnapshot(lightbox) : undefined,
    })

    lightbox.animations.stopAll()

    useAnimation = transitionDecision.resolvedMode !== 'none' && Boolean(duration && duration > 50)
    animateZoom = transitionDecision.resolvedMode === 'zoom'
    animateFadeScale = transitionDecision.gracefulFallback
    animateRootOpacity = transitionDecision.resolvedMode !== 'zoom'
    animateBgOpacity = transitionDecision.resolvedMode === 'zoom' && lightbox.options.bgOpacity > MIN_OPACITY
    if (!animateZoom && isOpening && slide) {
      slide.zoomAndPanToInitial()
      slide.applyCurrentZoomPan()
    }

    if (!useAnimation) {
      duration = 0
      animateZoom = false
      animateFadeScale = false
      animateBgOpacity = false
      animateRootOpacity = true
      if (isOpening) {
        if (lightbox.element) {
          lightbox.element.style.opacity = String(MIN_OPACITY)
        }
        lightbox.applyBgOpacity(1)
      }
      return
    }

    if (animateZoom && thumbBounds?.innerRect) {
      croppedZoom = true
      outerCropContainer = lightbox.container
      innerCropContainer = slide?.holderElement

      if (lightbox.container && innerCropContainer) {
        lightbox.container.style.overflow = 'hidden'
        lightbox.container.style.width = `${lightbox.viewportSize.x}px`
      }
      else {
        croppedZoom = false
        animateZoom = false
      }
    }
    else {
      croppedZoom = false
    }

    if (!animateZoom) {
      animateRootOpacity = true
      animateBgOpacity = false
      if (isOpening && slide) {
        slide.zoomAndPanToInitial()
        slide.applyCurrentZoomPan()
        if (animateFadeScale) {
          setClosedStateFadeScale()
        }
      }
    }

    if (isOpening) {
      if (animateRootOpacity) {
        if (lightbox.element) {
          lightbox.element.style.opacity = String(MIN_OPACITY)
        }
        lightbox.applyBgOpacity(1)
      }
      else {
        if (animateBgOpacity && lightbox.bg) {
          lightbox.bg.style.opacity = String(MIN_OPACITY)
        }
        if (lightbox.element) {
          lightbox.element.style.opacity = '1'
        }
      }

      if (animateZoom) {
        setClosedStateZoomPan({
          croppedZoom,
          currentThumbBounds: thumbBounds,
          lightbox,
          outerCropContainer,
          innerCropContainer,
          animateToTarget,
        })
        if (placeholderElement) {
          placeholderElement.style.willChange = 'transform'
          placeholderElement.style.opacity = String(MIN_OPACITY)
        }
      }
    }
    else if (isClosing) {
      if (lightbox.mainScroll.itemHolders[0]) {
        lightbox.mainScroll.itemHolders[0].el.style.display = 'none'
      }
      if (lightbox.mainScroll.itemHolders[2]) {
        lightbox.mainScroll.itemHolders[2].el.style.display = 'none'
      }
    }
  }

  async function prepareCloseAnimation(): Promise<void> {
    if (!isClosing || !useAnimation || !animateZoom) {
      return
    }

    if (lightbox.mainScroll.x !== 0) {
      lightbox.mainScroll.resetPosition()
      lightbox.mainScroll.resize()
    }

    lightbox.currSlide?.applyCurrentZoomPan()
    await waitForAnimationFrames(croppedZoom ? 2 : 1)
    closeSnapshot = buildCloseAnimationSnapshot({
      croppedZoom,
      currentThumbBounds: thumbBounds,
      lightbox,
      outerCropContainer,
      innerCropContainer,
    })

    debugLog(lightbox.options, 'opener.closeSnapshot', {
      croppedZoom: closeSnapshot?.croppedZoom,
      thumbBounds: summarizeForDebug(closeSnapshot?.thumbBounds),
      currentSlideTransform: closeSnapshot?.currentSlideTransform,
      targetSlideTransform: closeSnapshot?.targetSlideTransform,
      outerCropTransform: closeSnapshot?.targetOuterCropTransform,
      innerCropTransform: closeSnapshot?.targetInnerCropTransform,
    })
  }

  function start(): void {
    debugLog(lightbox.options, 'opener.start', {
      isOpening,
      isClosing,
      useAnimation,
      animateZoom,
      duration,
      placeholder: summarizeForDebug(placeholderElement),
    })

    if (isOpening && useAnimation && placeholderElement && placeholderElement.tagName === 'IMG') {
      new Promise<void>((resolve) => {
        let decoded = false
        let isDelaying = true
        decodeImage(placeholderElement as HTMLImageElement).finally(() => {
          decoded = true
          if (!isDelaying) resolve()
        })
        setTimeout(() => {
          isDelaying = false
          if (decoded) resolve()
        }, 50)
        setTimeout(resolve, 250)
      }).finally(() => initiate())
    }
    else if (isClosing && useAnimation && animateZoom) {
      void prepareCloseAnimation().finally(() => initiate())
    }
    else {
      initiate()
    }
  }

  function initiate(): void {
    lightbox.element?.style.setProperty('--photo-lightbox-transition-duration', `${duration}ms`)

    debugLog(lightbox.options, 'opener.initiate', {
      isOpening,
      isClosing,
      useAnimation,
      animateZoom,
      animateFadeScale,
      animateBgOpacity,
      animateRootOpacity,
      duration,
      croppedZoom,
      snapshot: shouldTraceCategory(lightbox.options, 'traceState') ? getDebugSnapshot(lightbox) : undefined,
    })

    lightbox.dispatch(isOpening ? 'openingAnimationStart' : 'closingAnimationStart')
    lightbox.dispatch(('initialZoom' + (isOpening ? 'In' : 'Out')) as 'initialZoomIn' | 'initialZoomOut')

    lightbox.setUIVisible(isOpening)

    if (isOpening) {
      if (placeholderElement) {
        placeholderElement.style.opacity = '1'
      }
      animateToOpenState()
    }
    else if (isClosing) {
      animateToClosedState()
    }

    if (!useAnimation) {
      onAnimationComplete()
    }
  }

  function onAnimationComplete(): void {
    isOpen = isOpening
    isClosed = isClosing
    isOpening = false
    isClosing = false

    debugLog(lightbox.options, isOpen ? 'openingAnimationEnd' : 'closingAnimationEnd', {
      snapshot: shouldTraceCategory(lightbox.options, 'traceState') ? getDebugSnapshot(lightbox) : undefined,
    })
    lightbox.dispatch(isOpen ? 'openingAnimationEnd' : 'closingAnimationEnd')
    lightbox.dispatch(('initialZoom' + (isOpen ? 'InEnd' : 'OutEnd')) as 'initialZoomInEnd' | 'initialZoomOutEnd')

    if (isClosed) {
      lightbox.destroy()
    }
    else if (isOpen) {
      if (animateZoom && lightbox.container) {
        lightbox.container.style.overflow = 'visible'
        lightbox.container.style.width = '100%'
      }
      lightbox.currSlide?.applyCurrentZoomPan()
    }
  }

  function animateToTarget(target: HTMLElement, property: 'transform' | 'opacity', value: string): void {
    animateTo({
      duration,
      easing: lightbox.options.easing,
      onAnimationComplete,
      property,
      target,
      value,
      lightbox,
    })
  }

  function animateToOpenState(): void {
    if (animateZoom) {
      if (croppedZoom && outerCropContainer && innerCropContainer) {
        animateToTarget(outerCropContainer, 'transform', 'translate3d(0,0,0)')
        animateToTarget(innerCropContainer as HTMLElement, 'transform', 'none')
      }

      if (lightbox.currSlide) {
        lightbox.currSlide.zoomAndPanToInitial()
        animateToTarget(
          lightbox.currSlide.container,
          'transform',
          lightbox.currSlide.getCurrentTransform(),
        )
      }
    }
    else if (animateFadeScale && lightbox.currSlide) {
      animateToTarget(
        lightbox.currSlide.container,
        'transform',
        lightbox.currSlide.getCurrentTransform(),
      )
    }

    if (animateBgOpacity && lightbox.bg) {
      animateToTarget(lightbox.bg, 'opacity', String(lightbox.options.bgOpacity))
    }

    if (animateRootOpacity && lightbox.element) {
      animateToTarget(lightbox.element, 'opacity', '1')
    }
  }

  function animateToClosedState(): void {
    if (animateZoom) {
      animateToClosedStateZoomPan()
    }
    else if (animateFadeScale) {
      animateToClosedStateFadeScale()
    }

    if (animateBgOpacity && lightbox.bgOpacity > 0.01 && lightbox.bg) {
      animateToTarget(lightbox.bg, 'opacity', '0')
    }

    if (animateRootOpacity && lightbox.element) {
      animateToTarget(lightbox.element, 'opacity', '0')
    }
  }

  function animateToClosedStateZoomPan(): void {
    if (!closeSnapshot) {
      if (thumbBounds && lightbox.currSlide) {
        animateToTarget(lightbox.currSlide.container, 'transform', getSlideTransformForBounds(lightbox.currSlide, thumbBounds))
      }
      return
    }

    if (
      closeSnapshot.croppedZoom
      && closeSnapshot.outerCropContainer
      && closeSnapshot.innerCropContainer
      && closeSnapshot.targetOuterCropTransform
      && closeSnapshot.targetInnerCropTransform
    ) {
      animateToTarget(closeSnapshot.outerCropContainer, 'transform', closeSnapshot.targetOuterCropTransform)
      animateToTarget(closeSnapshot.innerCropContainer, 'transform', closeSnapshot.targetInnerCropTransform)
    }

    animateToTarget(closeSnapshot.slideContainer, 'transform', closeSnapshot.targetSlideTransform)
  }

  function setClosedStateFadeScale(): void {
    const transform = getFadeScaleTransform(lightbox, GRACEFUL_FADE_SCALE)
    if (transform && lightbox.currSlide) {
      lightbox.currSlide.container.style.transform = transform
    }
  }

  function animateToClosedStateFadeScale(): void {
    const transform = getFadeScaleTransform(lightbox, GRACEFUL_FADE_SCALE)
    if (transform && lightbox.currSlide) {
      animateToTarget(lightbox.currSlide.container, 'transform', transform)
    }
  }

  lightbox.on('firstZoomPan', prepareOpen)

  const opener: OpenerInstance = {
    get isClosed() { return isClosed },
    get isOpen() { return isOpen },
    get isClosing() { return isClosing },
    get isOpening() { return isOpening },

    open() {
      debugLog(lightbox.options, 'opener.open', {
        duration: lightbox.options.showAnimationDuration,
        thumbBounds: !!initialThumbBounds,
        requestedMode: lightbox.options.openAnimationType,
        preflight: summarizeForDebug(lightbox.initialTransitionPreflight),
        snapshot: shouldTraceCategory(lightbox.options, 'traceState') ? getDebugSnapshot(lightbox) : undefined,
      })
      prepareOpen()
      start()
    },

    close() {
      if (isClosed || isClosing || isOpening) return
      debugLog(lightbox.options, 'opener.close', {
        requestedMode: lightbox.options.closeAnimationType,
        snapshot: shouldTraceCategory(lightbox.options, 'traceState') ? getDebugSnapshot(lightbox) : undefined,
      })

      const slide = lightbox.currSlide
      isOpen = false
      isOpening = false
      isClosing = true
      duration = lightbox.options.hideAnimationDuration

      if (slide && slide.currZoomLevel * slide.width >= lightbox.options.maxWidthToAnimate) {
        duration = 0
      }

      applyStartProps('close')
      start()
    },

    reset() {
      isClosed = true
      isOpen = false
      isClosing = false
      isOpening = false
      initialThumbBounds = undefined
      initialThumbData = undefined
      thumbBounds = undefined
      placeholderElement = undefined
      outerCropContainer = undefined
      innerCropContainer = undefined
      closeSnapshot = undefined
      animateFadeScale = false
      lightbox.resolvedOpenTransition = undefined
      lightbox.on('firstZoomPan', prepareOpen)
      debugLog(lightbox.options, 'opener.reset', {
        snapshot: shouldTraceCategory(lightbox.options, 'traceState') ? getDebugSnapshot(lightbox) : undefined,
      })
    },

    setInitialThumbBounds(bounds: Bounds | undefined) {
      initialThumbBounds = bounds
      initialThumbData = (lightbox as LightboxInstance & {
        __initialThumbBoundsData?: ThumbnailBoundsData
      }).__initialThumbBoundsData
      if (lightbox.initialTransitionPreflight && bounds) {
        lightbox.initialTransitionPreflight.thumbData.bounds = bounds
      }
      debugLog(lightbox.options, 'opener.setInitialThumbBounds', {
        bounds: summarizeForDebug(bounds),
        thumbVisibleAreaRatio: initialThumbData?.visibleAreaRatio,
        hasThumbnail: Boolean(initialThumbData?.thumbnail),
      })
    },
  }

  return opener
}
