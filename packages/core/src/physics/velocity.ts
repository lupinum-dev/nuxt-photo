type Sample = { x: number; y: number; time: number }

export class VelocityTracker {
  private samples: Sample[] = []
  private readonly windowMs: number

  constructor(windowMs = 100) {
    this.windowMs = windowMs
  }

  reset() {
    this.samples.length = 0
  }

  addSample(x: number, y: number, time: number) {
    this.samples.push({ x, y, time })
    const cutoff = time - this.windowMs * 2
    while (this.samples.length > 2 && this.samples[0]!.time < cutoff) {
      this.samples.shift()
    }
  }

  getVelocity(): { vx: number; vy: number } {
    if (this.samples.length < 2) return { vx: 0, vy: 0 }

    const now = this.samples[this.samples.length - 1]!.time
    const cutoff = now - this.windowMs

    let oldest = this.samples[this.samples.length - 1]!
    for (const s of this.samples) {
      if (s.time >= cutoff) {
        oldest = s
        break
      }
    }

    const newest = this.samples[this.samples.length - 1]!
    const elapsed = newest.time - oldest.time
    if (elapsed < 1) return { vx: 0, vy: 0 }

    return {
      vx: (newest.x - oldest.x) / elapsed,
      vy: (newest.y - oldest.y) / elapsed,
    }
  }
}
