const CAPACITY = 32

type Sample = { x: number; y: number; time: number }

export class VelocityTracker {
  private readonly buffer: (Sample | undefined)[] = new Array(CAPACITY)
  private head = 0
  private count = 0
  private readonly windowMs: number

  constructor(windowMs = 100) {
    this.windowMs = windowMs
  }

  reset() {
    this.head = 0
    this.count = 0
  }

  addSample(x: number, y: number, time: number) {
    this.buffer[this.head] = { x, y, time }
    this.head = (this.head + 1) % CAPACITY
    if (this.count < CAPACITY) this.count++
  }

  getVelocity(): { vx: number; vy: number } {
    if (this.count < 2) return { vx: 0, vy: 0 }

    const newestSlot = (this.head - 1 + CAPACITY) % CAPACITY
    const newest = this.buffer[newestSlot]!
    const cutoff = newest.time - this.windowMs

    // Iterate from oldest to newest to find the oldest sample still within window
    const startSlot = (this.head - this.count + CAPACITY) % CAPACITY
    let oldest = newest
    for (let i = 0; i < this.count; i++) {
      const slot = (startSlot + i) % CAPACITY
      const s = this.buffer[slot]!
      if (s.time >= cutoff) {
        oldest = s
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
