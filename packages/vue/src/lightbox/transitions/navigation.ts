import { ref, type Ref } from 'vue'
import type { LightboxNavigationMode } from '../../core/index'
import type { MotionVisualState } from './visual-state'

const CROSSFADE_MS = 280
const FADE_OUT_MS = 150
const FADE_IN_MS = 230
const SETTLE_MS = 240
/** Share of the finger's travel that a dragged photo follows in the fade modes. */
const DRAG_TRAVEL = 0.35
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.33, 0, 0.2, 1)'

/** How far a swiped photo keeps drifting, and how far the next one travels in. */
const ARRIVAL_SHIFT = 32

type Pose = { opacity: number; transform: string }

/** The horizontal offset of a computed `transform`, or 0 when there is none. */
function offsetX(transform: string | undefined) {
  if (!transform || transform === 'none' || typeof DOMMatrixReadOnly !== 'function') return 0
  return new DOMMatrixReadOnly(transform).m41
}

/**
 * Fade and crossfade between stacked slides.
 *
 * Stylesheets own the resting state: the active slide is visible, the others are
 * transparent. Animations here only carry a slide between those states, starting
 * from whatever it shows now, so a second change or a drag mid-fade never jumps.
 */
export function createNavigationMotion(
  visual: MotionVisualState,
  activeIndex: Ref<number>,
  getMode: () => LightboxNavigationMode,
  isReducedMotion: () => boolean,
) {
  /** Slides still fading out; they keep their image mounted until the fade ends. */
  const leavingSlides = ref<number[]>([])
  const running = new Map<HTMLElement, Animation>()
  let dragBase = 1

  const frameOf = (index: number) => visual.slideFrameRefs.get(index) ?? null

  /** Read what the slide shows now, then hand it back to the stylesheet. */
  function takePose(element: HTMLElement): Pose {
    const style = getComputedStyle(element)
    const pose = { opacity: Number(style.opacity), transform: style.transform || 'none' }
    running.get(element)?.cancel()
    running.delete(element)
    element.style.opacity = ''
    element.style.transform = ''
    return pose
  }

  function run(element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    if (typeof element.animate !== 'function') return Promise.resolve()
    // `backwards` holds the first frame through a delay; afterwards the stylesheet rules.
    const animation = element.animate(keyframes, { ...options, fill: 'backwards' })
    running.set(element, animation)
    return animation.finished
      .catch(() => {})
      .finally(() => {
        if (running.get(element) === animation) running.delete(element)
      })
  }

  function forgetLeaving(index: number) {
    leavingSlides.value = leavingSlides.value.filter((item) => item !== index)
  }

  /** Carry the view from slide `from` to slide `to`; `activeIndex` already points at `to`. */
  function play(from: number, to: number) {
    const leaving = frameOf(from)
    const entering = frameOf(to)
    const leavingPose = leaving ? takePose(leaving) : null
    const enteringPose = entering ? takePose(entering) : null
    forgetLeaving(to)
    const mode = getMode()
    if (mode === 'slide' || isReducedMotion()) return

    // After a swipe the old photo keeps drifting the way it was thrown and the new
    // one arrives from the other side; a key or button change stays in place.
    const thrown = offsetX(leavingPose?.transform)
    const drift = Math.sign(thrown) * ARRIVAL_SHIFT

    if (leaving && leavingPose && leavingPose.opacity > 0) {
      leavingSlides.value = [...leavingSlides.value.filter((item) => item !== from), from]
      const hold = leavingPose.transform
      const away = thrown ? `translateX(${thrown + drift}px)` : hold
      const keyframes: Keyframe[] =
        mode === 'crossfade'
          ? // The old photo stays whole until the new one mostly covers it: no dip to the room.
            [
              { opacity: leavingPose.opacity, transform: hold },
              { opacity: leavingPose.opacity, offset: 0.3 },
              { opacity: 0, transform: away },
            ]
          : [
              { opacity: leavingPose.opacity, transform: hold },
              { opacity: 0, transform: away },
            ]
      const duration =
        mode === 'crossfade' ? CROSSFADE_MS : Math.max(60, FADE_OUT_MS * leavingPose.opacity)
      void run(leaving, keyframes, {
        duration,
        easing: mode === 'crossfade' ? 'linear' : EASE_IN,
      }).then(() => {
        if (!running.has(leaving) && activeIndex.value !== from) forgetLeaving(from)
      })
    }

    if (entering) {
      // Continue from what the slide shows now: at rest that is 0, but a quick return
      // to the previous photo finds it still (partly) visible.
      const start = enteringPose?.opacity ?? 0
      const fadeGap = mode === 'fade' && leavingPose && leavingPose.opacity > 0
      const arrive = drift ? `translateX(${-drift}px)` : 'none'
      void run(
        entering,
        [
          { opacity: start, transform: arrive },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration: mode === 'crossfade' ? CROSSFADE_MS : FADE_IN_MS,
          delay: fadeGap ? Math.max(60, FADE_OUT_MS * leavingPose.opacity) : 0,
          easing: mode === 'crossfade' ? EASE_IN_OUT : EASE_OUT,
        },
      )
    }
  }

  /** Let the active photo follow a horizontal drag and fade with distance. */
  function drag(deltaX: number) {
    const element = frameOf(activeIndex.value)
    if (!element) return
    // A drag that starts mid-fade continues from the opacity shown, not from full.
    if (running.has(element)) dragBase = takePose(element).opacity
    const width = visual.viewportRef.value?.clientWidth || window.innerWidth || 1
    const progress = Math.min(1, Math.abs(deltaX) / (width * 0.5))
    element.style.transform = `translateX(${deltaX * DRAG_TRAVEL}px)`
    element.style.opacity = String(dragBase * (1 - progress * 0.6))
  }

  /**
   * End a drag. Returns true when it went far or fast enough to change photos;
   * the change then continues from the dragged pose. Otherwise the photo settles back.
   */
  function release(deltaX: number, velocityX: number) {
    dragBase = 1
    const width = visual.viewportRef.value?.clientWidth || window.innerWidth || 1
    const far = Math.abs(deltaX) > Math.min(120, width * 0.18)
    const flick =
      Math.abs(velocityX) > 0.45 &&
      Math.abs(deltaX) > 20 &&
      Math.sign(velocityX) === Math.sign(deltaX)
    if (far || flick) return true

    const element = frameOf(activeIndex.value)
    if (element) {
      const pose = takePose(element)
      void run(element, [pose, { opacity: 1, transform: 'none' }], {
        duration: isReducedMotion() ? 1 : SETTLE_MS,
        easing: EASE_OUT,
      })
    }
    return false
  }

  function reset() {
    for (const [element, animation] of running) {
      animation.cancel()
      element.style.opacity = ''
      element.style.transform = ''
    }
    running.clear()
    for (const element of visual.slideFrameRefs.values()) {
      element.style.opacity = ''
      element.style.transform = ''
    }
    leavingSlides.value = []
  }

  return { leavingSlides, play, drag, release, reset }
}
