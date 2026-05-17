import { devWarn } from '../env'
import { IMAGE_LOAD_CACHE_LIMIT } from './constants'

export type LoadImageResult = { ok: true } | { ok: false; error?: unknown }

const imageLoadCache = new Map<string, Promise<LoadImageResult>>()

/**
 * Load and decode an image, returning whether it is actually ready to paint.
 *
 * Completion paths, in order of preference:
 *   1. `image.decode()` — modern, async, off-main-thread; preferred where available.
 *   2. `onload` / `onerror` — always wired; fires even when `decode()` isn't used.
 *   3. `image.complete` — synchronous check for browsers without `decode()`
 *      when the image is already in the HTTP cache and finished before we got here.
 *
 *   2. `onload` / `onerror` — fallback for browsers without `decode()`.
 *   3. `image.complete` — synchronous success check for browsers without
 *      `decode()` when the image is already in the HTTP cache.
 *
 * Failed loads are not cached, so a later retry can observe a recovered URL.
 */
export function loadImage(src: string): Promise<LoadImageResult> {
  const cached = imageLoadCache.get(src)
  if (cached) return cached

  const promise = new Promise<LoadImageResult>((resolve) => {
    const image = new Image()
    let settled = false

    const settle = (result: LoadImageResult) => {
      if (settled) return
      settled = true
      if (!result.ok) imageLoadCache.delete(src)
      resolve(result)
    }

    image.onerror = () => {
      settle({ ok: false, error: new Error(`Image failed to load: ${src}`) })
    }

    if (image.decode) {
      image.src = src
      image
        .decode()
        .then(() => {
          settle({ ok: true })
        })
        .catch((error: unknown) => {
          devWarn(`Image decode failed for "${src}"`, error)
          settle({ ok: false, error })
        })
      return
    }

    image.onload = () => settle({ ok: true })
    image.src = src

    if (image.complete) {
      settle({ ok: true })
    }
  })

  imageLoadCache.set(src, promise)
  if (imageLoadCache.size > IMAGE_LOAD_CACHE_LIMIT) {
    imageLoadCache.delete(imageLoadCache.keys().next().value!)
  }
  return promise
}
