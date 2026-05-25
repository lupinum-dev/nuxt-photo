import { photoId, type PhotoItem } from '@nuxt-photo/core'
import type {
  LightboxController,
  InternalLightboxContext,
} from '../provide/keys'
import { devWarn } from '../internal/runtime'

export function createLightboxController(
  context: InternalLightboxContext,
): LightboxController {
  async function openPhoto(photo: PhotoItem) {
    const index = context.photos.value.findIndex(
      (item) => photoId(item) === photoId(photo),
    )
    if (index < 0) {
      devWarn(`No photo found for id "${photoId(photo)}"`)
      return
    }
    await context.open(index)
  }

  async function openById(id: string | number) {
    const index = context.photos.value.findIndex(
      (photo) => photoId(photo) === String(id),
    )
    if (index < 0) {
      devWarn(`No photo found for id "${String(id)}"`)
      return
    }
    await context.open(index)
  }

  return {
    photos: context.photos,
    count: context.count,
    activeIndex: context.activeIndex,
    activePhoto: context.activePhoto,
    isOpen: context.isOpen,
    open: context.open,
    openPhoto,
    openById,
    close: context.close,
    next: context.next,
    prev: context.prev,
    toggleZoom: context.toggleZoom,
  }
}
