import { computed } from 'vue'
import type { PhotoItem } from '../core/index'
import type { LightboxController, InternalLightboxContext } from '../provide/keys'

export function createLightboxController<TMeta extends object = Readonly<Record<string, unknown>>>(
  context: InternalLightboxContext,
): LightboxController<TMeta> {
  async function openById(id: string) {
    const index = context.photos.value.findIndex((photo) => photo.id === id)
    if (index < 0) {
      throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
    }
    await context.open(index)
  }

  return {
    photos: computed(() => context.photos.value as readonly PhotoItem<TMeta>[]),
    count: computed(() => context.count.value),
    activeIndex: computed(() => context.activeIndex.value),
    activePhoto: computed(() => context.activePhoto.value as PhotoItem<TMeta> | null),
    isOpen: computed(() => context.isOpen.value),
    open: context.open,
    openById,
    close: context.close,
    next: context.next,
    prev: context.prev,
    toggleZoom: context.toggleZoom,
  }
}
