import { devWarn } from '../env'
import { IMAGE_LOAD_CACHE_LIMIT } from './constants'

const imageLoadCache = new Map<string, Promise<void>>()

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
