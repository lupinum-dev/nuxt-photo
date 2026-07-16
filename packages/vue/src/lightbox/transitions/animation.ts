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
