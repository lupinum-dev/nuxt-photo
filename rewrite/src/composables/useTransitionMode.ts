import type { DebugLogger } from './useDebug'

export type TransitionMode = 'flip' | 'fade' | 'auto'

export type TransitionModeConfig = {
  mode: TransitionMode
  autoThreshold: number
}

export function createTransitionMode(): TransitionModeConfig {
  return {
    mode: 'auto',
    autoThreshold: 0.4,
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
  if (config.mode === 'fade') {
    debug?.log('transitions', 'mode=fade → skip FLIP')
    return false
  }

  if (config.mode === 'flip') {
    debug?.log('transitions', 'mode=flip → force FLIP')
    return true
  }

  // auto mode
  const ratio = getVisibilityRatio(rect)
  const useFlip = ratio >= config.autoThreshold

  debug?.log('transitions',
    `mode=auto → visibility=${(ratio * 100).toFixed(1)}% threshold=${(config.autoThreshold * 100).toFixed(0)}% → ${useFlip ? 'FLIP' : 'FADE'}`,
  )

  return useFlip
}
