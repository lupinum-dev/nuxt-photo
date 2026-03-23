import type { AnimationInstance, CssAnimationProps } from '../types'
import { removeTransitionStyle, setTransitionStyle } from '../utils/dom'

const DEFAULT_EASING = 'cubic-bezier(.4,0,.22,1)'

export function createCssAnimation(props: CssAnimationProps): AnimationInstance {
  let onFinish = props.onFinish || (() => {})
  let finished = false
  let helperTimeout: ReturnType<typeof setTimeout> | null = null

  const {
    target,
    onComplete,
    transform,
    duration = 333,
    easing = DEFAULT_EASING,
  } = props

  const prop: 'transform' | 'opacity' = transform ? 'transform' : 'opacity'
  const propValue = props[prop] ?? ''

  function onTransitionEnd(e: Event) {
    if ((e as TransitionEvent).target === target) {
      finalizeAnimation()
    }
  }

  function finalizeAnimation() {
    if (!finished) {
      finished = true
      onFinish()
      onComplete?.()
    }
  }

  helperTimeout = setTimeout(() => {
    setTransitionStyle(target, prop, duration, easing)
    helperTimeout = setTimeout(() => {
      target.addEventListener('transitionend', onTransitionEnd, false)
      target.addEventListener('transitioncancel', onTransitionEnd, false)

      helperTimeout = setTimeout(() => {
        finalizeAnimation()
      }, duration + 500)

      target.style[prop] = propValue
    }, 30)
  }, 0)

  const animation: AnimationInstance = {
    props,
    get onFinish() {
      return onFinish
    },
    set onFinish(fn: () => void) {
      onFinish = fn
    },
    destroy() {
      if (helperTimeout) {
        clearTimeout(helperTimeout)
      }
      removeTransitionStyle(target)
      target.removeEventListener('transitionend', onTransitionEnd, false)
      target.removeEventListener('transitioncancel', onTransitionEnd, false)
      if (!finished) {
        finalizeAnimation()
      }
    },
  }

  return animation
}
