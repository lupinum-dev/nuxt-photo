import {
  computed,
  inject,
  onBeforeUnmount,
  watch,
  type Component,
  type ComponentPublicInstance,
  type ComputedRef,
} from 'vue'
import { provideLightbox } from '../../composables/index'
import { PhotoGroupContextKey } from '../photo-group/context'
import type { ImageAdapter, LightboxTransitionOption, PhotoItem } from '../../core/index'
import { LightboxComponentKey } from '../../provide/keys'
import Lightbox from '../Lightbox.vue'
import { createPhotoTriggerBindings } from '../shared/photoTriggerBindings'
import { resolveLightboxComponent } from '../shared/resolveLightboxComponent'
import { usePhotoLabels } from '../../provide/labels'

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
  const injectedLightbox = inject(LightboxComponentKey, null)

  const LightboxComponent = computed<Component | null>(() =>
    !parentGroup
      ? resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox)
      : null,
  )
  const hasOwnLightbox = computed(() => LightboxComponent.value !== null)
  const hasLightbox = computed(() => parentGroup?.enabled.value ?? hasOwnLightbox.value)

  const ownCtx = !parentGroup
    ? provideLightbox(photos, {
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
    if (parentGroup) {
      return parentGroup.activateById(photo.id, thumbElsMap[index])
    }

    if (!ownCtx || !hasOwnLightbox.value) return
    syncOwnThumbRefs()
    return ownCtx.open(index)
  }

  function itemBindings(photo: PhotoItem<TMeta>, index: number) {
    const base = { ref: setItemRef(index) }
    if (!isPhotoInteractive(photo)) return base

    return {
      ...base,
      ...createPhotoTriggerBindings(
        () => activatePhoto(photo, index),
        photo.alt || labels.value.viewPhoto(index + 1),
      ),
    }
  }

  function isPhotoInteractive(photo: PhotoItem<TMeta>) {
    return hasLightbox.value && (!parentGroup || parentGroup.hasPhoto(photo.id))
  }

  function isHidden(photo: PhotoItem<TMeta>): boolean {
    if (parentGroup) {
      return parentGroup.hiddenPhoto.value?.id === photo.id
    }
    if (ownCtx) {
      const index = ownCtx.hiddenThumbnailIndex.value
      if (index === null) return false
      return photos.value[index] === photo
    }
    return false
  }

  const labels = usePhotoLabels()

  async function open(index = 0) {
    if (parentGroup) return parentGroup.open(index)
    if (!ownCtx || !hasOwnLightbox.value) return
    syncOwnThumbRefs()
    await ownCtx.open(index)
  }

  async function openById(id: string) {
    if (parentGroup) return parentGroup.openById(id)
    if (!ownCtx || !hasOwnLightbox.value) return
    syncOwnThumbRefs()
    await ownCtx.openById(id)
  }

  async function close() {
    if (parentGroup) return parentGroup.close()
    await ownCtx?.close()
  }

  const isOpen = computed(
    () => parentGroup?.isOpen.value ?? (hasOwnLightbox.value && ownCtx?.isOpen.value) ?? false,
  )

  watch(hasOwnLightbox, (enabled) => {
    if (!enabled && ownCtx?.isOpen.value) void ownCtx.close()
  })

  const capabilityOwner = Symbol('PhotoAlbum')

  function removeCapabilities() {
    parentGroup?.removeCapabilities(capabilityOwner)
  }

  function syncCapabilities(nextPhotos: PhotoItem<TMeta>[]) {
    const group = parentGroup?.enabled.value ? parentGroup : null
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
    [photos, () => parentGroup?.enabled.value],
    ([nextPhotos]) => {
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
    isPhotoInteractive,
    isHidden,
    open,
    openById,
    close,
    isOpen,
  }
}
