const imageLoadCache = new Map<string, Promise<void>>()

export function ensureImageLoaded(src: string): Promise<void> {
  const cached = imageLoadCache.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = src

    if (image.decode) {
      image.decode().catch(() => {}).finally(resolve)
      return
    }

    if (image.complete) {
      resolve()
    }
  })

  imageLoadCache.set(src, promise)
  return promise
}
