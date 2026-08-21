import type { TransitionMode, CloseTransitionPlan, RectLike } from '../types'
import { isUsableRect } from '../geometry/rect'
import { getWindowDimensions } from '../geometry/viewport'
import {
  CLOSE_FADE_DURATION_MS,
  CLOSE_FLIP_DURATION_MS,
  TRANSITION_AUTO_MIN_VISIBLE_DIMENSION,
} from './constants'

export type TransitionModeConfig = {
  mode: TransitionMode
  autoThreshold: number
}

/** Default close/open transition selection policy. */
export const DEFAULT_TRANSITION_CONFIG: Readonly<TransitionModeConfig> = Object.freeze({
  mode: 'auto',
  autoThreshold: 0.55,
})

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
  const { width: visibleWidth, height: visibleHeight } = getVisibleDimensions(rect, vw, vh)
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
export function shouldUseFlip(rect: ViewportRect | null, config: TransitionModeConfig): boolean {
  if (config.mode === 'none') return false

  if (config.mode === 'fade') return false

  if (config.mode === 'flip') return true

  // auto mode — check visibility ratio AND minimum visible dimensions
  if (!rect) return false

  const { width: vw, height: vh } = getWindowDimensions()
  const { width: visibleWidth, height: visibleHeight } = getVisibleDimensions(rect, vw, vh)

  if (
    visibleWidth < TRANSITION_AUTO_MIN_VISIBLE_DIMENSION ||
    visibleHeight < TRANSITION_AUTO_MIN_VISIBLE_DIMENSION
  ) {
    return false
  }

  const ratio = getVisibilityRatio(rect)
  return ratio >= config.autoThreshold
}

/**
 * Choose the close transition. Mirror of {@link shouldUseFlip} for the reverse
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
 */
export function chooseCloseTransition(opts: {
  fromRect: RectLike | null
  toRect: DOMRect | null
  thumbRefExists: boolean
  config: TransitionModeConfig
}): CloseTransitionPlan {
  const { fromRect, toRect, thumbRefExists, config } = opts

  if (config.mode === 'none') {
    return { mode: 'instant', durationMs: 0 }
  }

  if (config.mode === 'fade') {
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
    }
  }

  if (!fromRect) {
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
    }
  }

  if (!thumbRefExists) {
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
    }
  }

  if (!toRect || !isUsableRect(toRect)) {
    return {
      mode: 'fade',
      durationMs: CLOSE_FADE_DURATION_MS,
      fromRect,
    }
  }

  if (config.mode === 'auto') {
    if (!shouldUseFlip(toRect, config)) {
      return {
        mode: 'fade',
        durationMs: CLOSE_FADE_DURATION_MS,
        fromRect,
      }
    }
  }

  return {
    mode: 'flip',
    durationMs: CLOSE_FLIP_DURATION_MS,
    fromRect,
    toRect,
  }
}
