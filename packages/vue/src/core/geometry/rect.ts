import type { RectLike } from '../types'

/** Return whether a DOM rect is large enough and on-screen enough to animate from. */
export function isUsableRect(
  rect: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  } | null,
): boolean {
  if (!rect) return false
  if (rect.width < 24 || rect.height < 24) return false
  if (rect.bottom < 0 || rect.right < 0) return false
  if (typeof window !== 'undefined') {
    if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false
  }
  return true
}

/** Wrap an index into the `[0, length)` range for circular navigation. */
export function getLoopedIndex(index: number, length: number): number {
  return (index + length) % length
}

/** Fit an aspect ratio into a container while preserving its center point. */
export function fitRect(container: RectLike, aspect: number): RectLike {
  let width = container.width
  let height = width / aspect

  if (height > container.height) {
    height = container.height
    width = height * aspect
  }

  return {
    left: container.left + (container.width - width) / 2,
    top: container.top + (container.height - height) / 2,
    width,
    height,
  }
}

/**
 * Pose a photo-shaped frame so it looks exactly like a cropped thumbnail.
 *
 * The frame keeps its aspect ratio (one uniform scale, origin top left) and a
 * clip in the frame's own coordinates hides what the thumbnail crops away, so
 * a flight between the two never stretches the photo.
 */
export function coverPose(
  frame: RectLike,
  thumb: RectLike,
  thumbRadius = 0,
): { transform: string; clipPath: string } {
  const scale = Math.max(thumb.width / frame.width, thumb.height / frame.height)
  const x = thumb.left + thumb.width / 2 - frame.left - (frame.width * scale) / 2
  const y = thumb.top + thumb.height / 2 - frame.top - (frame.height * scale) / 2
  const insetX = Math.max(0, (frame.width - thumb.width / scale) / 2)
  const insetY = Math.max(0, (frame.height - thumb.height / scale) / 2)
  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    clipPath: `inset(${insetY}px ${insetX}px round ${thumbRadius / scale}px)`,
  }
}

/** The unclipped resting pose that pairs with `coverPose` for clip-path interpolation. */
export function restingClip(radius = 0) {
  return `inset(0px 0px round ${radius}px)`
}

/** Apply a simple rubberband effect when a value moves beyond its allowed range. */
export function rubberband(value: number, min: number, max: number): number {
  if (value < min) {
    return min + (value - min) * 0.2
  }

  if (value > max) {
    return max + (value - max) * 0.2
  }

  return value
}
