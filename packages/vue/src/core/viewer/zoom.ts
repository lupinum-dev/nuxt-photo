import type { PanState, ZoomState } from '../types'
import { rubberband } from '../geometry/rect'

export const DEFAULT_MIN_ZOOM = 1.5

/**
 * Compute zoom levels for a photo drawn at `frameWidth` × `frameHeight` when fitted.
 *
 * The click target (`secondary`) is the photo's real pixels, so zooming reveals
 * detail instead of upscaling. `minZoom` is an explicit provider option that
 * keeps zoom available when the photo has no more pixels to show;
 * application-owned photo metadata is never interpreted by the viewer.
 */
export function computeZoomLevels(
  photoWidth: number,
  photoHeight: number,
  frameWidth: number,
  frameHeight: number,
  options?: { minZoom?: number },
): ZoomState {
  const minZoom =
    typeof options?.minZoom === 'number' && Number.isFinite(options.minZoom) && options.minZoom > 0
      ? options.minZoom
      : DEFAULT_MIN_ZOOM

  const realPixels = Math.min(photoWidth / frameWidth, photoHeight / frameHeight)
  const max = Math.max(minZoom, Math.min(4, realPixels))

  return {
    fit: 1,
    secondary: max,
    max,
    current: 1,
  }
}

/**
 * Compute pan bounds for a fitted frame zoomed inside the visible area.
 * Returns the maximum absolute pan offset in each axis.
 */
export function computePanBounds(
  frame: { width: number; height: number },
  area: { width: number; height: number },
  zoom: number,
): { x: number; y: number } {
  return {
    x: Math.max(0, (frame.width * zoom - area.width) / 2),
    y: Math.max(0, (frame.height * zoom - area.height) / 2),
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
