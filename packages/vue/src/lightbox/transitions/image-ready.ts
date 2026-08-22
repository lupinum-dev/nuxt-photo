export type ImageReadyResult = { ok: true } | { ok: false; error: unknown }

type ImageReadyOptions = {
  timeoutMs: number
  waitForLoadWithoutDecode: boolean
}

function abortReason(signal: AbortSignal) {
  return signal.reason ?? new DOMException('Operation aborted', 'AbortError')
}

/** Wait for image readiness while owning every listener, timer, and abort path. */
export function waitForImageReady(
  image: HTMLImageElement,
  signal: AbortSignal,
  options: ImageReadyOptions,
): Promise<ImageReadyResult> {
  if (signal.aborted) return Promise.reject(abortReason(signal))
  if (image.complete && image.naturalWidth > 0) return Promise.resolve({ ok: true })

  const decode = image.decode?.bind(image)
  if (!decode && !options.waitForLoadWithoutDecode) return Promise.resolve({ ok: true })

  return new Promise((resolve, reject) => {
    let settled = false
    const cleanup = () => {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
      image.removeEventListener('load', loaded)
      image.removeEventListener('error', failed)
    }
    const finish = (result: ImageReadyResult) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
    }
    const abort = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(abortReason(signal))
    }
    const loaded = () => finish({ ok: true })
    const failed = () => finish({ ok: false, error: new Error('Image failed to load') })
    const timeout = setTimeout(
      () => finish({ ok: false, error: new Error('Image load timed out') }),
      options.timeoutMs,
    )

    signal.addEventListener('abort', abort, { once: true })
    if (decode) {
      Promise.resolve()
        .then(decode)
        .then(loaded, (error: unknown) => finish({ ok: false, error }))
    } else {
      image.addEventListener('load', loaded, { once: true })
      image.addEventListener('error', failed, { once: true })
    }

    if (signal.aborted) abort()
  })
}
