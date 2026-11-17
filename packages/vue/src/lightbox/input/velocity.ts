const MAX_SAMPLES = 32

/** Velocity estimator for pointer gesture completion, over the newest 32 samples. */
export function createVelocityTracker(windowMs: number) {
  let samples: { x: number; y: number; time: number }[] = []
  const rest = { vx: 0, vy: 0 }

  return {
    reset() {
      samples = []
    },
    addSample(x: number, y: number, time: number) {
      samples.push({ time, x, y })
      if (samples.length > MAX_SAMPLES) samples.shift()
    },
    /** Speed in px/ms over the window; zero when the pointer has rested since `now - windowMs`. */
    getVelocity(now?: number) {
      const newest = samples.at(-1)
      if (!newest || samples.length < 2) return rest
      if (now !== undefined && now - newest.time > windowMs) return rest
      const oldest = samples.find((sample) => sample.time >= newest.time - windowMs) ?? newest
      const elapsed = newest.time - oldest.time
      if (elapsed < 1) return rest
      return {
        vx: (newest.x - oldest.x) / elapsed,
        vy: (newest.y - oldest.y) / elapsed,
      }
    },
  }
}
