import type { AnimationInstance, SpringAnimationProps } from '../types'
import { SpringEaser } from '../utils/spring-easer'

export function createSpringAnimation(props: SpringAnimationProps): AnimationInstance {
  let raf = 0
  let onFinish = props.onFinish || (() => {})

  const {
    start,
    end,
    velocity,
    onUpdate,
    onComplete,
    dampingRatio,
    naturalFrequency,
  } = props

  const easer = new SpringEaser(velocity, dampingRatio, naturalFrequency)
  let prevTime = Date.now()
  let deltaPosition = start - end

  const animationLoop = () => {
    if (raf) {
      deltaPosition = easer.easeFrame(deltaPosition, Date.now() - prevTime)

      if (Math.abs(deltaPosition) < 1 && Math.abs(easer.velocity) < 50) {
        onUpdate(end)
        onComplete?.()
        onFinish()
      }
      else {
        prevTime = Date.now()
        onUpdate(deltaPosition + end)
        raf = requestAnimationFrame(animationLoop)
      }
    }
  }

  raf = requestAnimationFrame(animationLoop)

  const animation: AnimationInstance = {
    props,
    get onFinish() {
      return onFinish
    },
    set onFinish(fn: () => void) {
      onFinish = fn
    },
    destroy() {
      if (raf >= 0) {
        cancelAnimationFrame(raf)
      }
      raf = 0
    },
  }

  return animation
}
