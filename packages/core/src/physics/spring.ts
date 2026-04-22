/**
 * 1D damped spring integrator.
 *
 * Model: force = displacement·tension − velocity·friction (Hooke's law with
 * viscous damping). Integrated with semi-implicit Euler in {@link springStep}.
 *
 * Default (tension=260, friction=22) is tuned for overlay-scale movement
 * (a few hundred pixels): slightly underdamped, settles in ~400ms without
 * visible oscillation. Lower friction → bouncier; higher tension → snappier.
 */
export type Spring1D = {
  value: number
  target: number
  velocity: number
  tension: number
  friction: number
  rafId: number
}

export function createSpring1D(tension = 260, friction = 22): Spring1D {
  return { value: 0, target: 0, velocity: 0, tension, friction, rafId: 0 }
}

export function stopSpring(spring: Spring1D) {
  if (spring.rafId) {
    cancelAnimationFrame(spring.rafId)
    spring.rafId = 0
  }
}

export function springStep(
  current: number,
  target: number,
  velocity: number,
  tension: number,
  friction: number,
  dt: number,
): { value: number; velocity: number } {
  const distance = target - current
  const newVelocity = velocity + (distance * tension - velocity * friction) * dt
  return { value: current + newVelocity * dt, velocity: newVelocity }
}

export function runSpring(
  spring: Spring1D,
  onUpdate: (value: number) => void,
  onComplete?: () => void,
  positionThreshold = 0.5,
  velocityThreshold = 0.1,
) {
  stopSpring(spring)
  let lastTime = performance.now()

  const step = (now: number) => {
    // Cap dt at 64ms (~15fps floor): after a dropped frame or tab switch we'd
    // otherwise integrate a huge step and fling the spring past its target.
    const dt = Math.min(0.064, (now - lastTime) / 1000)
    lastTime = now

    const result = springStep(
      spring.value,
      spring.target,
      spring.velocity,
      spring.tension,
      spring.friction,
      dt,
    )
    spring.value = result.value
    spring.velocity = result.velocity

    onUpdate(spring.value)

    const distance = Math.abs(spring.target - spring.value)
    const done =
      distance < positionThreshold &&
      Math.abs(spring.velocity) < velocityThreshold

    if (done) {
      spring.value = spring.target
      spring.velocity = 0
      spring.rafId = 0
      onUpdate(spring.value)
      onComplete?.()
      return
    }

    spring.rafId = requestAnimationFrame(step)
  }

  spring.rafId = requestAnimationFrame(step)
}
