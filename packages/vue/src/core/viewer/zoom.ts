import type { PanBounds, PanState, ZoomState } from '../types'
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

/** Pan range on one axis; `offset` is the frame center minus the area center at fit. */
function axisPanRange(frameSize: number, areaSize: number, zoom: number, offset: number) {
  const drawn = frameSize * zoom
  if (drawn >= areaSize) {
    // Larger than the screen: the photo must cover it edge to edge.
    const half = (drawn - areaSize) / 2
    return { min: -half - offset, max: half - offset }
  }
  // Smaller than the screen: no free panning. The photo glides from its framed
  // position at fit toward the screen center as it grows, with no jump at either end.
  const room = areaSize - frameSize
  const center = room > 0 ? (offset * (areaSize - drawn)) / room : 0
  return { min: center - offset, max: center - offset }
}

/**
 * Compute the allowed pan range for a fitted frame zoomed inside the visible area.
 *
 * `offset` is where the frame's center sits relative to the area's center at fit;
 * a mat with more room below than above moves the photo up.
 */
export function computePanBounds(
  frame: { width: number; height: number },
  area: { width: number; height: number },
  zoom: number,
  offset: PanState = { x: 0, y: 0 },
): PanBounds {
  const x = axisPanRange(frame.width, area.width, zoom, offset.x)
  const y = axisPanRange(frame.height, area.height, zoom, offset.y)
  return { minX: x.min, maxX: x.max, minY: y.min, maxY: y.max }
}

/**
 * Clamp pan position to bounds (hard clamp).
 */
export function clampPanToBounds(pan: PanState, bounds: PanBounds): PanState {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, pan.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, pan.y)),
  }
}

/**
 * Clamp pan position to bounds with rubber-band resistance beyond edges.
 */
export function clampPanWithResistance(pan: PanState, bounds: PanBounds): PanState {
  return {
    x: rubberband(pan.x, bounds.minX, bounds.maxX),
    y: rubberband(pan.y, bounds.minY, bounds.maxY),
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
  panBounds: PanBounds,
  offset: PanState = { x: 0, y: 0 },
): PanState {
  if (targetZoom <= fitZoom + 0.01) {
    return { x: 0, y: 0 }
  }

  // Work with the photo's center relative to the area center, then remove the frame offset.
  const centerX = offset.x + currentPan.x
  const centerY = offset.y + currentPan.y
  const targetPan = {
    x: point.x - ((point.x - centerX) / currentZoom) * targetZoom - offset.x,
    y: point.y - ((point.y - centerY) / currentZoom) * targetZoom - offset.y,
  }

  return clampPanToBounds(targetPan, panBounds)
}
