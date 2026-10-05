/** One observer per document or clipped carousel track, shared by every image in it. */
const observers = new WeakMap<
  Document | Element,
  {
    observer: IntersectionObserver
    images: Map<Element, () => void>
  }
>()

export function observeAhead(image: HTMLImageElement, load: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  const root = image.closest('.np-carousel__viewport, .np-carousel__thumbs-viewport')
  const key = root ?? image.ownerDocument
  let shared = observers.get(key)
  if (!shared) {
    const view = image.ownerDocument.defaultView!
    const connection = (view.navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection
    const factor = connection?.saveData ? 0.5 : 1.5
    const vertical = view.innerHeight * factor
    const horizontal = root ? view.innerWidth * factor : 0
    const images = new Map<Element, () => void>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) images.get(entry.target)?.()
        }
      },
      { root, rootMargin: `${vertical}px ${horizontal}px` },
    )
    shared = { observer, images }
    observers.set(key, shared)
  }
  const { observer, images } = shared
  images.set(image, load)
  observer.observe(image)
  return () => {
    observer.unobserve(image)
    images.delete(image)
    if (!images.size) {
      observer.disconnect()
      observers.delete(key)
    }
  }
}
