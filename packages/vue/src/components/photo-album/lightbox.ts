import {
  computed,
  inject,
  onBeforeUnmount,
  watch,
  type Component,
  type ComponentPublicInstance,
  type ComputedRef,
} from 'vue'
import { useLightboxProvider } from '../../composables/index'
import { PhotoGroupContextKey } from '../photo-group/context'
import {
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
} from '../../core/index'
import { LightboxComponentKey } from '../../provide/keys'
import Lightbox from '../Lightbox.vue'
import { warnOnSetupOptionChanges } from '../../internal/staticOptionWarnings'
import { createPhotoTriggerBindings } from '../shared/photoTriggerBindings'
import { resolveLightboxComponent } from '../shared/resolveLightboxComponent'

type AlbumLightboxProps = {
  lightbox?: boolean | Component
  transition?: LightboxTransitionOption
  imageAdapter?: ImageAdapter
}

export function useAlbumLightbox(
  photos: ComputedRef<PhotoItem[]>,
  props: AlbumLightboxProps,
) {
  const parentGroup = inject(PhotoGroupContextKey, null)
  warnOnSetupOptionChanges('PhotoAlbum', {
    lightbox: () => props.lightbox,
    transition: () => props.transition,
    imageAdapter: () => props.imageAdapter,
  })
  const delegatedGroup = parentGroup?.enabled ? parentGroup : null
  const injectedLightbox = inject(LightboxComponentKey, null)

  const resolvedLightboxComponent = !parentGroup
    ? resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox, true)
    : null
  const hasOwnLightbox = resolvedLightboxComponent !== null
  const hasLightbox = computed(() => !!delegatedGroup || hasOwnLightbox)
  const LightboxComponent: Component | null = resolvedLightboxComponent

  const ownCtx = hasOwnLightbox
    ? useLightboxProvider(photos, {
        transition: props.transition,
        imageAdapter: props.imageAdapter,
      })
    : null

  const thumbElsMap: Record<number, HTMLElement | null> = {}

  function setItemRef(index: number) {
    return (el: Element | ComponentPublicInstance | null) => {
      thumbElsMap[index] = el as HTMLElement | null
    }
  }

  function syncOwnThumbRefs() {
    if (!ownCtx) return
    for (const [index, element] of Object.entries(thumbElsMap)) {
      ownCtx.setThumbnailRef(Number(index))(element)
    }
  }

  function activatePhoto(photo: PhotoItem, index: number) {
    if (delegatedGroup) {
      return delegatedGroup.activateById(photo.id, thumbElsMap[index])
    }

    if (!ownCtx) return
    syncOwnThumbRefs()
    return ownCtx.open(index)
  }

  function itemBindings(photo: PhotoItem, index: number) {
    const base = { ref: setItemRef(index) }
    if (
      !hasLightbox.value ||
      (delegatedGroup && !delegatedGroup.hasPhoto(photo.id))
    )
      return base

    return {
      ...base,
      ...createPhotoTriggerBindings(photo, index, () =>
        activatePhoto(photo, index),
      ),
    }
  }

  function isHidden(photo: PhotoItem): boolean {
    if (delegatedGroup) {
      return delegatedGroup.hiddenPhoto.value?.id === photo.id
    }
    if (ownCtx) {
      const index = ownCtx.hiddenThumbnailIndex.value
      if (index === null) return false
      return photos.value[index] === photo
    }
    return false
  }

  const capabilityOwner = Symbol('PhotoAlbum')

  function removeCapabilities() {
    parentGroup?.removeCapabilities(capabilityOwner)
  }

  function syncCapabilities(nextPhotos: PhotoItem[]) {
    const group = delegatedGroup
    if (!group) {
      removeCapabilities()
      return
    }

    group.replaceCapabilities(
      capabilityOwner,
      nextPhotos.map((photo, index) => ({
        id: photo.id,
        getThumbnailElement: () => thumbElsMap[index] ?? null,
        renderSlide: null,
      })),
    )
  }

  watch(
    photos,
    (nextPhotos) => {
      syncCapabilities(nextPhotos)
    },
    { flush: 'post' },
  )

  syncCapabilities(photos.value)

  onBeforeUnmount(removeCapabilities)

  return {
    hasLightbox,
    hasOwnLightbox,
    LightboxComponent,
    itemBindings,
    isHidden,
  }
}
