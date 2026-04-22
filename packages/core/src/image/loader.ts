import { devWarn } from '../env'
import { IMAGE_LOAD_CACHE_LIMIT } from './constants'

const imageLoadCache = new Map<string, Promise<void>>()

/**
 * Resolve when an image is fully ready to paint without a flash.
 *
 * Completion paths, in order of preference:
 *   1. `image.decode()` — modern, async, off-main-thread; preferred where available.
 *   2. `onload` / `onerror` — always wired; fires even when `decode()` isn't used.
 *   3. `image.complete` — synchronous check for browsers without `decode()`
 *      when the image is already in the HTTP cache and finished before we got here.
 *
 * The `settled` flag guards against double-resolve: `decode()` rejecting on CORS
 * also fires `onerror`, and either can race with a synchronous `complete` check.
 * We need the promise to resolve exactly once regardless of which path wins.
 */
export function ensureImageLoaded(src: string): Promise<void> {
  const cached = imageLoadCache.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new Image()
    let settled = false

    const settle = () => {
      if (settled) return
      settled = true
      resolve()
    }

    image.onload = () => settle()
    image.onerror = () => {
      imageLoadCache.delete(src)
      settle()
    }
    image.src = src

    if (image.decode) {
      image
        .decode()
        .catch((error) => {
          imageLoadCache.delete(src)
          devWarn(`Image decode failed for "${src}"`, error)
        })
        .finally(settle)
      return
    }

    if (image.complete) {
      settle()
    }
  })

  imageLoadCache.set(src, promise)
  if (imageLoadCache.size > IMAGE_LOAD_CACHE_LIMIT) {
    imageLoadCache.delete(imageLoadCache.keys().next().value!)
  }
  return promise
}
