import { describe, expect, it } from 'vite-plus/test'
import { planSettle, settleAt, settleVelocity } from '../../src/core/viewer/settle'

/** First sample time in ms at which the settle has covered `share` of the way. */
function reach(positions: number[], from: number, share: number) {
  const index = positions.findIndex(
    (position) => Math.abs(from - position) >= Math.abs(from) * share,
  )
  return (index * 1000) / 120
}

describe('settle spring', () => {
  it('is half way in about 65 ms and 90% in about 150 ms from rest', () => {
    const { positions } = planSettle(-160, 0)
    expect(reach(positions, -160, 0.5)).toBeCloseTo(66.7, -1)
    expect(reach(positions, -160, 0.9)).toBeCloseTo(150, -1)
  })

  it('arrives within half a pixel in under 400 ms for a long settle', () => {
    const { duration, positions } = planSettle(412, 0)
    expect(duration).toBeLessThan(400)
    expect(Math.abs(positions.at(-2)!)).toBeGreaterThanOrEqual(0.5)
    expect(positions.at(-1)).toBe(0)
  })

  it('starts at the release speed', () => {
    const start = settleVelocity(-200, 1.2)
    expect(start).toBe(1.2)
    expect((settleAt(-200, start, 0.01) - settleAt(-200, start, 0)) / 0.01).toBeCloseTo(1.2, 2)
  })

  it('never passes rest: a release faster than the spring absorbs is capped', () => {
    expect(settleVelocity(-50, 5)).toBeCloseTo(1.3, 5)
    const { positions } = planSettle(-50, 5)
    for (const [index, position] of positions.entries()) {
      expect(position).toBeLessThanOrEqual(0)
      if (index) expect(position).toBeGreaterThanOrEqual(positions[index - 1]!)
    }
  })

  it('drops speed away from rest', () => {
    expect(settleVelocity(-50, -2)).toBe(0)
  })
})
