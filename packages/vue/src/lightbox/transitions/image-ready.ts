import { abortable, abortError } from './animation'

export type ImageReadyResult = { ok: true } | { ok: false; error: unknown }

type ImageReadyOptions = {
  timeoutMs: number
  waitForLoadWithoutDecode: boolean
  /** Decode a loaded image too: loaded is not yet decoded, and a ghost must not show blank. */
  decodeLoaded?: boolean
}

/** Wait for image readiness while owning every listener, timer, and abort path. */
export function waitForImageReady(
  image: HTMLImageElement,
  signal: AbortSignal,
  options: ImageReadyOptions,
): Promise<ImageReadyResult> {
  if (signal.aborted) return Promise.reject(abortError(signal))
  const decode = image.decode?.bind(image)
  if (image.complete && image.naturalWidth > 0 && !(options.decodeLoaded && decode))
    return Promise.resolve({ ok: true })

  if (!decode && !options.waitForLoadWithoutDecode) return Promise.resolve({ ok: true })

  return abortable(signal, (resolve) => {
    const finish = (result: ImageReadyResult) => {
      cleanup()
      resolve(result)
    }
    const cleanup = () => {
      clearTimeout(timeout)
      image.removeEventListener('load', loaded)
      image.removeEventListener('error', failed)
    }
    const loaded = () => finish({ ok: true })
    const failed = () => finish({ ok: false, error: new Error('Image failed to load') })
    const timeout = setTimeout(
      () => finish({ ok: false, error: new Error('Image load timed out') }),
      options.timeoutMs,
    )

    if (decode) {
      // A loaded image the browser refuses to decode ahead still draws, as it does in its slide.
      Promise.resolve()
        .then(decode)
        .then(loaded, (error: unknown) =>
          image.complete && image.naturalWidth > 0 ? loaded() : finish({ ok: false, error }),
        )
    } else {
      image.addEventListener('load', loaded, { once: true })
      image.addEventListener('error', failed, { once: true })
    }
    return cleanup
  })
}
