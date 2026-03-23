import { debugLog, debugWarn } from '../utils/debug'
import type {
  Bounds,
  LightboxAnimationType,
  LightboxInstance,
  ResolvedLightboxTransition,
  ThumbnailBoundsData,
  TransitionFallbackReason,
  TransitionPhase,
} from '../types'
import { getThumbBoundsData } from './openerThumbBounds'

export interface ResolveTransitionDecisionContext {
  lightbox: LightboxInstance
  duration: number | false | undefined
  initialThumbBounds?: Bounds
  initialThumbData?: ThumbnailBoundsData
}

function getRequestedMode(lightbox: LightboxInstance, phase: TransitionPhase): LightboxAnimationType {
  return phase === 'open'
    ? lightbox.options.openAnimationType
    : lightbox.options.closeAnimationType
}

export function resolveTransitionDecision(
  phase: TransitionPhase,
  context: ResolveTransitionDecisionContext,
): ResolvedLightboxTransition {
  const { duration, initialThumbBounds, initialThumbData, lightbox } = context
  const slide = lightbox.currSlide
  const requestedMode = getRequestedMode(lightbox, phase)
  const placeholderElement = slide?.getPlaceholderElement()
  const preflight = lightbox.initialTransitionPreflight
  const thumbData = requestedMode === 'zoom'
    ? ((phase === 'open' && preflight)
        ? preflight.thumbData
        : ((phase === 'open' && initialThumbBounds)
            ? (initialThumbData ?? { bounds: initialThumbBounds })
            : getThumbBoundsData(
                lightbox.currIndex,
                slide?.data ?? { type: 'custom' },
                lightbox,
              )))
    : undefined
  const nextThumbBounds = thumbData?.bounds
  const thumbVisibleAreaRatio = thumbData?.visibleAreaRatio
  const hasThumbBounds = Boolean(nextThumbBounds)
  const hasThumbnail = Boolean(thumbData?.thumbnail)
  const hasPlaceholder = Boolean(placeholderElement)
  const hasHolder = Boolean(slide?.holderElement)
  const mainScrollShifted = lightbox.mainScroll.isShifted()
  const croppedZoomRequested = Boolean(nextThumbBounds?.innerRect)

  let resolvedMode = requestedMode
  let fallbackReason: TransitionFallbackReason | undefined

  if (!duration || duration <= 50) {
    resolvedMode = 'none'
    if (requestedMode !== 'none') {
      fallbackReason = 'duration-disabled'
    }
  }
  else if (requestedMode === 'zoom') {
    if (phase === 'close' && lightbox.resolvedOpenTransition?.gracefulFallback) {
      resolvedMode = 'fade'
      fallbackReason = 'open-fallback-sync'
    }
    else if (phase === 'open' && preflight && !preflight.geometryReliable) {
      resolvedMode = 'fade'
      fallbackReason = preflight.fallbackReason
    }
    else if (!slide) {
      resolvedMode = 'fade'
      fallbackReason = 'missing-current-slide'
    }
    else if (!hasThumbBounds) {
      resolvedMode = 'fade'
      fallbackReason = 'missing-thumb-bounds'
    }
    else if (phase === 'open' && !hasPlaceholder) {
      resolvedMode = 'fade'
      fallbackReason = 'missing-placeholder'
    }
    else if (
      hasThumbnail
      && thumbVisibleAreaRatio !== undefined
      && thumbVisibleAreaRatio < 0.5
    ) {
      resolvedMode = 'fade'
      fallbackReason = 'insufficient-thumb-visibility'
    }
    else if (croppedZoomRequested && (!lightbox.container || !hasHolder)) {
      resolvedMode = 'fade'
      fallbackReason = !lightbox.container
        ? 'missing-crop-container'
        : 'missing-holder-element'
    }
  }

  const decision: ResolvedLightboxTransition = {
    phase,
    requestedMode,
    resolvedMode,
    gracefulFallback: requestedMode === 'zoom' && resolvedMode === 'fade',
    fallbackReason,
    thumbBounds: nextThumbBounds,
    thumbVisibleAreaRatio,
    hasHolder,
    hasThumbBounds,
    hasThumbnail,
    hasPlaceholder,
    croppedZoomRequested,
    mainScrollShifted,
  }

  debugLog(lightbox.options, 'opener.transitionDecision', {
    phase: decision.phase,
    requestedMode: decision.requestedMode,
    resolvedMode: decision.resolvedMode,
    fallbackReason: decision.fallbackReason,
    hasThumbBounds: decision.hasThumbBounds,
    hasThumbnail: decision.hasThumbnail,
    thumbVisibleAreaRatio: decision.thumbVisibleAreaRatio,
    hasPlaceholder: decision.hasPlaceholder,
    hasHolder: decision.hasHolder,
    croppedZoomRequested: decision.croppedZoomRequested,
    mainScrollShifted: decision.mainScrollShifted,
    duration,
  })

  if (
    phase === 'close'
    && requestedMode === 'zoom'
    && resolvedMode === 'fade'
    && fallbackReason
    && fallbackReason !== 'insufficient-thumb-visibility'
  ) {
    debugWarn(lightbox.options, 'opener.close-transition-downgraded', {
      phase,
      requestedMode,
      resolvedMode,
      fallbackReason,
    })
  }

  return decision
}
