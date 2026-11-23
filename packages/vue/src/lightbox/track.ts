import { onBeforeUnmount, watch, type Ref, type WatchSource } from 'vue'
import { planSettle } from '../core/index'
import type { GlowFollower } from './glow'
import { createStartGate } from './transitions/animation'

// Release thresholds, read from Embla 8's drag handler, which the track replaces.
/** Speeds below this many px/ms count as a stop. */
const MIN_FLICK_VELOCITY = 0.1
/** How far a release speed carries the track, in px per px/ms. */
const FLICK_PROJECTION = { mouse: 300, touch: 400 } as const
/** A projected flick at least this far (20% of the width, kept within 50 to 225 px) changes photos. */
const FLICK_SHARE = 0.2
const FLICK_MIN_PX = 50
const FLICK_MAX_PX = 225
/** Slower releases change photos when the projected position passes half a photo. */
const SNAP_SHARE = 0.5
/** A drag moves the track at most one photo either way. */
const MAX_DRAG_SHARE = 1
/** With one photo the drag resists and never travels past this share of the width. */
const RUBBER_BAND_SHARE = 0.25
/** The photo changes this long after a release, and after a frame (D32); owner-accepted on the phone, 2026-11-16. */
const CHANGE_DELAY_MS = 100

type TrackOptions = {
  /** The element that clips the track; its first child is the track, the track's children the slides. */
  viewport: Readonly<Ref<HTMLElement | null | undefined>>
  activeIndex: Readonly<Ref<number>>
  count: () => number
  /** False in the fade modes: the slides stay stacked and the track rests. */
  enabled: () => boolean
  direction: () => 'ltr' | 'rtl'
  reducedMotion: () => boolean
  requestIndex: (index: number) => void
  /** Slides kept mounted while they are still on screen. */
  leaving: Ref<number[]>
  /** Sources whose change means the slide width may have changed. */
  geometry: WatchSource
  /** The ambient glow, when one is mounted: it follows what the track shows. */
  glow: () => GlowFollower | null
}

/**
 * The swipe track of `slide` mode. A drag moves the track one to one with the pointer and
 * the release settles it from where it is, so a new drag can catch it mid-way.
 *
 * Only the track's transform changes per pointer move. The photo before and after the active
 * one move next to it with a `translate`, which lets the collection loop.
 *
 * Motion first: a release toward a neighbour starts its settle while it is handled and
 * changes the photo (the slides, counter and caption Vue renders) only once the settle has run
 * for a while. That work then runs while the compositor plays the settle, instead of holding
 * its first frames; the settle is re-based under the new photo without moving on screen.
 */
