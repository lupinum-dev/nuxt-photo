import { computed } from 'vue'
import type { ResolvedPhotoItem as PhotoItem } from '../core/index'
import type { LightboxController, InternalLightboxContext } from '../provide/keys'
import { photoIndexOf } from '../core/photo/lookup'

export function createLightboxController<TMeta extends object = Readonly<Record<string, unknown>>>(
  context: InternalLightboxContext,
): LightboxController<TMeta> {
  async function openById(id: string) {
    await context.open(photoIndexOf(context.photos.value, id))
  }

  return {
    photos: computed(() => context.photos.value as readonly PhotoItem<TMeta>[]),
    count: computed(() => context.count.value),
    activeId: computed(() => context.activeId.value),
    activeIndex: computed(() => context.activeIndex.value),
    activePhoto: computed(() => context.activePhoto.value as PhotoItem<TMeta> | null),
    isOpen: computed(() => context.isOpen.value),
    open: (index) => context.open(index),
    openById,
    close: context.close,
    next: context.next,
    prev: context.prev,
    toggleZoom: context.toggleZoom,
  }
}
