import type { PanState, PhotoItem, RectLike, ZoomState } from '../types'
import { fitRect, rubberband } from '../geometry/rect'

export const DEFAULT_MIN_ZOOM = 1.5

/**
 * Compute a frame rect (fitted to aspect ratio) relative to the container origin.
 */
export function computeFittedFrame(
  containerWidth: number,
  containerHeight: number,
  photoWidth: number,
  photoHeight: number,
): RectLike {
  return fitRect(
    { left: 0, top: 0, width: containerWidth, height: containerHeight },
    photoWidth / photoHeight,
  )
}

/**
 * Compute zoom levels for a photo within a given area.
 * Respects per-photo `photo.meta.maxZoom` / `photo.meta.minZoom` overrides,
 * and accepts a lightbox-level `options.minZoom` fallback.
 */
export function computeZoomLevels(
  photoWidth: number,
  photoHeight: number,
  areaWidth: number,
  areaHeight: number,
  photo?: PhotoItem,
  options?: { minZoom?: number },
): ZoomState {
  const frame = computeFittedFrame(areaWidth, areaHeight, photoWidth, photoHeight)

  const metaMax = typeof photo?.meta?.maxZoom === 'number' && (photo.meta.maxZoom as number) > 0
    ? (photo.meta.maxZoom as number)
    : null

  const minZoom = (typeof photo?.meta?.minZoom === 'number' && (photo.meta.minZoom as number) > 0
    ? (photo.meta.minZoom as number)
    : null) ?? options?.minZoom ?? DEFAULT_MIN_ZOOM

  const naturalMax = metaMax ?? Math.max(
    minZoom,
    Math.min(4, photoWidth / frame.width, photoHeight / frame.height),
  )
  const secondary = Math.min(2, naturalMax)

  return {
    fit: 1,
    secondary,
    max: Math.max(secondary, naturalMax),
    current: 1,
  }
}

/**
 * Compute pan bounds for a given zoom level.
 * Returns the maximum absolute pan offset in each axis.
 */
export function computePanBounds(
  photoWidth: number,
  photoHeight: number,
  areaWidth: number,
  areaHeight: number,
  zoom: number,
): { x: number; y: number } {
  const frame = computeFittedFrame(areaWidth, areaHeight, photoWidth, photoHeight)
  return {
    x: Math.max(0, (frame.width * zoom - areaWidth) / 2),
    y: Math.max(0, (frame.height * zoom - areaHeight) / 2),
  }
}

/**
 * Clamp pan position to bounds (hard clamp).
 */
export function clampPanToBounds(pan: PanState, bounds: { x: number; y: number }): PanState {
  return {
    x: Math.min(bounds.x, Math.max(-bounds.x, pan.x)),
    y: Math.min(bounds.y, Math.max(-bounds.y, pan.y)),
  }
}

/**
 * Clamp pan position to bounds with rubber-band resistance beyond edges.
 */
export function clampPanWithResistance(pan: PanState, bounds: { x: number; y: number }): PanState {
  return {
    x: rubberband(pan.x, -bounds.x, bounds.x),
    y: rubberband(pan.y, -bounds.y, bounds.y),
  }
}

/**
 * Convert client (screen) coordinates to a point relative to area center.
 */
export function clientToAreaPoint(
  clientX: number,
  clientY: number,
  areaLeft: number,
  areaTop: number,
  areaWidth: number,
  areaHeight: number,
): { x: number; y: number } {
  return {
    x: clientX - areaLeft - areaWidth / 2,
    y: clientY - areaTop - areaHeight / 2,
  }
}

/**
 * Compute the target pan position when zooming to a specific level,
 * keeping the given point stable on screen.
 */
export function computeTargetPanForZoom(
  targetZoom: number,
  currentZoom: number,
  currentPan: PanState,
  point: { x: number; y: number },
  fitZoom: number,
  panBounds: { x: number; y: number },
): PanState {
  if (targetZoom <= fitZoom + 0.01) {
    return { x: 0, y: 0 }
  }

  const targetPan = {
    x: point.x - ((point.x - currentPan.x) / currentZoom) * targetZoom,
    y: point.y - ((point.y - currentPan.y) / currentZoom) * targetZoom,
  }

  return clampPanToBounds(targetPan, panBounds)
}
