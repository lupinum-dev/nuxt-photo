import { IMAGE_LOAD_CACHE_LIMIT } from './constants'

type ImageDimensions = { width: number; height: number }

const dimensionCache = new Map<string, ImageDimensions>()

/**
 * Load an image and resolve its intrinsic dimensions.
 *
 * For CMS workflows where dimensions are not known until upload metadata
 * arrives: fetch the source once on the client, then build `PhotoItem`s from
 * the resolved values so layouts stay deterministic and CLS-free.
 * Results are cached by URL. Runs in the browser only.
 *
 * @example
 * const { width, height } = await measureImage(photo.url)
 * const item: PhotoItem = { id: photo.id, src: photo.url, width, height }
 */
export function measureImage(src: string): Promise<ImageDimensions> {
  const cached = dimensionCache.get(src)
  if (cached) return Promise.resolve(cached)

  if (typeof Image === 'undefined') {
    return Promise.reject(
      new Error('[nuxt-photo] measureImage() requires a browser environment; resolve dimensions server-side instead.'),
    )
  }

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const dimensions = { width: image.naturalWidth, height: image.naturalHeight }
      if (dimensionCache.size >= IMAGE_LOAD_CACHE_LIMIT) {
        dimensionCache.clear()
      }
      dimensionCache.set(src, dimensions)
      resolve(dimensions)
    }
    image.onerror = () => {
      reject(new Error(`[nuxt-photo] measureImage() could not load "${src}"`))
    }
    image.src = src
  })
}
