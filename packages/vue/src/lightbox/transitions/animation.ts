export function abortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Operation aborted', 'AbortError')
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
  )
}

export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw abortError(signal)
}

/**
 * A promise `arm` settles. It rejects with the signal's reason once the signal aborts, after
 * the cleanup `arm` returned has run; an already aborted signal rejects before `arm` runs.
 */
export function abortable<T>(
  signal: AbortSignal,
  arm: (resolve: (value: T) => void, reject: (error: unknown) => void) => (() => void) | void,
) {
  return new Promise<T>((resolve, reject) => {
    let cleanup: (() => void) | void
    const abort = () => {
      cleanup?.()
      reject(abortError(signal))
    }
    const settle =
      <V>(done: (value: V) => void) =>
      (value: V) => {
        signal.removeEventListener('abort', abort)
        done(value)
      }
    if (signal.aborted) return abort()
    // Listen first: `arm` may settle at once, and settling removes the listener.
    signal.addEventListener('abort', abort, { once: true })
    cleanup = arm(settle(resolve), settle(reject))
  })
}

export function wait(ms: number, signal: AbortSignal) {
  throwIfAborted(signal)
  return abortable<void>(signal, (resolve) => {
    const timeout = setTimeout(resolve, ms)
    return () => clearTimeout(timeout)
  })
}

/** Resolve in the next frame callback, with that frame's time stamp. */
export function nextFrame(signal: AbortSignal) {
  throwIfAborted(signal)
  return abortable<number>(signal, (resolve) => {
    const frame = requestAnimationFrame(resolve)
    return () => cancelAnimationFrame(frame)
  })
}

/** One frame of a 60 Hz screen, in ms. */
const FRAME_MS = 1000 / 60

/**
 * When an animation's clock starts. Each animation is held at time zero when it is created; a
 * frame callback then gives them all that frame's time, so the first frame that draws them shows
 * time zero in both engines. A pending animation would fix its own start instead: WebKit
 * sometimes takes a time before the frame and draws up to two frames of motion at once.
 *
 * `movedAt`, for a settle after a drag, is when the drag last moved the photo: the clock then
 * starts `min(now - movedAt, one frame)` back, so the first frame shows the time since the photo
 * was last placed, never more than one frame of it, wherever in the frame the release landed.
 */
export function createStartGate() {
  const held: Animation[] = []
  const start = (now: number, movedAt = Number.POSITIVE_INFINITY) => {
    const back = Math.min(Math.max(now - movedAt, 0), FRAME_MS)
    // An animation cancelled meanwhile, by a catch or a new gesture, stays cancelled.
    for (const animation of held)
      if (animation.playState === 'paused') animation.startTime = now - back
  }
  return {
    hold: (animation: Animation) => {
      animation.pause()
      animation.currentTime = 0
      held.push(animation)
    },
    /** Start every held animation at `now`, a frame callback's time. */
    start,
    /** Start every held animation in the next frame callback. */
    startNextFrame: (movedAt?: number) => requestAnimationFrame((now) => start(now, movedAt)),
  }
}

export type StartGate = ReturnType<typeof createStartGate>
