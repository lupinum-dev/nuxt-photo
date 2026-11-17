import { computed, onBeforeUnmount, watch, type ComputedRef } from 'vue'
import type { ResolvedPhotoItem as PhotoItem } from '../../core/index'
import { photoAt, photoIndexOf } from '../../core/photo/lookup'
import type { LightboxOptions } from '../../config'
import { useGalleryModel } from '../../gallery/model'
import { createPhotoTriggerBindings } from '../shared/photoTriggerBindings'
import { useEagerLabels } from '../../provide/labels'
import { useRecipeGroup } from '../photo-group/usePhotoGroup'

type CollectionLightboxOptions<TMeta extends object> = {
  owner: string
  /** Navigation order for a group of its own; bento and mosaic pass the display order. */
  photos: ComputedRef<readonly PhotoItem<TMeta>[]>
  /** The `photos` prop order that the public `open(index)` addresses. */
  publicPhotos: ComputedRef<readonly PhotoItem<TMeta>[]>
  root: () => HTMLElement | null
  lightbox: () => boolean | LightboxOptions | undefined
  defaultEnabled: boolean
  active: () => string | null | undefined
  emitActive: (id: string | null) => void
}

/** Trigger bindings, hidden state and the gallery handle of an album or carousel. */
export function useCollectionLightbox<TMeta extends object>(
  options: CollectionLightboxOptions<TMeta>,
) {
  const { photos } = options
  const { group, lightboxComponent } = useRecipeGroup(options)
  const labels = useEagerLabels()

  /** Open a photo; `source` is the element the visitor activated, if any. */
  function activate(index: number, source: HTMLElement | null = null) {
    return group.activate(photoAt(photos.value, index).id, source)
  }

  function itemBindings(photo: PhotoItem<TMeta>, index: number) {
    if (!group.enabled || !group.hasPhoto(photo.id)) return {}
    return createPhotoTriggerBindings(
      photo,
      index,
      (source) => activate(index, source),
      photo.alt || labels.viewPhoto(index + 1),
    )
  }

  // Registration makes a surrounding PhotoGroup reject photos missing from its collection.
  const capabilityOwner = Symbol(options.owner)
  const register = (next: readonly PhotoItem<TMeta>[]) =>
    group.replaceCapabilities(
      capabilityOwner,
      next.map((photo) => ({ id: photo.id, renderSlide: null })),
    )
  register(photos.value)
  watch(photos, register, { flush: 'post' })
  onBeforeUnmount(() => group.removeCapabilities(capabilityOwner))

  // Both handle methods accept only photos this collection shows, even inside a larger group.
  async function openById(id: string) {
    photoIndexOf(photos.value, id)
    await group.openById(id)
  }

  async function open(index = 0) {
    await openById(photoAt(options.publicPhotos.value, index).id)
  }

  const { activeId, activePhoto } = useGalleryModel(
    options.owner,
    options.active,
    () => options.publicPhotos.value,
    { ...group, openById },
    options.emitActive,
  )

  return {
    lightboxComponent,
    hasLightbox: computed(() => group.enabled),
    itemBindings,
    isHidden: (photo: PhotoItem<TMeta>) => group.hiddenId.value === photo.id,
    activate,
    handle: { open, openById, close: group.close, isOpen: group.isOpen, activeId, activePhoto },
  }
}
