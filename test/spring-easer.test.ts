import { describe, expect, it } from 'vitest'
import { SpringEaser } from '../src/runtime/lightbox/utils/spring-easer'

describe('SpringEaser', () => {
  it('scales initial velocity by 1000', () => {
    const spring = new SpringEaser(2)
    expect(spring.velocity).toBe(2000)
  })

  it('converges toward zero with critically damped spring (ratio = 1)', () => {
    const spring = new SpringEaser(0, 1)
    let displacement = 100

    for (let i = 0; i < 60; i++) {
      displacement = spring.easeFrame(displacement, 16)
    }

    expect(Math.abs(displacement)).toBeLessThan(1)
  })

  it('oscillates with underdamped spring (ratio < 1)', () => {
    const spring = new SpringEaser(0, 0.3)
    let displacement = 100
    let signChanges = 0
    let prevSign = Math.sign(displacement)

    for (let i = 0; i < 120; i++) {
      displacement = spring.easeFrame(displacement, 16)
      const currentSign = Math.sign(displacement)
      if (currentSign !== 0 && currentSign !== prevSign) {
        signChanges++
        prevSign = currentSign
      }
    }

    expect(signChanges).toBeGreaterThan(0)
  })

  it('converges over many frames regardless of damping', () => {
    const spring = new SpringEaser(5, 0.75)
    let displacement = 200

    for (let i = 0; i < 200; i++) {
      displacement = spring.easeFrame(displacement, 16)
    }

    expect(Math.abs(displacement)).toBeLessThan(1)
    expect(Math.abs(spring.velocity)).toBeLessThan(100)
  })

  it('responds to custom natural frequency', () => {
    const slow = new SpringEaser(0, 0.75, 4)
    const fast = new SpringEaser(0, 0.75, 20)
    let slowDisp = 100
    let fastDisp = 100

    for (let i = 0; i < 30; i++) {
      slowDisp = slow.easeFrame(slowDisp, 16)
      fastDisp = fast.easeFrame(fastDisp, 16)
    }

    expect(Math.abs(fastDisp)).toBeLessThan(Math.abs(slowDisp))
  })
})
