import { planSettle } from '../../core/index'
import type { Inset, Pose, RectLike } from '../../core/index'

/** The open and close flight spring, ω per s (D35); the owner accepted it on the phone on 2026-11-16. */
export const FLIGHT_STIFFNESS = 18
/** A shorter flight plans as if it were this long, in px; owner-accepted on the phone, 2026-11-16. */
const FLIGHT_FLOOR_PX = 100
/** The open hands the ghost over to the slide's photo when it is this close to its place. */
const HANDOFF_PX = 2
/** Linear fades: the fade mode, a thumbnail the page covers, and reduced motion. */
export const FADE_DURATION_MS = 220
export const REDUCED_MOTION_DURATION_MS = 160
/** An interrupted open or close finishes its handoff in this time. */
export const INTERRUPTED_HANDOFF_MS = 80
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * The flight's progress from 0 to 1, one sample per 120 Hz frame, and its duration. `speed` is
 * the progress per ms it starts with toward the end: 0 from rest, a drag's release otherwise.
 */
export function planFlight(distance: number, speed = 0) {
  const scale = Math.max(distance, FLIGHT_FLOOR_PX)
  const { duration, positions } = planSettle(scale, -speed * scale, FLIGHT_STIFFNESS)
  const progress = positions.map((position) => 1 - position / scale)
  // When the ghost is close enough to its place to hand over: in ms after the start.
  const last = Math.max(1, progress.length - 1)
  const handoff = progress.findIndex((value) => (1 - value) * distance < HANDOFF_PX)
  return { duration, progress, handoffMs: (Math.max(0, handoff) / last) * duration }
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const lerp = (from: number, to: number, share: number) => from + (to - from) * share

/** The share of its way a flight has come `time` ms after its start: its samples play linearly. */
export function progressAt(progress: number[], duration: number, time: number) {
  const at = clamp01(duration > 0 ? time / duration : 1) * (progress.length - 1)
  const index = Math.floor(at)
  return lerp(progress[index] ?? 1, progress[index + 1] ?? progress[index] ?? 1, at - index)
}

export const writePose = ({ x, y, scale }: Pose) => `translate(${x}px, ${y}px) scale(${scale})`

export const writeInset = ({ top, right, bottom, left, radius }: Inset) =>
  `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`

export function mixPose(from: Pose, to: Pose, share: number): Pose {
  return {
    x: lerp(from.x, to.x, share),
    y: lerp(from.y, to.y, share),
    scale: lerp(from.scale, to.scale, share),
  }
}

export function mixInset(from: Inset, to: Inset, share: number): Inset {
  return {
    top: lerp(from.top, to.top, share),
    right: lerp(from.right, to.right, share),
    bottom: lerp(from.bottom, to.bottom, share),
    left: lerp(from.left, to.left, share),
    radius: lerp(from.radius, to.radius, share),
  }
}

/** The box a layout box draws with a pose, the transform origin at its top left. */
export function posedBox(layout: RectLike, pose: Pose) {
  const left = layout.left + pose.x
  const top = layout.top + pose.y
  return {
    left,
    top,
    right: left + layout.width * pose.scale,
    bottom: top + layout.height * pose.scale,
  }
}

type Box = ReturnType<typeof posedBox>

/** How far a flight goes: the largest move of any edge. */
export const flightDistance = (from: Box, to: Box) =>
  Math.max(
    Math.abs(to.left - from.left),
    Math.abs(to.top - from.top),
    Math.abs(to.right - from.right),
    Math.abs(to.bottom - from.bottom),
  )

/** The most progress per ms a release gives a flight (D35); owner-accepted on the phone, 2026-11-16. */
const MAX_RELEASE_PROGRESS_SPEED = 0.0045

/**
 * The progress per ms a vertical release speed gives a flight: the speed projected on the
 * direction the photo's centre travels, as a share of that travel.
 */
export function releaseProgressSpeed(from: Box, to: Box, velocityY: number) {
  const dx = (to.left + to.right - from.left - from.right) / 2
  const dy = (to.top + to.bottom - from.top - from.bottom) / 2
  const squared = dx * dx + dy * dy
  if (squared < 1) return 0
  return Math.min(MAX_RELEASE_PROGRESS_SPEED, Math.max(0, (velocityY * dy) / squared))
}