export function createSlideTrack(options: TrackOptions) {
  const { viewport, activeIndex, leaving } = options
  /** Where the active slide is drawn, in px from its resting place. */
  let offset = 0
  let dragOrigin = 0
  /** When a drag last moved the track: a released settle starts from there. */
  let movedAt = 0
  let width = 1
  let settle: Animation | null = null
  /** The glow's opacity animation, started and stopped with the settle. */
  let glowSettle: Animation | null = null
  /** The running settle's samples, in px from the resting place, kept to re-base it. */
  let settlePositions: number[] = []
  /**
   * The photo change in progress, if any:
   * - `lead`: a released step settles toward the neighbour `step` away, and the photo changes
   *   to `to` once the settle has run a while (`cancel` stops that timer);
   * - `asked`: the track asked for `to`; the active index watch re-bases the settle under it;
   * - `jump`: a step or jump asked for a photo; once the index changes, the track settles from
   *   photo `from` with `velocity`.
   */
  let change:
    | { kind: 'idle' }
    | { kind: 'lead'; to: number; step: number; cancel: () => void }
    | { kind: 'asked'; to: number }
    | { kind: 'jump'; from: number; velocity: number } = { kind: 'idle' }
  /** A photo left by a jump of more than one: kept beside the new one until the settle ends. */
  let jumpFrom: { index: number; side: number } | null = null
  const shifted = new Map<HTMLElement, string>()

  const track = () => viewport.value?.firstElementChild as HTMLElement | null | undefined
  /** +1 when the next photo sits to the right. */
  const sign = () => (options.direction() === 'rtl' ? -1 : 1)
  /** The neighbour a running `lead` step goes to, as an offset from the active photo. */
  const leadStep = () => (change.kind === 'lead' ? change.step : 0)
  const base = () => -(activeIndex.value + leadStep()) * width * sign()
  const wrap = (index: number) => {
    const count = options.count()
    return ((index % count) + count) % count
  }
  /** The photo the track rests on: the active one, or the neighbour a running step goes to. */
  const restIndex = () => wrap(activeIndex.value + leadStep())
  /** The neighbour a track drawn `position` px from its resting place shows. */
  const shownBeside = (position: number) => wrap(restIndex() + (-position * sign() > 0 ? 1 : -1))

  /** How far a track drawn `position` px from rest is from its photo, as a share of a photo. */
  const shareOf = (position: number) => Math.min(1, Math.abs(position) / width)

  /** Tell the glow what the track draws now: one style write when only the share changed. */
  function follow() {
    const glow = options.glow()
    if (!glow || options.count() < 2) return
    const share = shareOf(offset)
    glow.show(restIndex(), share > 0 ? shownBeside(offset) : null, share)
  }

  function measure() {
    width = viewport.value?.getBoundingClientRect().width || width
  }

  function setShift(element: Element | undefined, value: string) {
    if (!(element instanceof HTMLElement)) return
    if ((shifted.get(element) ?? '') === value) return
    element.style.translate = value
    if (value) shifted.set(element, value)
    else shifted.delete(element)
  }

  /** Move the neighbours, wherever they sit in the track, beside the active slide. */
  function placeNeighbours() {
    const slides = track()?.children
    const count = options.count()
    const wanted = new Map<Element, string>()
    if (slides && count > 1) {
      const active = activeIndex.value
      const place = (index: number, side: number) => {
        const element = slides[index]
        const shift = (side - (index - active)) * width * sign()
        if (element && shift) wanted.set(element, `${shift}px 0`)
      }
      if (count === 2) {
        // The other photo is the neighbour on both sides. It arrives on the side of the step,
        // and otherwise sits where the drag or the settle reveals it.
        const other = 1 - active
        const shown = offset || (settle ? (settlePositions[0] ?? 0) : 0)
        place(other, leadStep() || (shown === 0 ? other - active : shown * sign() < 0 ? 1 : -1))
      } else {
        place((active + 1) % count, 1)
        place((active - 1 + count) % count, -1)
        if (jumpFrom) place(jumpFrom.index, jumpFrom.side)
      }
    }
    for (const element of shifted.keys()) if (!wanted.has(element)) setShift(element, '')
    for (const [element, value] of wanted) setShift(element, value)
  }

  function paint() {
    const element = track()
    if (!element) return
    element.style.transform = `translate3d(${base() + offset}px, 0, 0)`
    // Writes only when a neighbour changed: a spacer swapped for its slide, or the side of a
    // two-photo collection.
    placeNeighbours()
  }

  function forgetJump() {
    if (!jumpFrom) return
    const index = jumpFrom.index
    jumpFrom = null
    if (index !== activeIndex.value) leaving.value = leaving.value.filter((item) => item !== index)
  }

  function stopSettle() {
    settle?.cancel()
    settle = null
    glowSettle?.cancel()
    glowSettle = null
  }

  const keyframes = () =>
    settlePositions.map((position) => ({ transform: `translate3d(${base() + position}px, 0, 0)` }))

  /** Change to the neighbour the running settle goes to; the watch then re-bases the settle. */
  function changePhoto() {
    if (change.kind !== 'lead') return
    change.cancel()
    const { to } = change
    change = { kind: 'asked', to }
    options.requestIndex(to)
    if (activeIndex.value !== to) {
      change = { kind: 'idle' }
      paint()
    }
  }

  /**
   * Settle toward the neighbour `step` away now and change the photo to `to` after a frame has
   * shown the settle and {@link CHANGE_DELAY_MS}.
   */
  function lead(to: number, step: number) {
    const released = performance.now()
    let timer: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(changePhoto, Math.max(0, CHANGE_DELAY_MS - (performance.now() - released)))
    })
    change = {
      kind: 'lead',
      to,
      step,
      cancel: () => {
        cancelAnimationFrame(frame)
        clearTimeout(timer)
      },
    }
  }

  /** The photo changed under the settle: the same place on screen at the same time. */
  function rebase() {
    const effect = settle?.effect
    if (typeof KeyframeEffect !== 'undefined' && effect instanceof KeyframeEffect)
      effect.setKeyframes(keyframes())
    paint()
  }

  /** Read where the track is drawn now and keep it there. */
  function freeze() {
    const element = track()
    if (!settle || !element) return false
    const transform = getComputedStyle(element).transform
    if (transform && transform !== 'none' && typeof DOMMatrixReadOnly === 'function')
      offset = new DOMMatrixReadOnly(transform).m41 - base()
    stopSettle()
    paint()
    follow()
    return true
  }

  /** The glow's half of a settle: photo `from` toward the resting photo, or back from a neighbour. */
  function settleGlow(from: number | undefined, duration: number) {
    const glow = options.glow()
    const first = settlePositions[0] ?? 0
    if (!glow || options.count() < 2 || first === 0) return null
    const rest = restIndex()
    if (from !== undefined && from !== rest)
      return glow.settle(
        from,
        rest,
        settlePositions.map((position) => 1 - shareOf(position)),
        duration,
      )
    // Back to the photo it rests on: the neighbour shown leaves; past rest it shows no more.
    const side = Math.sign(first)
    return glow.settle(
      rest,
      shownBeside(first),
      settlePositions.map((position) => (Math.sign(position) === side ? shareOf(position) : 0)),
      duration,
    )
  }

  /**
   * Settle from `offset` to rest with the release `velocity` in px/ms, leaving photo `from`
   * when it is not the one the track rests on. A settle `released` by a pointer starts from the
   * drag's last move, at most one frame back; other settles start in the next frame. The glow's
   * crossfade starts with it.
   */
  function animateToRest(velocity: number, released = false, from?: number) {
    const element = track()
    if (!element || Math.abs(offset) < 0.5 || options.reducedMotion()) {
      offset = 0
      forgetJump()
      layout()
      follow()
      return
    }
    const { duration, positions } = planSettle(offset, velocity)
    settlePositions = positions
    offset = 0
    paint()
    if (typeof element.animate !== 'function') {
      forgetJump()
      layout()
      follow()
      return
    }
    // Sampled spring, played linearly: it runs on the compositor in every browser.
    const animation = element.animate(keyframes(), { duration, easing: 'linear' })
    const glow = settleGlow(from, duration)
    const since = released ? movedAt : undefined
    const gate = createStartGate()
    gate.hold(animation)
    if (glow) gate.hold(glow)
    gate.startNextFrame(since)
    settle = animation
    glowSettle = glow
    void animation.finished
      .then(() => {
        if (settle !== animation) return
        settle = null
        glowSettle = null
        changePhoto()
        forgetJump()
        paint()
      })
      .catch(() => {})
  }

  /** Draw the track for the active photo; called when the photo, the width or the mode changes. */
  function layout() {
    const element = track()
    if (!element) return
    if (!options.enabled()) {
      stopSettle()
      offset = 0
      element.style.transform = ''
      for (const slide of shifted.keys()) setShift(slide, '')
      return
    }
    measure()
    paint()
  }

  /** Start a drag. Returns true when it caught the track while it was settling. */
  function begin() {
    const caught = freeze()
    changePhoto()
    measure()
    dragOrigin = offset
    return caught
  }

  function drag(deltaX: number) {
    movedAt = performance.now()
    const raw = dragOrigin + deltaX
    if (options.count() < 2) {
      // Nowhere to go: the photo follows less and less, and settles back on release.
      const limit = width * RUBBER_BAND_SHARE
      offset = Math.sign(raw) * limit * (1 - 1 / (Math.abs(raw) / limit + 1))
    } else {
      const limit = width * MAX_DRAG_SHARE
      offset = Math.min(limit, Math.max(-limit, raw))
    }
    paint()
    follow()
  }

  /**
   * End a drag: go to the neighbour the release points at, or settle back. `lead` is the
   * pointer distance before the drag locked, which the track did not draw; the decision counts
   * it, so a release goes where the whole pointer movement points.
   */
  function release(velocityX: number, pointerType: string, lead = 0) {
    const count = options.count()
    const velocity = Math.abs(velocityX) < MIN_FLICK_VELOCITY ? 0 : velocityX
    const force =
      velocity * (pointerType === 'mouse' ? FLICK_PROJECTION.mouse : FLICK_PROJECTION.touch)
    const flick = Math.min(FLICK_MAX_PX, Math.max(FLICK_MIN_PX, width * FLICK_SHARE))
    // Steps count toward the next photo: dragging toward the start edge shows it.
    const shown = -(offset + lead) * sign()
    let step = 0
    if (count > 1) {
      if (Math.abs(force) >= flick) {
        step = -Math.sign(force) * sign()
        // A flick back from past the middle returns to the photo, not beyond it.
        if (step * shown < 0 && Math.abs(shown) > width * SNAP_SHARE) step = 0
      } else {
        const projected = shown - force * sign()
        if (Math.abs(projected) > width * SNAP_SHARE) step = Math.sign(projected)
      }
    }
    if (step === 0) animateToRest(velocity, true)
    else go(step, velocity, undefined, true)
  }

  /**
   * Change photos by `step` (±1) and settle from where the track is drawn now. A step
   * `released` by a pointer to a neighbour moves first and changes the photo later; other
   * steps change the photo at once, so the active photo follows a call without delay.
   */
  function go(step: number, velocity = 0, target?: number, released = false) {
    freeze()
    changePhoto()
    const count = options.count()
    const from = activeIndex.value
    const neighbour = (((from + step) % count) + count) % count
    const to = target ?? neighbour
    if (to === from) {
      animateToRest(velocity, released)
      return
    }
    measure()
    // The photo arriving keeps its place on screen once the track rests on it.
    offset += step * width * sign()
    if (released && to === neighbour && !options.reducedMotion()) {
      // The neighbour already sits beside the active photo: settle on it now, change after.
      lead(to, step)
      animateToRest(velocity, true, from)
      return
    }
    if (to !== neighbour) {
      forgetJump()
      jumpFrom = { index: from, side: -step }
      leaving.value = [...leaving.value.filter((item) => item !== from), from]
    }
    change = { kind: 'jump', from, velocity }
    options.requestIndex(to)
  }

  /** Show the active photo at rest at once, ending any drag or settle. */
  function stop() {
    stopSettle()
    changePhoto()
    if (change.kind === 'jump') change = { kind: 'idle' }
    offset = 0
    forgetJump()
    layout()
    follow()
  }

  watch(
    activeIndex,
    (index) => {
      const current = change
      change = { kind: 'idle' }
      if (current.kind === 'asked' && index === current.to) {
        rebase()
        return
      }
      if (current.kind !== 'jump' || !options.enabled()) {
        // Changed from outside the track (history, an instant jump): show it at rest.
        stopSettle()
        offset = 0
        forgetJump()
        layout()
        return
      }
      animateToRest(current.velocity, false, current.from)
    },
    { flush: 'post' },
  )
  // A getter, not the shallow ref itself: a shallow source would rerun this on every change of
  // the other sources' dependencies, even when their values stayed the same.
  watch(
    [() => viewport.value, () => options.enabled(), () => options.direction(), options.geometry],
    () => stop(),
    { flush: 'post' },
  )
  onBeforeUnmount(() => {
    if (change.kind === 'lead') change.cancel()
    stopSettle()
  })

  return { begin, drag, release, go, stop, settling: () => settle !== null }
}
