function abortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Operation aborted', 'AbortError')
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  )
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError(signal)
}

export function abortable<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!signal) return promise
  throwIfAborted(signal)

  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(abortError(signal))
    signal.addEventListener('abort', abort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
  })
}

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) return new Promise((resolve) => setTimeout(resolve, ms))
  throwIfAborted(signal)
  const activeSignal = signal

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(done, ms)
    const abort = () => {
      clearTimeout(timeout)
      activeSignal.removeEventListener('abort', abort)
      reject(abortError(activeSignal))
    }
    function done() {
      activeSignal.removeEventListener('abort', abort)
      resolve()
    }
    activeSignal.addEventListener('abort', abort, { once: true })
  })
}

export function nextFrame(signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()))
  }
  throwIfAborted(signal)
  const activeSignal = signal

  return new Promise<void>((resolve, reject) => {
    let frame = 0
    const abort = () => {
      cancelAnimationFrame(frame)
      activeSignal.removeEventListener('abort', abort)
      reject(abortError(activeSignal))
    }
    function done() {
      activeSignal.removeEventListener('abort', abort)
      resolve()
    }
    activeSignal.addEventListener('abort', abort, { once: true })
    frame = requestAnimationFrame(done)
  })
}

export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3
}

function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2
}

export function animateNumber(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  easing = easeInOutCubic,
  signal?: AbortSignal,
): Promise<void> {
  throwIfAborted(signal)
  if (durationMs <= 0) {
    onUpdate(to)
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const start = performance.now()
    let frameId = 0

    const abort = () => {
      cancelAnimationFrame(frameId)
      signal?.removeEventListener('abort', abort)
      reject(signal ? abortError(signal) : new Error('Animation aborted'))
    }
    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      onUpdate(from + (to - from) * easing(progress))
      if (progress < 1) {
        frameId = requestAnimationFrame(frame)
        return
      }
      signal?.removeEventListener('abort', abort)
      resolve()
    }

    signal?.addEventListener('abort', abort, { once: true })
    frameId = requestAnimationFrame(frame)
  })
}
