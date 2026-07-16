import { computed } from 'vue'
import type { LightboxController, InternalLightboxContext } from '../provide/keys'

export function createLightboxController(context: InternalLightboxContext): LightboxController {
  async function openById(id: string) {
    const index = context.photos.value.findIndex((photo) => photo.id === id)
    if (index < 0) {
      throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
    }
    await context.open(index)
  }

  return {
    photos: computed(() => context.photos.value),
    count: computed(() => context.count.value),
    activeIndex: computed(() => context.activeIndex.value),
    activePhoto: computed(() => context.activePhoto.value),
    isOpen: computed(() => context.isOpen.value),
    open: context.open,
    openById,
    close: context.close,
    next: context.next,
    prev: context.prev,
    toggleZoom: context.toggleZoom,
  }
}
