import type { MaybeRef } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { useLightboxContext } from './useLightboxContext'

export function useLightbox(photosInput: MaybeRef<PhotoItem | PhotoItem[]>) {
  return useLightboxController(photosInput)
}

export function useLightboxController(photosInput: MaybeRef<PhotoItem | PhotoItem[]>) {
  const context = useLightboxContext(photosInput)

  return {
    open: context.open,
    close: context.close,
    next: context.next,
    prev: context.prev,
    isOpen: context.isOpen,
    activeIndex: context.activeIndex,
    activePhoto: context.activePhoto,
    count: context.count,
  }
}
