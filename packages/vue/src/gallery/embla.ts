import type { EmblaCarouselType } from 'embla-carousel'
import type { GalleryRuntime } from './runtime'

/** Keep Embla as a projection of gallery identity, including its synchronous reInit events. */
export function createGalleryEmblaBridge(gallery: GalleryRuntime) {
  let synchronizing = false
  let renderedIds = gallery.photos.value.map((photo) => photo.id)
  const collectionChanged = () => {
    const photos = gallery.photos.value
    return (
      photos.length !== renderedIds.length ||
      photos.some((photo, index) => photo.id !== renderedIds[index])
    )
  }
  function beforeReinit() {
    synchronizing = true
    // Resize notifications need not produce a reInit when dimensions stayed equal.
    queueMicrotask(() => {
      synchronizing = false
    })
    return true
  }
  function sync(api: EmblaCarouselType, instant = false, reinitialized = false) {
    synchronizing = true
    try {
      const changed = collectionChanged()
      if (reinitialized || api.selectedScrollSnap() !== gallery.activeIndex.value)
        api.scrollTo(gallery.activeIndex.value, instant || changed)
      if (reinitialized) renderedIds = gallery.photos.value.map((photo) => photo.id)
    } finally {
      synchronizing = false
    }
  }
  function select(api: EmblaCarouselType) {
    if (!synchronizing && !collectionChanged()) gallery.requestIndex(api.selectedScrollSnap())
  }
  return { beforeReinit, sync, select }
}
