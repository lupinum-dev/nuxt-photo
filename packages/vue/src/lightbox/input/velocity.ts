type VelocitySample = { x: number; y: number; time: number }

/** Fixed-size velocity estimator for pointer gesture completion. */
export class VelocityTracker {
  private readonly buffer: (VelocitySample | undefined)[] = new Array(32)
  private head = 0
  private count = 0

  constructor(private readonly windowMs = 120) {}

  reset() {
    this.head = 0
    this.count = 0
  }

  addSample(x: number, y: number, time: number) {
    this.buffer[this.head] = { time, x, y }
    this.head = (this.head + 1) % this.buffer.length
    if (this.count < this.buffer.length) this.count++
  }

  getVelocity(): { vx: number; vy: number } {
    if (this.count < 2) return { vx: 0, vy: 0 }

    const newestSlot = (this.head - 1 + this.buffer.length) % this.buffer.length
    const newest = this.buffer[newestSlot]!
    const cutoff = newest.time - this.windowMs
    const startSlot =
      (this.head - this.count + this.buffer.length) % this.buffer.length
    let oldest = newest

    for (let index = 0; index < this.count; index++) {
      const sample = this.buffer[(startSlot + index) % this.buffer.length]!
      if (sample.time >= cutoff) {
        oldest = sample
        break
      }
    }

    const elapsed = newest.time - oldest.time
    if (elapsed < 1) return { vx: 0, vy: 0 }
    return {
      vx: (newest.x - oldest.x) / elapsed,
      vy: (newest.y - oldest.y) / elapsed,
    }
  }
}
