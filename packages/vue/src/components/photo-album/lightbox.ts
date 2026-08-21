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
import type { ImageAdapter, LightboxTransitionOption, PhotoItem } from '../../core/index'
import { LightboxComponentKey } from '../../provide/keys'
import Lightbox from '../Lightbox.vue'
import { warnOnSetupOptionChanges } from '../../internal/staticOptionWarnings'
import { createPhotoTriggerBindings } from '../shared/photoTriggerBindings'
import { resolveLightboxComponent } from '../shared/resolveLightboxComponent'
import { usePhotoLabels } from '../../composables/usePhotoLabels'

type AlbumLightboxProps<TMeta extends object> = {
  lightbox?: boolean | Component
  transition?: LightboxTransitionOption
  imageAdapter?: ImageAdapter<TMeta>
}

export function useAlbumLightbox<TMeta extends object>(
  photos: ComputedRef<PhotoItem<TMeta>[]>,
  props: AlbumLightboxProps<TMeta>,
) {
  const parentGroup = inject(PhotoGroupContextKey, null)
  warnOnSetupOptionChanges('PhotoAlbum', {
    lightbox: () => props.lightbox,
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
        transition: () => props.transition,
        imageAdapter: computed(() => props.imageAdapter),
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

  function activatePhoto(photo: PhotoItem<TMeta>, index: number) {
    if (delegatedGroup) {
      return delegatedGroup.activateById(photo.id, thumbElsMap[index])
    }

    if (!ownCtx) return
    syncOwnThumbRefs()
    return ownCtx.open(index)
  }

  const labels = usePhotoLabels()

  function itemBindings(photo: PhotoItem<TMeta>, index: number) {
    const base = { ref: setItemRef(index) }
    if (!hasLightbox.value || (delegatedGroup && !delegatedGroup.hasPhoto(photo.id))) return base

    return {
      ...base,
      ...createPhotoTriggerBindings(
        photo,
        index,
        () => activatePhoto(photo, index),
        photo.alt || labels.viewPhoto(index + 1),
      ),
    }
  }

  function isHidden(photo: PhotoItem<TMeta>): boolean {
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

  // Programmatic control surface, exposed by PhotoAlbum. Delegates to a parent
  // PhotoGroup when present; otherwise drives the album's own lightbox.
  async function open(index = 0) {
    if (delegatedGroup) return delegatedGroup.open(index)
    if (!ownCtx) return
    syncOwnThumbRefs()
    await ownCtx.open(index)
  }

  async function openById(id: string) {
    if (delegatedGroup) return delegatedGroup.activateById(id)
    if (!ownCtx) return
    const index = photos.value.findIndex((photo) => photo.id === id)
    if (index < 0) {
      throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
    }
    syncOwnThumbRefs()
    await ownCtx.open(index)
  }

  async function close() {
    if (delegatedGroup) return delegatedGroup.close()
    await ownCtx?.close()
  }

  const isOpen = computed(() => delegatedGroup?.isOpen.value ?? ownCtx?.isOpen.value ?? false)

  const capabilityOwner = Symbol('PhotoAlbum')

  function removeCapabilities() {
    parentGroup?.removeCapabilities(capabilityOwner)
  }

  function syncCapabilities(nextPhotos: PhotoItem<TMeta>[]) {
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
    open,
    openById,
    close,
    isOpen,
  }
}
