import { devWarn, photoId, type PhotoItem } from '@nuxt-photo/core'
import { useLightboxInject } from './useLightboxInject'

/** Consume the nearest lightbox context as a simple controller/read-model API. */
export function useLightbox() {
  const context = useLightboxInject('useLightbox')

  function open(index = 0) {
    return context.open(index)
  }

  function openPhoto(photo: PhotoItem) {
    return context.open(photo)
  }

  function openById(id: string | number) {
    const index = context.photos.value.findIndex(
      (photo) => photoId(photo) === String(id),
    )
    if (index < 0) {
      devWarn(`No photo found for id "${String(id)}"`)
      return Promise.resolve()
    }
    return context.open(index)
  }

  return {
    open,
    openPhoto,
    openById,
    close: context.close,
    next: context.next,
    prev: context.prev,
    isOpen: context.isOpen,
    activeIndex: context.activeIndex,
    activePhoto: context.activePhoto,
    count: context.count,
  }
}
