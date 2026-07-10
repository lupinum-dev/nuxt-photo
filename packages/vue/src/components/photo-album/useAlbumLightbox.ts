import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  watch,
  type Component,
  type ComponentPublicInstance,
  type ComputedRef,
} from 'vue'
import { useLightboxProvider } from '../../composables/index'
import { PhotoGroupContextKey } from '../../context/photoGroup'
import {
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
} from '../../core/index'
import { LightboxComponentKey } from '../../provide/keys'
import Lightbox from '../Lightbox.vue'
import { warnOnSetupOptionChanges } from '../shared/staticOptionWarnings'

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

  const hasOwnLightbox = !parentGroup && props.lightbox !== false
  const hasLightbox = computed(() => !!delegatedGroup || hasOwnLightbox)
  const LightboxComponent: Component | null = !hasOwnLightbox
    ? null
    : props.lightbox === true
      ? (injectedLightbox ?? Lightbox)
      : (props.lightbox as Component)

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

  function openPhoto(photo: PhotoItem, index: number) {
    if (delegatedGroup) {
      void delegatedGroup.openById(photo.id)
      return
    }

    if (!ownCtx) return
    syncOwnThumbRefs()
    void ownCtx.open(index)
  }

  function handleItemKeydown(
    event: KeyboardEvent,
    photo: PhotoItem,
    index: number,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPhoto(photo, index)
    }
  }

  function itemBindings(photo: PhotoItem, index: number) {
    const base = { ref: setItemRef(index) }
    if (!hasLightbox.value) return base

    return {
      ...base,
      role: 'button',
      tabindex: '0',
      'aria-label': photo.alt || `View photo ${index + 1}`,
      onClick: () => openPhoto(photo, index),
      onKeydown: (event: KeyboardEvent) =>
        handleItemKeydown(event, photo, index),
    }
  }

  function isHidden(photo: PhotoItem): boolean {
    if (delegatedGroup) {
      return delegatedGroup.hiddenPhoto.value === photo
    }
    if (ownCtx) {
      const index = ownCtx.hiddenThumbnailIndex.value
      if (index === null) return false
      return photos.value[index] === photo
    }
    return false
  }

  let registrationIds: symbol[] = []
  let registeredPhotos: PhotoItem[] = []

  function clearRegistrations() {
    for (const symbol of registrationIds) {
      parentGroup?.unregister(symbol)
    }
    registrationIds = []
    registeredPhotos = []
  }

  function syncRegistrations(nextPhotos: PhotoItem[]) {
    const group = delegatedGroup
    if (!group) {
      clearRegistrations()
      return
    }

    if (
      registeredPhotos.length === nextPhotos.length &&
      nextPhotos.every((photo, index) => registeredPhotos[index] === photo)
    ) {
      return
    }

    clearRegistrations()

    registrationIds = nextPhotos.map((photo, index) => {
      const symbol = Symbol(photo.id)
      group.register(symbol, photo, () => thumbElsMap[index] ?? null, null)
      return symbol
    })
    registeredPhotos = [...nextPhotos]
  }

  watch(
    photos,
    (nextPhotos) => {
      syncRegistrations(nextPhotos)
    },
    { flush: 'post' },
  )

  onMounted(() => syncRegistrations(photos.value))

  onBeforeUnmount(clearRegistrations)

  return {
    hasLightbox,
    hasOwnLightbox,
    LightboxComponent,
    itemBindings,
    isHidden,
  }
}
