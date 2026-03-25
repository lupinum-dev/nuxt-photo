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
    const dt = Math.min(0.064, (now - lastTime) / 1000)
    lastTime = now

    const result = springStep(spring.value, spring.target, spring.velocity, spring.tension, spring.friction, dt)
    spring.value = result.value
    spring.velocity = result.velocity

    onUpdate(spring.value)

    const distance = Math.abs(spring.target - spring.value)
    const done = distance < positionThreshold && Math.abs(spring.velocity) < velocityThreshold

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
