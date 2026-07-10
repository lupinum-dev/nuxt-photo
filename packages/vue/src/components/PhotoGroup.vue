<template>
  <slot :photos="collectedPhotos" :controller="controller" />
  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { computed, inject, provide, shallowReactive, type Component } from 'vue'
import { useLightboxProvider } from '../composables/index'
import {
  LightboxComponentKey,
  type LightboxProviderController,
  type LightboxSlideRenderer,
} from '../provide/keys'
import {
  normalizePhotos,
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
} from '../core/index'
import Lightbox from './Lightbox.vue'
import {
  PhotoGroupContextKey,
  type PhotoGroupContext,
} from './photo-group/context'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'

const props = withDefaults(
  defineProps<{
    imageAdapter?: ImageAdapter
    /** Setup-time lightbox capability. Remount to change it. */
    lightbox?: boolean | Component
    /** Setup-time transition configuration. Remount to change it. */
    transition?: LightboxTransitionOption
  }>(),
  { lightbox: true },
)

type Registration = {
  photo: PhotoItem
  getThumbnailElement: () => HTMLElement | null
  renderSlide?: LightboxSlideRenderer | null
}

const registrations = shallowReactive(new Map<symbol, Registration>())
const collectedPhotos = computed<PhotoItem[]>(() => {
  const photos = [...registrations.values()].map((entry) => entry.photo)
  return normalizePhotos(photos, {
    owner: 'PhotoGroup',
    onInvalid: 'throw',
  }).photos
})

const injectedLightbox = inject(LightboxComponentKey, null)
const lightboxComponent = resolveLightboxComponent(
  props.lightbox,
  injectedLightbox,
  Lightbox,
  true,
)
const enabled = lightboxComponent !== null
warnOnSetupOptionChanges('PhotoGroup', {
  lightbox: () => props.lightbox,
  transition: () => props.transition,
  imageAdapter: () => props.imageAdapter,
})
const provider = enabled
  ? useLightboxProvider(collectedPhotos, {
      transition: props.transition,
      imageAdapter: props.imageAdapter,
      resolveSlide: (photo) => {
        for (const entry of registrations.values()) {
          if (entry.photo.id === photo.id) return entry.renderSlide ?? null
        }
        return null
      },
    })
  : null

function register(
  id: symbol,
  photo: PhotoItem,
  getThumbnailElement: () => HTMLElement | null,
  renderSlide?: LightboxSlideRenderer | null,
) {
  const previous = registrations.get(id)
  registrations.set(id, { photo, getThumbnailElement, renderSlide })
  try {
    // Force aggregate validation at the registration boundary.
    void collectedPhotos.value
  } catch (error) {
    if (previous) registrations.set(id, previous)
    else registrations.delete(id)
    throw error
  }
}

function unregister(id: symbol) {
  registrations.delete(id)
}

function syncThumbnailRefs() {
  if (!provider) return
  ;[...registrations.values()].forEach((entry, index) => {
    provider.setThumbnailRef(index)(entry.getThumbnailElement())
  })
}

async function open(index = 0) {
  if (index < 0 || index >= collectedPhotos.value.length) {
    throw new RangeError(
      `[nuxt-photo] No photo found at index ${String(index)}`,
    )
  }
  if (!provider) return
  syncThumbnailRefs()
  await provider.open(index)
}

async function openById(id: string) {
  if (!collectedPhotos.value.some((photo) => photo.id === id)) {
    throw new RangeError(`[nuxt-photo] No photo found for id "${id}"`)
  }
  if (!provider) return
  syncThumbnailRefs()
  await provider.openById(id)
}

async function close() {
  await provider?.close()
}

const disabledController: LightboxProviderController = {
  photos: computed(() => collectedPhotos.value),
  count: computed(() => collectedPhotos.value.length),
  activeIndex: computed(() => 0),
  activePhoto: computed(() => null),
  isOpen: computed(() => false),
  open,
  openById,
  close,
  next() {},
  prev() {},
  toggleZoom() {},
  hiddenThumbnailIndex: computed(() => null),
  setThumbnailRef: () => () => {},
}

const controller: LightboxProviderController = provider
  ? { ...provider, open, openById }
  : disabledController

const hiddenPhoto = computed<PhotoItem | null>(() => {
  if (!provider) return null
  const index = provider.hiddenThumbnailIndex.value
  return index === null ? null : (collectedPhotos.value[index] ?? null)
})

const groupContext: PhotoGroupContext = {
  enabled,
  register,
  unregister,
  open,
  openById,
  photos: collectedPhotos,
  hiddenPhoto,
}
provide(PhotoGroupContextKey, groupContext)

defineExpose({ open, openById, close })
</script>
