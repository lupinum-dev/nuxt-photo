import type { AnimationInstance, AnimationsInstance, CssAnimationProps, SpringAnimationProps } from '../types'
import { createCssAnimation } from './createCssAnimation'
import { createSpringAnimation } from './createSpringAnimation'

export function createAnimations(): AnimationsInstance {
  const state: AnimationsInstance = {
    activeAnimations: [],

    startSpring(props: SpringAnimationProps) {
      start(props, true)
    },

    startTransition(props: CssAnimationProps) {
      start(props)
    },

    stop(animation: AnimationInstance) {
      animation.destroy()
      const index = state.activeAnimations.indexOf(animation)
      if (index > -1) {
        state.activeAnimations.splice(index, 1)
      }
    },

    stopAll() {
      state.activeAnimations.forEach(a => a.destroy())
      state.activeAnimations = []
    },

    stopAllPan() {
      state.activeAnimations = state.activeAnimations.filter((animation) => {
        if (animation.props.isPan) {
          animation.destroy()
          return false
        }
        return true
      })
    },

    stopMainScroll() {
      state.activeAnimations = state.activeAnimations.filter((animation) => {
        if (animation.props.isMainScroll) {
          animation.destroy()
          return false
        }
        return true
      })
    },

    isPanRunning() {
      return state.activeAnimations.some(a => a.props.isPan)
    },
  }

  function start(props: SpringAnimationProps | CssAnimationProps, isSpring?: boolean): AnimationInstance {
    const animation = isSpring
      ? createSpringAnimation(props as SpringAnimationProps)
      : createCssAnimation(props as CssAnimationProps)

    state.activeAnimations.push(animation)
    animation.onFinish = () => state.stop(animation)

    return animation
  }

  return state
}
