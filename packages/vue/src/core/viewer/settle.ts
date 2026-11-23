/** The swipe and close-drag settle spring, ω per s (D31); the owner accepted it on the phone on 2026-11-16. */
export const SETTLE_STIFFNESS = 26

/** Closer than this many px to rest counts as arrived. */
const REST_PX = 0.5
/** Keyframe spacing: one sample per frame of a 120 Hz screen. */
const SAMPLE_MS = 1000 / 120

/**
 * Where a settle is after `t` ms, in px from rest. `from` is the distance from rest when it
 * starts, `velocity` its speed then in px/ms (positive moves away from rest on the positive
 * side). Call it with a velocity from {@link settleVelocity} so it never passes rest.
 */
export function settleAt(from: number, velocity: number, t: number, stiffness = SETTLE_STIFFNESS) {
  const omega = stiffness / 1000
  return (from + (velocity + omega * from) * t) * Math.exp(-omega * t)
}

/**
 * The start speed a settle may take: speed away from rest is dropped, and speed toward rest
 * is capped at what the spring absorbs without passing rest.
 */
export function settleVelocity(from: number, velocity: number, stiffness = SETTLE_STIFFNESS) {
  const towardRest = -Math.sign(from) * velocity
  const allowed = Math.min(Math.max(0, towardRest), (stiffness / 1000) * Math.abs(from))
  return -Math.sign(from) * allowed
}

/**
 * Sample a settle for one linear Web Animation: the positions in px from rest, one per
 * {@link SAMPLE_MS}, ending at exactly 0, and the duration that spacing gives. `stiffness` is
 * the spring's angular frequency per second; opens and closes fly on a softer one.
 */
export function planSettle(from: number, velocity: number, stiffness = SETTLE_STIFFNESS) {
  if (Math.abs(from) < REST_PX) return { duration: 0, positions: [0] }
  const start = settleVelocity(from, velocity, stiffness)
  const positions = [from]
  let t = 0
  // Monotone toward rest, so the first sample within REST_PX ends it.
  while (Math.abs(positions.at(-1)!) >= REST_PX && t < 2000) {
    t += SAMPLE_MS
    positions.push(settleAt(from, start, t, stiffness))
  }
  positions[positions.length - 1] = 0
  return { duration: t, positions }
}
