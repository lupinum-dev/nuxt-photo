import type { TransitionMode, CloseTransitionPlan, RectLike } from '../types'
import type { DebugLogger } from '../debug/logger'
import { isUsableRect } from '../geometry/rect'
import { getWindowDimensions } from '../utils/dom'

export type TransitionModeConfig = {
  mode: TransitionMode
  autoThreshold: number
}

const MIN_VISIBLE_DIMENSION = 80

export function createTransitionMode(): TransitionModeConfig {
  return {
    mode: 'auto',
    autoThreshold: 0.55,
  }
}

type ViewportRect = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

function getVisibleDimensions(
  rect: ViewportRect,
  vw: number,
  vh: number,
): { width: number; height: number } {
  return {
    width: Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0)),
    height: Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0)),
  }
}

export function getVisibilityRatio(rect: ViewportRect | null): number {
  if (!rect || rect.width <= 0 || rect.height <= 0) return 0

  const { width: vw, height: vh } = getWindowDimensions()
  const { width: visibleWidth, height: visibleHeight } = getVisibleDimensions(
    rect,
    vw,
    vh,
  )
  const visibleArea = visibleWidth * visibleHeight
  const totalArea = rect.width * rect.height

  return totalArea > 0 ? visibleArea / totalArea : 0
}

export function shouldUseFlip(
  rect: ViewportRect | null,
  config: TransitionModeConfig,
  debug?: DebugLogger,
): boolean {
  if (config.mode === 'none') {
    debug?.log('transitions', 'mode=none → skip FLIP (instant)')
    return false
  }

  if (config.mode === 'fade') {
    debug?.log('transitions', 'mode=fade → skip FLIP')
    return false
  }

  if (config.mode === 'flip') {
    debug?.log('transitions', 'mode=flip → force FLIP')
    return true
  }

  // auto mode — check visibility ratio AND minimum visible dimensions
  if (!rect) {
    debug?.log('transitions', 'mode=auto → no rect → FADE')
    return false
  }

  const { width: vw, height: vh } = getWindowDimensions()
  const { width: visibleWidth, height: visibleHeight } = getVisibleDimensions(
    rect,
    vw,
    vh,
  )

  if (
    visibleWidth < MIN_VISIBLE_DIMENSION ||
    visibleHeight < MIN_VISIBLE_DIMENSION
  ) {
    debug?.log(
      'transitions',
      `mode=auto → visible size ${visibleWidth.toFixed(0)}x${visibleHeight.toFixed(0)}px < ${MIN_VISIBLE_DIMENSION}px min → FADE`,
    )
    return false
  }

  const ratio = getVisibilityRatio(rect)
  const useFlip = ratio >= config.autoThreshold

  debug?.log(
    'transitions',
    `mode=auto → visibility=${(ratio * 100).toFixed(1)}% (${visibleWidth.toFixed(0)}x${visibleHeight.toFixed(0)}px) threshold=${(config.autoThreshold * 100).toFixed(0)}% → ${useFlip ? 'FLIP' : 'FADE'}`,
  )

  return useFlip
}

const CLOSE_FLIP_DURATION_MS = 380
const CLOSE_FADE_DURATION_MS = 200

export function planCloseTransition(opts: {
  fromRect: RectLike | null
  toRect: DOMRect | null
  thumbRefExists: boolean
  config: TransitionModeConfig
  debug?: DebugLogger
}): CloseTransitionPlan {
  const { fromRect, toRect, thumbRefExists, config, debug } = opts

  if (config.mode === 'none') {
    debug?.log('transitions', 'planClose: mode=none → INSTANT')
    return { mode: 'instant', durationMs: 0, reason: 'mode-forced-none' }
  }

  if (config.mode === 'fade') {
    debug?.log('transitions', 'planClose: mode=fade → FADE')
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
      reason: 'mode-forced-fade',
    }
  }

  if (!fromRect) {
    debug?.log('transitions', 'planClose: no fromRect (lightbox frame) → FADE')
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
      reason: 'missing-frame-rect',
    }
  }

  if (!thumbRefExists) {
    debug?.log('transitions', 'planClose: no thumb ref registered → FADE')
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
      reason: 'missing-thumb-ref',
    }
  }

  if (!toRect || !isUsableRect(toRect)) {
    debug?.log(
      'transitions',
      `planClose: thumb rect unusable (${toRect ? `${toRect.width.toFixed(0)}x${toRect.height.toFixed(0)} at ${toRect.left.toFixed(0)},${toRect.top.toFixed(0)}` : 'null'}) → FADE`,
    )
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
      reason: 'thumb-off-screen',
      fromRect,
    }
  }

  if (config.mode === 'auto') {
    if (!shouldUseFlip(toRect, config, debug)) {
      return {
        mode: 'fade',
        durationMs: CLOSE_FADE_DURATION_MS,
        reason: 'visibility-below-threshold',
        fromRect,
      }
    }
  }

  debug?.log('transitions', 'planClose: all checks passed → FLIP')
  return {
    mode: 'flip',
    durationMs: CLOSE_FLIP_DURATION_MS,
    fromRect,
    toRect,
    reason: 'ok',
  }
}
