import type { TransitionMode, CloseTransitionPlan, RectLike } from '../types'
import type { DebugLogger } from '../debug/logger'
import { isUsableRect } from '../geometry/rect'
import { getWindowDimensions } from '../utils/dom'
import {
  CLOSE_FADE_DURATION_MS,
  CLOSE_FLIP_DURATION_MS,
  TRANSITION_AUTO_MIN_VISIBLE_DIMENSION,
} from './constants'

export type TransitionModeConfig = {
  mode: TransitionMode
  autoThreshold: number
}

/** Create the default close/open transition selection policy. */
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

/** Return the visible-area ratio for a rect within the current viewport. */
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

/**
 * Decide whether an open transition should run as FLIP or FADE.
 *
 * - **FLIP**: morphs the thumbnail rect into the viewer rect. Requires the
 *   thumbnail to be mostly on-screen at a reasonable size — animating from an
 *   invisible or tiny source looks like a random zoom-in.
 * - **FADE**: cross-fades the overlay and media. Used as the fallback when the
 *   thumbnail is off-screen, below the minimum visible dimension, or when the
 *   caller forces it via `config.mode`.
 *
 * In `auto` mode we require both a minimum visible dimension (short side) and a
 * visibility ratio above `config.autoThreshold`. Either alone isn't enough: a
 * large rect clipped to a thin sliver passes the ratio check; a tiny rect that
 * happens to be fully visible passes the dimension check.
 */
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
    visibleWidth < TRANSITION_AUTO_MIN_VISIBLE_DIMENSION ||
    visibleHeight < TRANSITION_AUTO_MIN_VISIBLE_DIMENSION
  ) {
    debug?.log(
      'transitions',
      `mode=auto → visible size ${visibleWidth.toFixed(0)}x${visibleHeight.toFixed(0)}px < ${TRANSITION_AUTO_MIN_VISIBLE_DIMENSION}px min → FADE`,
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

/**
 * Plan the close transition. Mirror of {@link shouldUseFlip} for the reverse
 * direction, but with extra guards: the thumbnail element may have unmounted
 * or scrolled out of view while the lightbox was open.
 *
 * Decision order:
 *   1. `mode: 'none'` → INSTANT (no animation, used for tests/reduced-motion)
 *   2. `mode: 'fade'` → FADE
 *   3. Missing `fromRect` (lightbox frame) → FADE — nothing to animate from
 *   4. No thumb ref registered (list re-rendered during open) → FADE
 *   5. Thumb rect unusable (off-screen or zero-size) → FADE
 *   6. `mode: 'auto'` → delegate to {@link shouldUseFlip} for the visibility check
 *   7. Otherwise → FLIP
 *
 * The `reason` in the returned plan is surfaced to the debug overlay so you
 * can see *why* FADE was chosen when FLIP looked possible.
 */
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
