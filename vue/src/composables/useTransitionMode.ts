import type { DebugLogger } from './useDebug'

export type TransitionMode = 'flip' | 'fade' | 'auto' | 'none'

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

export function getVisibilityRatio(rect: DOMRect | null): number {
  if (!rect || rect.width <= 0 || rect.height <= 0) return 0

  const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0))
  const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
  const visibleArea = visibleWidth * visibleHeight
  const totalArea = rect.width * rect.height

  return totalArea > 0 ? visibleArea / totalArea : 0
}

export function shouldUseFlip(
  rect: DOMRect | null,
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

  const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0))
  const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))

  if (visibleWidth < MIN_VISIBLE_DIMENSION || visibleHeight < MIN_VISIBLE_DIMENSION) {
    debug?.log('transitions',
      `mode=auto → visible size ${visibleWidth.toFixed(0)}x${visibleHeight.toFixed(0)}px < ${MIN_VISIBLE_DIMENSION}px min → FADE`,
    )
    return false
  }

  const ratio = getVisibilityRatio(rect)
  const useFlip = ratio >= config.autoThreshold

  debug?.log('transitions',
    `mode=auto → visibility=${(ratio * 100).toFixed(1)}% (${visibleWidth.toFixed(0)}x${visibleHeight.toFixed(0)}px) threshold=${(config.autoThreshold * 100).toFixed(0)}% → ${useFlip ? 'FLIP' : 'FADE'}`,
  )

  return useFlip
}
