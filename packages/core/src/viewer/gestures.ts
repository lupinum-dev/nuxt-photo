import type { GestureMode, PanState } from '../types'

/**
 * Classify a gesture based on pointer movement delta.
 * Returns the gesture mode: idle, slide, pan, or close.
 */
export function classifyGesture(
  deltaX: number,
  deltaY: number,
  pointerType: string,
  isZoomedIn: boolean,
  panBounds: { x: number; y: number },
  currentPan: PanState,
): GestureMode {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  const threshold = pointerType === 'touch' ? 10 : 6

  if (absX < threshold && absY < threshold) return 'idle'

  const horizontalIntent = absX > absY * 1.1
  const verticalIntent = absY > absX * 1.1

  if (isZoomedIn) {
    const canPanX = panBounds.x > 0.5
    const canPanY = panBounds.y > 0.5
    const atLeftEdge = currentPan.x >= panBounds.x - 1
    const atRightEdge = currentPan.x <= -panBounds.x + 1
    const wantsOutwardSlide =
      horizontalIntent &&
      (!canPanX || (deltaX > 0 && atLeftEdge) || (deltaX < 0 && atRightEdge))

    if (!wantsOutwardSlide && (canPanX || canPanY)) return 'pan'
    if (horizontalIntent) return 'slide'
    return 'pan'
  }

  if (horizontalIntent) return 'slide'
  if (verticalIntent) return 'close'
  return absX >= absY ? 'slide' : 'close'
}

/**
 * Detect a double-tap based on timing and proximity.
 */
export function isDoubleTap(
  now: number,
  lastTap: { time: number; clientX: number; clientY: number } | null,
  clientX: number,
  clientY: number,
  maxInterval = 260,
  maxDistance = 24,
): boolean {
  if (!lastTap) return false
  return (
    now - lastTap.time < maxInterval &&
    Math.abs(clientX - lastTap.clientX) < maxDistance &&
    Math.abs(clientY - lastTap.clientY) < maxDistance
  )
}

/**
 * Compute the close-drag ratio (0 to 0.75) from vertical drag distance.
 */
export function computeCloseDragRatio(
  closeDragY: number,
  areaHeight: number,
): number {
  return Math.min(0.75, Math.abs(closeDragY) / Math.max(240, areaHeight * 0.85))
}
